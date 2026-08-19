import { z } from "zod";
import "./load-env.js";

const LULU_HOSTS = new Set(["api.lulu.com", "api.sandbox.lulu.com"]);

const base = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  SERVICE: z.enum(["api", "worker"]).default("api"),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform((v) => v.replace(/\/$/, "")),
  PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .transform((v) => v.replace(/\/$/, "")),
  LULU_API_BASE: z.string().url().default("https://api.sandbox.lulu.com"),
  LULU_CLIENT_KEY: z.string().optional().default(""),
  LULU_CLIENT_SECRET: z.string().optional().default(""),
  LULU_CONTACT_EMAIL: z.string().optional().default(""),
  LULU_WEBHOOK_SECRET: z.string().optional().default(""),
  LULU_FALLBACK_PHONE: z.string().optional(),
  SHIPPING_HANDLING_CENTS: z.coerce.number().int().nonnegative().default(0),
  DB_POOL_MAX: z.coerce.number().int().positive().optional(),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  ADMIN_PIN: z.string().optional().default(""),
  ADMIN_API_TOKEN: z.string().optional().default(""),
  ADMIN_WHATSAPP_NUMBERS: z.string().optional().default(""),
  WHATSAPP_TOKEN: z.string().optional().default(""),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(""),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default(""),
  WHATSAPP_APP_SECRET: z.string().optional().default(""),
});

export type Env = z.infer<typeof base>;

let cached: Env | null = null;

function assertHttpsUrl(label: string, value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error(`${label} must be https in production`);
  }
}

export function env(): Env {
  if (cached) return cached;
  const parsed = base.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  const data = parsed.data;
  const luluUrl = new URL(data.LULU_API_BASE);
  if (luluUrl.protocol !== "https:" || !LULU_HOSTS.has(luluUrl.hostname)) {
    throw new Error("LULU_API_BASE must be https://api.lulu.com or https://api.sandbox.lulu.com");
  }
  if (data.LULU_CONTACT_EMAIL && !z.string().email().safeParse(data.LULU_CONTACT_EMAIL).success) {
    throw new Error("LULU_CONTACT_EMAIL must be a valid email when set");
  }

  const hasLulu = Boolean(data.LULU_CLIENT_KEY && data.LULU_CLIENT_SECRET);
  const hasStripe = Boolean(data.STRIPE_SECRET_KEY && data.STRIPE_WEBHOOK_SECRET);
  if (!hasLulu) {
    console.warn("Lulu credentials are not set; shipping quotes and print jobs are disabled.");
  }
  if (data.SERVICE === "api" && !hasStripe) {
    console.warn("Stripe credentials are not set; checkout is disabled.");
  }
  if (data.STRIPE_SECRET_KEY.startsWith("sk_")) {
    console.warn(
      "STRIPE_SECRET_KEY looks like a full secret key. Prefer a restricted key (rk_) with checkout + webhook permissions.",
    );
  }

  if (data.NODE_ENV === "production") {
    assertHttpsUrl("FRONTEND_ORIGIN", data.FRONTEND_ORIGIN);
    assertHttpsUrl("PUBLIC_APP_URL", data.PUBLIC_APP_URL);
    if (/localhost|127\.0\.0\.1/.test(data.FRONTEND_ORIGIN) || /localhost|127\.0\.0\.1/.test(data.PUBLIC_APP_URL)) {
      throw new Error("FRONTEND_ORIGIN and PUBLIC_APP_URL cannot be localhost in production");
    }
  }

  cached = data;
  return cached;
}

export function isProd(): boolean {
  return env().NODE_ENV === "production";
}

export function hasLuluCredentials(): boolean {
  const cfg = env();
  return Boolean(cfg.LULU_CLIENT_KEY && cfg.LULU_CLIENT_SECRET);
}

export function hasStripeCredentials(): boolean {
  const cfg = env();
  return Boolean(cfg.STRIPE_SECRET_KEY && cfg.STRIPE_WEBHOOK_SECRET);
}
