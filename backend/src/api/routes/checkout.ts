import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { env, hasLuluCredentials, hasStripeCredentials } from "../../env.js";
import { db } from "../../db/index.js";
import { orderItems, orders, products } from "../../db/schema.js";
import { publicOrderId, randomLetters } from "../../lib/ids.js";
import { stripe } from "../../lib/stripe.js";
import {
  DEFAULT_SHIPPING_COUNTRIES,
  STRIPE_SHIPPING_OPTIONS,
} from "../../lib/shipping.js";
import { calculatePrintJobCost, dollarsStringToCents } from "../../lib/lulu.js";
import {
  cartItemsSchema,
  emailSchema,
  jsonValidator,
  shippingAddressSchema,
  shippingLevelSchema,
} from "../lib/validation.js";

export const checkoutRoutes = new Hono();

const checkoutSchema = z.object({
  items: cartItemsSchema,
  email: emailSchema.optional(),
  shippingAddress: shippingAddressSchema.optional(),
  shippingLevel: shippingLevelSchema.optional(),
});

checkoutRoutes.post("/v1/checkout", jsonValidator(checkoutSchema), async (c) => {
  const body = c.req.valid("json");
  if (!hasStripeCredentials()) {
    return c.json({ error: "Checkout is not configured yet" }, 503);
  }
  if (Boolean(body.shippingAddress) !== Boolean(body.shippingLevel)) {
    return c.json({ error: "Shipping address and level are both required when quoting shipping" }, 400);
  }
  if (body.shippingAddress && !hasLuluCredentials()) {
    return c.json({ error: "Shipping quotes are not configured yet" }, 503);
  }

  const ids = [...new Set(body.items.map((i) => i.id))];
  const catalog = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const resolved = [];
  for (const item of body.items) {
    const product = byId.get(item.id);
    if (!product) return c.json({ error: `Unknown product: ${item.id}` }, 400);
    if (product.status !== "AVAILABLE") {
      return c.json({ error: `${product.title} is not available` }, 400);
    }
    resolved.push({ product, quantity: item.quantity });
  }

  const subtotalCents = resolved.reduce((n, r) => n + r.product.priceCents * r.quantity, 0);
  let shippingCents = 0;
  let shippingLevel = body.shippingLevel ?? null;

  if (body.shippingAddress && body.shippingLevel) {
    const calc = await calculatePrintJobCost({
      line_items: resolved.map((r) => ({
        page_count: r.product.pageCount,
        pod_package_id: r.product.podPackageId,
        quantity: r.quantity,
      })),
      shipping_address: {
        city: body.shippingAddress.city,
        country_code: body.shippingAddress.country_code,
        postcode: body.shippingAddress.postcode,
        state_code: body.shippingAddress.state_code,
        street1: body.shippingAddress.street1,
        phone_number: body.shippingAddress.phone_number,
      },
      shipping_option: body.shippingLevel,
    });
    shippingCents =
      (dollarsStringToCents(calc.shipping_cost?.total_cost_incl_tax) ??
        dollarsStringToCents(calc.shipping_cost?.total_cost_excl_tax) ??
        0) + env().SHIPPING_HANDLING_CENTS;
  }

  const totalCents = subtotalCents + shippingCents;
  const cfg = env();

  const [order] = await db
    .insert(orders)
    .values({
      publicId: publicOrderId(),
      email: body.email,
      customerName: body.shippingAddress?.name,
      phone: body.shippingAddress?.phone_number,
      status: "pending_payment",
      currency: "usd",
      subtotalCents,
      shippingCents,
      totalCents,
      shippingLevel,
      shippingAddress: body.shippingAddress ?? null,
    })
    .returning();

  if (!order) return c.json({ error: "Could not create order" }, 500);

  await db.insert(orderItems).values(
    resolved.map((r) => ({
      orderId: order.id,
      productId: r.product.id,
      title: r.product.title,
      quantity: r.quantity,
      unitPriceCents: r.product.priceCents,
    })),
  );

  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; metadata: { product_id: string } };
    };
  }> = resolved.map((r) => ({
    quantity: r.quantity,
    price_data: {
      currency: "usd",
      unit_amount: r.product.priceCents,
      product_data: {
        name: r.product.title,
        metadata: { product_id: r.product.id },
      },
    },
  }));

  if (body.shippingAddress && shippingCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: shippingCents,
        product_data: {
          name: `Shipping (${body.shippingLevel})`,
          metadata: { product_id: "shipping" },
        },
      },
    });
  }

  const sessionParams: Parameters<ReturnType<typeof stripe>["checkout"]["sessions"]["create"]>[0] = {
    mode: "payment",
    customer_email: body.email,
    line_items: lineItems,
    success_url: `${cfg.PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cfg.PUBLIC_APP_URL}/cart`,
    client_reference_id: order.id,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    metadata: {
      orderId: order.id,
      publicId: order.publicId,
    },
    phone_number_collection: { enabled: true },
    integration_identifier: `mintmark_${randomLetters(8)}`,
  };

  if (!body.shippingAddress) {
    sessionParams.shipping_address_collection = {
      allowed_countries: [...DEFAULT_SHIPPING_COUNTRIES],
    };
    sessionParams.shipping_options = STRIPE_SHIPPING_OPTIONS.map((opt) => ({
      shipping_rate_data: {
        type: "fixed_amount" as const,
        display_name: opt.displayName,
        fixed_amount: { amount: opt.amountCents, currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day" as const, value: opt.minDays },
          maximum: { unit: "business_day" as const, value: opt.maxDays },
        },
        metadata: { lulu_level: opt.level },
      },
    }));
  }

  try {
    const session = await stripe().checkout.sessions.create(sessionParams);
    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    await db
      .update(orders)
      .set({
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return c.json({ url: session.url });
  } catch (err) {
    await db
      .update(orders)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    console.error("checkout session create failed", err);
    return c.json({ error: "Checkout is unavailable" }, 502);
  }
});
