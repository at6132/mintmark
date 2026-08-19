import { createHash } from "node:crypto";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders, printJobs, webhookEvents } from "../../db/schema.js";
import { verifyLuluHmac } from "../../lib/lulu.js";

export const luluWebhookRoutes = new Hono();

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

luluWebhookRoutes.post("/v1/webhooks/lulu", async (c) => {
  const raw = await c.req.text();
  const header = c.req.header("Lulu-HMAC-SHA256") ?? c.req.header("lulu-hmac-sha256");
  if (!verifyLuluHmac(raw, header)) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  let payload: { topic?: string; data?: Record<string, unknown> };
  try {
    payload = JSON.parse(raw) as { topic?: string; data?: Record<string, unknown> };
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const data = payload.data ?? {};
  const eventId = `lulu:${createHash("sha256").update(raw).digest("hex")}`;

  const inserted = await db
    .insert(webhookEvents)
    .values({ id: eventId, source: "lulu" })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (!inserted.length) return c.json({ received: true, duplicate: true });

  try {
    const luluId = data.id != null ? String(data.id) : "";
    if (payload.topic !== "PRINT_JOB_STATUS_CHANGED" || !luluId) {
      return c.json({ received: true });
    }

    let [job] = await db.select().from(printJobs).where(eq(printJobs.luluPrintJobId, luluId)).limit(1);
    if (!job) {
      const externalId = data.external_id != null ? String(data.external_id) : "";
      if (externalId) {
        [job] = await db.select().from(printJobs).where(eq(printJobs.orderId, externalId)).limit(1);
      }
    }
    if (!job) {
      console.warn("lulu webhook for unknown print job");
      return c.json({ received: true, unknown: true });
    }

    const statusObj = asRecord(data.status);
    const luluStatus =
      (typeof statusObj?.name === "string" && statusObj.name) ||
      (typeof data.status === "string" ? data.status : null);

    const lineStatuses = Array.isArray(data.line_item_statuses)
      ? data.line_item_statuses
      : Array.isArray(statusObj?.line_item_statuses)
        ? statusObj.line_item_statuses
        : [];
    const firstLine = asRecord(Array.isArray(lineStatuses) ? lineStatuses[0] : null);
    const messages = asRecord(firstLine?.messages);

    const trackingId = typeof messages?.tracking_id === "string" ? messages.tracking_id.slice(0, 120) : job.trackingId;
    const trackingUrls = messages?.tracking_urls;
    const trackingUrl =
      Array.isArray(trackingUrls) && typeof trackingUrls[0] === "string"
        ? httpsUrl(trackingUrls[0]) ?? job.trackingUrl
        : job.trackingUrl;
    const carrier = typeof messages?.carrier_name === "string" ? messages.carrier_name.slice(0, 80) : job.carrier;

    await db
      .update(printJobs)
      .set({
        luluPrintJobId: job.luluPrintJobId ?? luluId,
        luluStatus,
        trackingId,
        trackingUrl,
        carrier,
        updatedAt: new Date(),
      })
      .where(eq(printJobs.id, job.id));

    let orderStatus: "fulfilling" | "shipped" | "delivered" | "failed" | null = null;
    if (luluStatus === "SHIPPED") orderStatus = "shipped";
    else if (luluStatus === "DELIVERED") orderStatus = "delivered";
    else if (luluStatus === "REJECTED" || luluStatus === "ERROR" || luluStatus === "CANCELED") {
      orderStatus = "failed";
    } else if (
      luluStatus === "IN_PRODUCTION" ||
      luluStatus === "PRODUCTION_READY" ||
      luluStatus === "PRODUCTION_DELAYED" ||
      luluStatus === "UNPAID" ||
      luluStatus === "CREATED"
    ) {
      orderStatus = "fulfilling";
    }

    if (orderStatus) {
      await db
        .update(orders)
        .set({ status: orderStatus, updatedAt: new Date() })
        .where(eq(orders.id, job.orderId));
    }

    return c.json({ received: true });
  } catch (err) {
    console.error("lulu webhook handler failed", err);
    await db.delete(webhookEvents).where(eq(webhookEvents.id, eventId));
    return c.json({ error: "Handler failed" }, 500);
  }
});
