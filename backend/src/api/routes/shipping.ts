import { inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { products } from "../../db/schema.js";
import { calculatePrintJobCost, dollarsStringToCents } from "../../lib/lulu.js";
import { env, hasLuluCredentials } from "../../env.js";
import type { LuluShippingLevel } from "../../lib/shipping.js";
import { z } from "zod";
import { Hono } from "hono";
import {
  cartItemsSchema,
  jsonValidator,
  shippingAddressSchema,
  shippingLevelSchema,
} from "../lib/validation.js";

const quoteSchema = z.object({
  items: cartItemsSchema,
  shippingAddress: shippingAddressSchema,
  shippingLevel: shippingLevelSchema,
});

export const shippingRoutes = new Hono();

shippingRoutes.post("/v1/shipping/quote", jsonValidator(quoteSchema), async (c) => {
  if (!hasLuluCredentials()) {
    return c.json({ error: "Shipping quotes are not configured yet" }, 503);
  }
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
      country_code: body.shippingAddress.country_code,
      postcode: body.shippingAddress.postcode,
      state_code: body.shippingAddress.state_code,
      street1: body.shippingAddress.street1,
      phone_number: body.shippingAddress.phone_number,
    },
    shipping_option: body.shippingLevel as LuluShippingLevel,
  });

  const luluShipping =
    dollarsStringToCents(calc.shipping_cost?.total_cost_incl_tax) ??
    dollarsStringToCents(calc.shipping_cost?.total_cost_excl_tax) ??
    0;
  const handling = env().SHIPPING_HANDLING_CENTS;

  return c.json({
    shippingLevel: body.shippingLevel,
    customerShippingCents: luluShipping + handling,
    currency: "usd",
  });
});
