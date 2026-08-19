import { createHmac, timingSafeEqual } from "node:crypto";
import { env, hasLuluCredentials } from "../env.js";
import type { ShippingAddress } from "../db/schema.js";
import type { LuluShippingLevel } from "./shipping.js";

type Token = { accessToken: string; expiresAt: number };

const LULU_TIMEOUT_MS = 20_000;

let tokenCache: Token | null = null;

function authHeader(): string {
  const { LULU_CLIENT_KEY, LULU_CLIENT_SECRET } = env();
  return `Basic ${Buffer.from(`${LULU_CLIENT_KEY}:${LULU_CLIENT_SECRET}`).toString("base64")}`;
}

export async function luluAccessToken(): Promise<string> {
  if (!hasLuluCredentials()) {
    throw new Error("Lulu is not configured");
  }
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }
  const base = env().LULU_API_BASE.replace(/\/$/, "");
  const res = await fetch(`${base}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(LULU_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu auth failed (${res.status}): ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 300) * 1000,
  };
  return tokenCache.accessToken;
}

async function luluFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await luluAccessToken();
  const base = env().LULU_API_BASE.replace(/\/$/, "");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-cache");
  return fetch(`${base}${path}`, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(LULU_TIMEOUT_MS),
  });
}

export type CostLineItem = {
  page_count: number;
  pod_package_id: string;
  quantity: number;
};

export type LuluCostCalculation = {
  total_cost_incl_tax?: string;
  total_cost_excl_tax?: string;
  shipping_cost?: {
    total_cost_incl_tax?: string;
    total_cost_excl_tax?: string;
  };
  line_item_costs?: unknown;
  [key: string]: unknown;
};

export async function calculatePrintJobCost(input: {
  line_items: CostLineItem[];
  shipping_address: Pick<
    ShippingAddress,
    "city" | "country_code" | "postcode" | "state_code" | "street1" | "phone_number"
  >;
  shipping_option: LuluShippingLevel;
}): Promise<LuluCostCalculation> {
  const res = await luluFetch("/print-job-cost-calculations/", {
    method: "POST",
    body: JSON.stringify({
      line_items: input.line_items,
      shipping_address: input.shipping_address,
      shipping_option: input.shipping_option,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu cost calc failed (${res.status}): ${text.slice(0, 800)}`);
  }
  return (await res.json()) as LuluCostCalculation;
}

export type CreatePrintJobInput = {
  contact_email: string;
  external_id: string;
  shipping_level: LuluShippingLevel;
  shipping_address: ShippingAddress;
  line_items: Array<{
    external_id: string;
    title: string;
    quantity: number;
    pod_package_id: string;
    cover_url: string;
    interior_url: string;
  }>;
};

export async function createPrintJob(input: CreatePrintJobInput): Promise<Record<string, unknown>> {
  const body = {
    contact_email: input.contact_email,
    external_id: input.external_id,
    production_delay: 60,
    shipping_level: input.shipping_level,
    shipping_address: {
      name: input.shipping_address.name,
      street1: input.shipping_address.street1,
      street2: input.shipping_address.street2 ?? "",
      city: input.shipping_address.city,
      state_code: input.shipping_address.state_code,
      postcode: input.shipping_address.postcode,
      country_code: input.shipping_address.country_code,
      phone_number: input.shipping_address.phone_number,
      email: input.shipping_address.email,
    },
    line_items: input.line_items.map((item) => ({
      external_id: item.external_id,
      title: item.title,
      quantity: item.quantity,
      printable_normalization: {
        pod_package_id: item.pod_package_id,
        cover: { source_url: item.cover_url },
        interior: { source_url: item.interior_url },
      },
    })),
  };

  const res = await luluFetch("/print-jobs/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu print-job create failed (${res.status}): ${text.slice(0, 1200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

export function verifyLuluHmac(rawBody: string, header: string | undefined): boolean {
  const secret = env().LULU_WEBHOOK_SECRET || env().LULU_CLIENT_SECRET;
  if (!header || !secret) return false;
  const incoming = header.trim().toLowerCase().replace(/^sha256=/, "");
  if (!/^[0-9a-f]+$/.test(incoming) || incoming.length % 2 !== 0) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const provided = Buffer.from(incoming, "hex");
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export function dollarsStringToCents(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
