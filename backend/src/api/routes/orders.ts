import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orderItems, orders, printJobs } from "../../db/schema.js";
import { stripe } from "../../lib/stripe.js";

export const orderRoutes = new Hono();

async function orderPayload(orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const [job] = await db.select().from(printJobs).where(eq(printJobs.orderId, orderId)).limit(1);
  return { items, job };
}

orderRoutes.get("/v1/orders/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  let [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1);

  if (!order) {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId;
    if (!orderId) return c.json({ error: "Order not found" }, 404);
    [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  }

  if (!order) return c.json({ error: "Order not found" }, 404);
  const { items, job } = await orderPayload(order.id);
  return c.json(serializeOrder(order, items, job));
});

orderRoutes.get("/v1/orders/:id", async (c) => {
  const id = c.req.param("id");
  const [order] = await db
    .select()
    .from(orders)
    .where(id.startsWith("mm_") ? eq(orders.publicId, id) : eq(orders.id, id))
    .limit(1);
  if (!order) return c.json({ error: "Order not found" }, 404);
  const { items, job } = await orderPayload(order.id);
  return c.json(serializeOrder(order, items, job));
});

function serializeOrder(
  order: typeof orders.$inferSelect,
  items: Array<typeof orderItems.$inferSelect>,
  job: typeof printJobs.$inferSelect | undefined,
) {
  return {
    order: {
      id: order.id,
      publicId: order.publicId,
      status: order.status,
      email: order.email,
      currency: order.currency,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
      shippingLevel: order.shippingLevel,
      createdAt: order.createdAt,
    },
    items: items.map((i) => ({
      productId: i.productId,
      title: i.title,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
    })),
    fulfillment: job
      ? {
          status: job.status,
          luluStatus: job.luluStatus,
          trackingId: job.trackingId,
          trackingUrl: job.trackingUrl,
          carrier: job.carrier,
        }
      : null,
  };
}
