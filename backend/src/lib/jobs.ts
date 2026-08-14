import { sql } from "drizzle-orm";
import { db, sqlClient } from "../db/index.js";
import { printJobs, type PrintJob, type PrintJobPayload } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function enqueuePrintJob(orderId: string, payload: PrintJobPayload): Promise<void> {
  await db
    .insert(printJobs)
    .values({
      orderId,
      status: "queued",
      payload,
      runAfter: new Date(),
    })
    .onConflictDoNothing({ target: printJobs.orderId });
}

type ClaimedRow = {
  id: string;
  order_id: string;
  status: string;
  attempts: number;
  max_attempts: number;
  payload: PrintJobPayload;
  lulu_print_job_id: string | null;
};

export async function claimNextPrintJob(): Promise<ClaimedRow | null> {
  const rows = await sqlClient<ClaimedRow[]>`
    UPDATE print_jobs AS pj
    SET
      status = 'processing',
      locked_at = now(),
      attempts = pj.attempts + 1,
      updated_at = now()
    WHERE pj.id = (
      SELECT id
      FROM print_jobs
      WHERE status = 'queued'
        AND attempts < max_attempts
        AND run_after <= now()
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING
      pj.id,
      pj.order_id,
      pj.status,
      pj.attempts,
      pj.max_attempts,
      pj.payload,
      pj.lulu_print_job_id
  `;
  return rows[0] ?? null;
}

export async function markPrintJobSubmitted(
  id: string,
  luluPrintJobId: string,
  luluStatus: string | null,
): Promise<void> {
  await db
    .update(printJobs)
    .set({
      status: "submitted",
      luluPrintJobId,
      luluStatus,
      lastError: null,
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(printJobs.id, id));
}

export async function requeuePrintJob(id: string, error: string, attempts: number): Promise<void> {
  const delayMs = Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempts - 1));
  await db
    .update(printJobs)
    .set({
      status: "queued",
      lastError: error.slice(0, 2000),
      lockedAt: null,
      runAfter: new Date(Date.now() + delayMs),
      updatedAt: new Date(),
    })
    .where(eq(printJobs.id, id));
}

export async function failPrintJob(id: string, error: string): Promise<void> {
  await db
    .update(printJobs)
    .set({
      status: "failed",
      lastError: error.slice(0, 2000),
      lockedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(printJobs.id, id));
}

export async function touchStaleProcessing(minutes = 10): Promise<void> {
  await db.execute(sql`
    UPDATE print_jobs
    SET status = 'queued', locked_at = null, updated_at = now()
    WHERE status = 'processing'
      AND locked_at < now() - (${minutes} * interval '1 minute')
  `);
}

export type { PrintJob };
