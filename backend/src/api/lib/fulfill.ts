import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "../../db/index.js";
import { orderItems, orders, products, type ShippingAddress } from "../../db/schema.js";
import { env } from "../../env.js";
import { enqueuePrintJob } from "../../lib/jobs.js";
import { isShippingLevel, type LuluShippingLevel } from "../../lib/shipping.js";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function shippingFromSession(session: Stripe.Checkout.Session): {
  address: ShippingAddress | null;
  level: LuluShippingLevel | null;
  shippingCents: number | null;
} {
  const raw = session as Stripe.Checkout.Session & {
    shipping_details?: unknown;
    collected_information?: unknown;
    shipping_cost?: unknown;
  };
  const collected = asRecord(raw.collected_information);
  const details =
    asRecord(raw.shipping_details) ??
    asRecord(collected?.shipping_details) ??
    null;
  const addr = asRecord(details?.address);
  const customer = session.customer_details;

  const name =
    (typeof details?.name === "string" && details.name) ||
    customer?.name ||
    "Mintmark customer";
  const phone =
    customer?.phone ||
    (typeof details?.phone === "string" ? details.phone : "") ||
    "";

  let address: ShippingAddress | null = null;
  if (addr && typeof addr.line1 === "string" && typeof addr.city === "string") {
    address = {
      name,
      street1: addr.line1,
      street2: typeof addr.line2 === "string" ? addr.line2 : undefined,
      city: addr.city,
      state_code: typeof addr.state === "string" ? addr.state : "",
      postcode: typeof addr.postal_code === "string" ? addr.postal_code : "",
      country_code: typeof addr.country === "string" ? addr.country.toUpperCase() : "US",
      phone_number: phone,
      email: customer?.email ?? undefined,
    };
  }

  const shippingCost = asRecord(raw.shipping_cost) ?? asRecord(session.shipping_cost);
  const rate = asRecord(shippingCost?.shipping_rate);
  const rateMeta = asRecord(rate?.metadata);
  const levelRaw = typeof rateMeta?.lulu_level === "string" ? rateMeta.lulu_level : null;
  const level = levelRaw && isShippingLevel(levelRaw) ? levelRaw : null;
  const shippingCents =
    typeof shippingCost?.amount_total === "number" ? shippingCost.amount_total : null;

  return { address, level, shippingCents };
}

export async function fulfillPaidCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) {
    throw new Error("Checkout session missing orderId metadata");
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.status !== "pending_payment" && order.status !== "paid") {
    return;
  }

  const { address, level, shippingCents } = shippingFromSession(session);
  const shippingAddress = address ?? order.shippingAddress;
  const shippingLevel = level ?? (order.shippingLevel && isShippingLevel(order.shippingLevel) ? order.shippingLevel : "MAIL");

  if (!shippingAddress) {
    throw new Error("Paid session is missing a shipping address");
  }
  if (!shippingAddress.phone_number) {
    const fallback = env().LULU_FALLBACK_PHONE;
    if (!fallback) {
      throw new Error("Paid session is missing a shipping phone number required by Lulu");
    }
    shippingAddress.phone_number = fallback;
  }

  await db
    .update(orders)
    .set({
      status: "paid",
      email: session.customer_details?.email ?? order.email,
      customerName: shippingAddress.name ?? order.customerName,
      phone: shippingAddress.phone_number,
      shippingAddress,
      shippingLevel,
      shippingCents: shippingCents ?? order.shippingCents,
      totalCents: order.subtotalCents + (shippingCents ?? order.shippingCents),
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? order.stripePaymentIntentId,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id));

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const productIds = items.map((i) => i.productId);
  const catalog = await db.select().from(products);
  const byId = new Map(catalog.filter((p) => productIds.includes(p.id)).map((p) => [p.id, p]));

  await enqueuePrintJob(order.id, {
    contact_email: env().LULU_CONTACT_EMAIL,
    shipping_level: shippingLevel,
    shipping_address: shippingAddress,
    line_items: items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} missing for order ${order.id}`);
      return {
        product_id: product.id,
        title: item.title,
        quantity: item.quantity,
        pod_package_id: product.podPackageId,
        page_count: product.pageCount,
        interior_pdf_url: product.interiorPdfUrl,
        cover_pdf_url: product.coverPdfUrl,
      };
    }),
  });

  await db
    .update(orders)
    .set({ status: "fulfilling", updatedAt: new Date() })
    .where(eq(orders.id, order.id));
}
