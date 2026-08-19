import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../env.js";
import { normalizeE164, operatorNumbers } from "./phones.js";

const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappConfigured(): boolean {
  const cfg = env();
  return Boolean(cfg.WHATSAPP_TOKEN && cfg.WHATSAPP_PHONE_NUMBER_ID && cfg.WHATSAPP_VERIFY_TOKEN);
}

function digits(e164: string): string {
  return normalizeE164(e164).replace(/^\+/, "");
}

export function verifyMetaSignature(rawBody: string, header: string | undefined): boolean {
  const secret = env().WHATSAPP_APP_SECRET.trim();
  if (!secret) return false;
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const given = header.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(given, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function sendWhatsApp(toE164: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const cfg = env();
  if (!whatsappConfigured()) {
    return { ok: false, error: "WhatsApp Cloud API is not configured" };
  }

  const res = await fetch(`${GRAPH}/${cfg.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: digits(toE164),
      type: "text",
      text: { body: body.slice(0, 4096), preview_url: false },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("whatsapp cloud send failed", res.status, text.slice(0, 500));
    if (text.includes("131047") || text.includes("131026")) {
      return {
        ok: false,
        error: "Operator must message the WhatsApp test number first (opens a 24h window).",
      };
    }
    return { ok: false, error: "WhatsApp send failed" };
  }
  return { ok: true };
}

export async function notifyOperators(body: string): Promise<{ sent: number; failed: number; lastError?: string }> {
  const numbers = operatorNumbers();
  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;
  for (const phone of numbers) {
    const result = await sendWhatsApp(phone, body);
    if (result.ok) sent += 1;
    else {
      failed += 1;
      lastError = result.error;
    }
  }
  return { sent, failed, lastError };
}

export type InboundWhatsApp = { from: string; body: string };

export function parseInboundMessages(payload: unknown): InboundWhatsApp[] {
  const out: InboundWhatsApp[] = [];
  const root = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{ from?: string; text?: { body?: string }; type?: string }>;
        };
      }>;
    }>;
  };
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        const from = msg.from?.trim();
        const body = msg.text?.body?.trim();
        if (from && body) out.push({ from: normalizeE164(from), body });
      }
    }
  }
  return out;
}
