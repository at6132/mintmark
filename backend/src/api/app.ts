import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { env, isProd } from "../env.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { healthRoutes } from "./routes/health.js";
import { productRoutes } from "./routes/products.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { shippingRoutes } from "./routes/shipping.js";
import { orderRoutes } from "./routes/orders.js";
import { contactRoutes } from "./routes/contact.js";
import { newsletterRoutes } from "./routes/newsletter.js";
import { stripeWebhookRoutes } from "./routes/webhooks-stripe.js";
import { luluWebhookRoutes } from "./routes/webhooks-lulu.js";
import { adminRoutes } from "./routes/admin.js";
import { adminAuthRoutes } from "./routes/admin-auth.js";

const MAX_JSON_BYTES = 256 * 1024;

export function createApp() {
  const app = new Hono();
  const origin = env().FRONTEND_ORIGIN;
  const corsOrigins = isProd() ? [origin] : [origin, "http://localhost:3000"];

  app.use("*", requestId());
  app.use("*", logger());
  app.use(
    "*",
    secureHeaders({
      crossOriginResourcePolicy: "cross-origin",
      crossOriginOpenerPolicy: false,
      originAgentCluster: false,
      referrerPolicy: "no-referrer",
      xFrameOptions: "DENY",
      strictTransportSecurity: isProd() ? "max-age=31536000; includeSubDomains" : false,
    }),
  );
  app.use(
    "*",
    bodyLimit({
      maxSize: MAX_JSON_BYTES,
      onError: (c) => c.json({ error: "Payload too large" }, 413),
    }),
  );
  app.use(
    "*",
    timeout(30_000, () => new HTTPException(504, { message: "Request timeout" })),
  );
  app.use("*", async (c, next) => {
    await next();
    const path = new URL(c.req.url).pathname;
    if (c.req.method !== "GET" || path.startsWith("/v1/orders") || path.startsWith("/v1/webhooks")) {
      c.header("Cache-Control", "no-store");
    }
  });
  app.use("*", rateLimit());
  app.use(
    "*",
    cors({
      origin: corsOrigins,
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );

  app.route("/", healthRoutes);
  app.route("/", stripeWebhookRoutes);
  app.route("/", luluWebhookRoutes);
  app.route("/", productRoutes);
  app.route("/", shippingRoutes);
  app.route("/", checkoutRoutes);
  app.route("/", orderRoutes);
  app.route("/", contactRoutes);
  app.route("/", newsletterRoutes);
  app.route("/", adminAuthRoutes);
  app.route("/", adminRoutes);

  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      const res = err.getResponse();
      if (res.headers.get("content-type")?.includes("application/json")) return res;
      return c.json({ error: err.message || "Request failed" }, err.status);
    }
    console.error(err);
    return c.json({ error: isProd() ? "Internal error" : err.message }, 500);
  });

  return app;
}
