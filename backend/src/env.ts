import { z } from "zod";
import "./load-env.js";

const base = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  SERVICE: z.enum(["api", "worker"]).default("api"),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  LULU_API_BASE: z.string().url().default("https://api.sandbox.lulu.com"),
  LULU_CLIENT_KEY: z.string().min(1),
  LULU_CLIENT_SECRET: z.string().min(1),
  LULU_CONTACT_EMAIL: z.string().email(),
  LULU_WEBHOOK_SECRET: z.string().optional(),
  LULU_FALLBACK_PHONE: z.string().optional(),
  SHIPPING_HANDLING_CENTS: z.coerce.number().int().nonnegative().default(0),
  DB_POOL_MAX: z.coerce.number().int().positive().optional(),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
});

export type Env = z.infer<typeof base>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = base.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  const data = parsed.data;
  if (data.SERVICE === "api") {
    if (!data.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is required for the API");
    if (!data.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is required for the API");
    if (data.STRIPE_SECRET_KEY.startsWith("sk_")) {
      console.warn(
        "STRIPE_SECRET_KEY looks like a full secret key. Prefer a restricted key (rk_) with checkout + webhook permissions.",
      );
    }
  }
  cached = data;
  return cached;
}

export function isProd(): boolean {
  return env().NODE_ENV === "production";
}
