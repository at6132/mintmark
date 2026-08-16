import { count } from "drizzle-orm";
import { serve } from "@hono/node-server";
import { env } from "../env.js";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { seedProducts } from "../db/seed.js";
import { createApp } from "./app.js";

const cfg = env();

const [{ n }] = await db.select({ n: count() }).from(products);
if (!n) {
  console.log("no products found, seeding catalog");
  await seedProducts();
}

const app = createApp();

serve({ fetch: app.fetch, port: cfg.PORT }, (info) => {
  console.log(`mintmark api listening on :${info.port}`);
});
