import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { z } from "zod";
import { DEFAULT_SHIPPING_COUNTRIES, isShippingLevel } from "../../lib/shipping.js";

export const MAX_LINE_ITEMS = 20;
export const MAX_ITEM_QUANTITY = 20;
export const MAX_CART_UNITS = 40;

const PRODUCT_ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

export const emailSchema = z.string().trim().email().max(254).transform((v) => v.toLowerCase());

export const cartItemSchema = z.object({
  id: z.string().regex(PRODUCT_ID, "Invalid product id"),
  quantity: z.number().int().positive().max(MAX_ITEM_QUANTITY),
});

export const cartItemsSchema = z
  .array(cartItemSchema)
  .min(1)
  .max(MAX_LINE_ITEMS)
  .superRefine((items, ctx) => {
    const units = items.reduce((n, item) => n + item.quantity, 0);
    if (units > MAX_CART_UNITS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cart is too large" });
    }
  });

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const shippingAddressSchema = z.object({
  name: trimmed(1, 120),
  street1: trimmed(1, 200),
  street2: z.string().trim().max(200).optional(),
  city: trimmed(1, 100),
  state_code: z.string().trim().max(16).default(""),
  postcode: trimmed(1, 20),
  country_code: z
    .string()
    .trim()
    .length(2)
    .transform((v) => v.toUpperCase())
    .refine(
      (code): code is (typeof DEFAULT_SHIPPING_COUNTRIES)[number] =>
        (DEFAULT_SHIPPING_COUNTRIES as readonly string[]).includes(code),
      "Shipping is not available to this country",
    ),
  phone_number: z
    .string()
    .trim()
    .min(5)
    .max(30)
    .regex(/^[0-9+(). \-]+$/, "Invalid phone number"),
});

export const shippingLevelSchema = z.string().refine(isShippingLevel, "Invalid shipping level");

export function jsonValidator<T extends ZodType>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: "Invalid request" }, 400);
    }
  });
}
