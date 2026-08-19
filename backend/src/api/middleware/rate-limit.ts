import type { Context, MiddlewareHandler, Next } from "hono";

type Rule = {
  windowMs: number;
  max: number;
  match: (path: string, method: string) => boolean;
};

const RULES: Rule[] = [
  { match: (path) => path.startsWith("/v1/webhooks/"), windowMs: 60_000, max: 400 },
  { match: (path) => path === "/health", windowMs: 60_000, max: 120 },
  { match: (path, method) => method === "POST" && path === "/v1/checkout", windowMs: 60_000, max: 8 },
  { match: (path, method) => method === "POST" && path === "/v1/shipping/quote", windowMs: 60_000, max: 15 },
  { match: (path, method) => method === "POST" && path === "/v1/contact", windowMs: 60_000, max: 5 },
  { match: (path, method) => method === "POST" && path === "/v1/newsletter", windowMs: 60_000, max: 8 },
  { match: (path, method) => method === "POST" && path === "/v1/admin/auth/request", windowMs: 15 * 60_000, max: 5 },
  { match: (path) => path.startsWith("/v1/admin/auth/"), windowMs: 60_000, max: 40 },
  { match: (path) => path.startsWith("/v1/admin"), windowMs: 60_000, max: 60 },
  { match: (path) => path.startsWith("/v1/orders/"), windowMs: 60_000, max: 30 },
  { match: () => true, windowMs: 60_000, max: 120 },
];

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let seen = 0;

function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.slice(0, 128);
  }
  return c.req.header("x-real-ip")?.slice(0, 128) || "unknown";
}

function prune(now: number) {
  if (buckets.size < 8_000 && seen % 250 !== 0) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    if (c.req.method === "OPTIONS") {
      await next();
      return;
    }
    const path = new URL(c.req.url).pathname;
    const method = c.req.method.toUpperCase();
    const rule = RULES.find((r) => r.match(path, method)) ?? RULES[RULES.length - 1]!;
    const now = Date.now();
    seen += 1;
    prune(now);

    const key = `${rule.max}:${rule.windowMs}:${method}:${path}:${clientIp(c)}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + rule.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    c.header("X-RateLimit-Limit", String(rule.max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, rule.max - bucket.count)));

    if (bucket.count > rule.max) {
      c.header("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return c.json({ error: "Too many requests" }, 429);
    }
    await next();
  };
}
