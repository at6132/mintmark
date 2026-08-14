import { inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";
import {
  calculatePrintJobCost,
  dollarsStringToCents,
} from "../../lib/lulu.js";
import { env } from "../../env.js";
import { isShippingLevel, type LuluShippingLevel } from "../../lib/shipping.js";
import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

export const shippingAddressSchema = z.object({
  name: z.string().min(1),
  street1: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state_code: z.string().default(""),
  postcode: z.string().min(1),
  country_code: z.string().length(2),
  phone_number: z.string().min(5),
});

const quoteSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  shippingAddress: shippingAddressSchema,
  shippingLevel: z.string().refine(isShippingLevel),
});

export const shippingRoutes = new Hono();

shippingRoutes.post("/v1/shipping/quote", zValidator("json", quoteSchema), async (c) => {
  const body = c.req.valid("json");
  const ids = [...new Set(body.items.map((i) => i.id))];
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((p) => [p.id, p]));

  const lineItems = [];
  for (const item of body.items) {
    const product = byId.get(item.id);
    if (!product) return c.json({ error: `Unknown product: ${item.id}` }, 400);
    if (product.status !== "AVAILABLE") {
      return c.json({ error: `${product.title} is not available` }, 400);
    }
    lineItems.push({
      page_count: product.pageCount,
      pod_package_id: product.podPackageId,
      quantity: item.quantity,
    });
  }

  const calc = await calculatePrintJobCost({
    line_items: lineItems,
    shipping_address: {
      city: body.shippingAddress.city,
      country_code: body.shippingAddress.country_code.toUpperCase(),
      postcode: body.shippingAddress.postcode,
      state_code: body.shippingAddress.state_code,
      street1: body.shippingAddress.street1,
      phone_number: body.shippingAddress.phone_number,
    },
    shipping_option: body.shippingLevel as LuluShippingLevel,
  });

  const luluTotal = dollarsStringToCents(calc.total_cost_incl_tax) ?? 0;
  const luluShipping =
    dollarsStringToCents(calc.shipping_cost?.total_cost_incl_tax) ??
    dollarsStringToCents(calc.shipping_cost?.total_cost_excl_tax) ??
    0;
  const handling = env().SHIPPING_HANDLING_CENTS;

  return c.json({
    shippingLevel: body.shippingLevel,
    luluTotalCents: luluTotal,
    luluShippingCents: luluShipping,
    customerShippingCents: luluShipping + handling,
    currency: "usd",
    raw: calc,
  });
});
