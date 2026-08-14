import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders } from "../db/schema.js";
import { createPrintJob } from "../lib/lulu.js";
import {
  claimNextPrintJob,
  failPrintJob,
  markPrintJobSubmitted,
  requeuePrintJob,
  touchStaleProcessing,
} from "../lib/jobs.js";
import { isShippingLevel } from "../lib/shipping.js";

export async function processOnePrintJob(): Promise<boolean> {
  const job = await claimNextPrintJob();
  if (!job) return false;

  try {
    if (!isShippingLevel(job.payload.shipping_level)) {
      throw new Error(`Invalid shipping level ${job.payload.shipping_level}`);
    }

    const created = await createPrintJob({
      contact_email: job.payload.contact_email,
      external_id: job.order_id,
      shipping_level: job.payload.shipping_level,
      shipping_address: job.payload.shipping_address,
      line_items: job.payload.line_items.map((item) => ({
        external_id: item.product_id,
        title: item.title,
        quantity: item.quantity,
        pod_package_id: item.pod_package_id,
        cover_url: item.cover_pdf_url,
        interior_url: item.interior_pdf_url,
      })),
    });

    const luluId = created.id != null ? String(created.id) : "";
    if (!luluId) throw new Error("Lulu create response missing id");
    const status = created.status;
    const luluStatus =
      status && typeof status === "object" && "name" in status
        ? String((status as { name: unknown }).name)
        : typeof status === "string"
          ? status
          : null;

    await markPrintJobSubmitted(job.id, luluId, luluStatus);
    console.log(`submitted lulu print job ${luluId} for order ${job.order_id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`print job ${job.id} failed attempt ${job.attempts}:`, message);
    if (job.attempts >= job.max_attempts) {
      await failPrintJob(job.id, message);
      await db
        .update(orders)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(orders.id, job.order_id));
    } else {
      await requeuePrintJob(job.id, message, job.attempts);
    }
  }

  return true;
}

export async function workerTick(): Promise<void> {
  await touchStaleProcessing(10);
  for (let i = 0; i < 5; i++) {
    const did = await processOnePrintJob();
    if (!did) break;
  }
}
