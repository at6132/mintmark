import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env, isProd } from "../env.js";
import { healthRoutes } from "./routes/health.js";
import { productRoutes } from "./routes/products.js";
import { checkoutRoutes } from "./routes/checkout.js";
import { shippingRoutes } from "./routes/shipping.js";
import { orderRoutes } from "./routes/orders.js";
import { contactRoutes } from "./routes/contact.js";
import { newsletterRoutes } from "./routes/newsletter.js";
import { stripeWebhookRoutes } from "./routes/webhooks-stripe.js";
import { luluWebhookRoutes } from "./routes/webhooks-lulu.js";

export function createApp() {
  const app = new Hono();
  const origin = env().FRONTEND_ORIGIN;

  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: [origin, "http://localhost:3000"],
      allowMethods: ["GET", "POST", "OPTIONS"],
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

  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((err, c) => {
    console.error(err);
    const message = isProd() ? "Internal error" : err.message;
    return c.json({ error: message }, 500);
  });

  return app;
}
