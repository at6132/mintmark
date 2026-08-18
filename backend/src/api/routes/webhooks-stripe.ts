import { Hono } from "hono";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { env } from "../../env.js";
import { db } from "../../db/index.js";
import { orders, webhookEvents } from "../../db/schema.js";
import { stripe } from "../../lib/stripe.js";
import { fulfillPaidCheckout } from "../lib/fulfill.js";

export const stripeWebhookRoutes = new Hono();

stripeWebhookRoutes.post("/v1/webhooks/stripe", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) return c.json({ error: "Missing stripe-signature" }, 400);

  const raw = await c.req.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, signature, env().STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return c.json({ error: message }, 400);
  }

  const inserted = await db
    .insert(webhookEvents)
    .values({ id: event.id, source: "stripe" })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (!inserted.length) return c.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid" || session.status === "complete") {
          const full = await stripe().checkout.sessions.retrieve(session.id, {
            expand: ["shipping_cost.shipping_rate", "payment_intent"],
          });
          await fulfillPaidCheckout(full);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const full = await stripe().checkout.sessions.retrieve(session.id, {
          expand: ["shipping_cost.shipping_rate", "payment_intent"],
        });
        await fulfillPaidCheckout(full);
        break;
      }
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await db
            .update(orders)
            .set({ status: "canceled", updatedAt: new Date() })
            .where(eq(orders.id, orderId));
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler failed", event.type, event.id, err);
    await db.delete(webhookEvents).where(eq(webhookEvents.id, event.id));
    return c.json({ error: "Handler failed" }, 500);
  }

  return c.json({ received: true });
});
