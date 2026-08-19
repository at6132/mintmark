import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orderItems, orders, printJobs } from "../../db/schema.js";

export const orderRoutes = new Hono();

const STRIPE_SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{1,200}$/;

async function orderPayload(orderId: string) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const [job] = await db.select().from(printJobs).where(eq(printJobs.orderId, orderId)).limit(1);
  return { items, job };
}

orderRoutes.get("/v1/orders/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  if (!STRIPE_SESSION_ID.test(sessionId)) {
    return c.json({ error: "Order not found" }, 404);
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
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
          trackingId: job.trackingId,
          trackingUrl: job.trackingUrl,
          carrier: job.carrier,
        }
      : null,
  };
}
