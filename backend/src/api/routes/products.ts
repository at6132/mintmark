import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";
import { publicProductColumns, serializeProduct } from "../lib/serialize.js";

export const productRoutes = new Hono();

productRoutes.get("/v1/products", async (c) => {
  const q = (c.req.query("q") ?? "").trim().slice(0, 80).toLowerCase();
  const status = c.req.query("status");
  let list = await db.select(publicProductColumns).from(products);
  if (status === "AVAILABLE" || status === "COMING_SOON") {
    list = list.filter((p) => p.status === status);
  }
  if (q) {
    list = list.filter((p) =>
      `${p.company} ${p.title} ${p.ticker} ${p.summary} ${p.sector}`.toLowerCase().includes(q),
    );
  }
  return c.json({ products: list.map(serializeProduct) });
});

productRoutes.get("/v1/products/:id", async (c) => {
  const id = c.req.param("id").slice(0, 64);
  const [row] = await db
    .select(publicProductColumns)
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!row) return c.json({ error: "Product not found" }, 404);
  return c.json({ product: serializeProduct(row) });
});
