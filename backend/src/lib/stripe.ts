import Stripe from "stripe";
import { env } from "../env.js";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client = new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    appInfo: { name: "mintmark", version: "1.0.0" },
  });
  return client;
}
