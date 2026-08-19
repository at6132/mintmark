import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.js";
import {
  contactMessages,
  orderItems,
  orders,
  printJobs,
  products,
  subscribers,
  webhookEvents,
  type Order,
  type OrderItem,
  type PrintJob,
  type Product,
  type ShippingAddress,
} from "../../db/schema.js";
import { env } from "../../env.js";
import { centsToDollars } from "../../lib/money.js";
import { requireAdminSession } from "./admin-auth.js";

/**
 * Admin desk data. Session required (PIN + WhatsApp /allow).
 */
export const adminRoutes = new Hono();

adminRoutes.use("*", requireAdminSession);

const SAMPLE_PDF_HINT = "dropbox.com";

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function paidStatuses(): Set<string> {
  return new Set(["paid", "fulfilling", "shipped", "delivered"]);
}

function serializeAdminProduct(p: Product, sales: { units: number; revenueCents: number; orders: number }) {
  const samplePdf =
    p.interiorPdfUrl.includes(SAMPLE_PDF_HINT) || p.coverPdfUrl.includes(SAMPLE_PDF_HINT);
  return {
    id: p.id,
    slug: p.slug,
    company: p.company,
    title: p.title,
    price: centsToDollars(p.priceCents),
    priceCents: p.priceCents,
    currency: p.currency.toUpperCase(),
    status: p.status,
    sector: p.sector,
    ticker: p.ticker,
    summary: p.summary,
    volume: p.volume,
    color: p.color,
    moduleLink: p.moduleLink,
    headquarters: p.headquarters,
    spineHeight: p.spineHeight,
    spineWidth: p.spineWidth,
    podPackageId: p.podPackageId,
    pageCount: p.pageCount,
    interiorPdfUrl: p.interiorPdfUrl,
    coverPdfUrl: p.coverPdfUrl,
    samplePdf,
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
    unitsSold: sales.units,
    revenueCents: sales.revenueCents,
    orderCount: sales.orders,
  };
}

function serializeJob(job: PrintJob) {
  return {
    id: job.id,
    orderId: job.orderId,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    runAfter: iso(job.runAfter),
    lockedAt: iso(job.lockedAt),
    lastError: job.lastError,
    luluPrintJobId: job.luluPrintJobId,
    luluStatus: job.luluStatus,
    trackingId: job.trackingId,
    trackingUrl: job.trackingUrl,
    carrier: job.carrier,
    payload: job.payload,
    createdAt: iso(job.createdAt),
    updatedAt: iso(job.updatedAt),
  };
}

function serializeOrder(
  order: Order,
  items: OrderItem[],
  job: PrintJob | undefined,
) {
  return {
    id: order.id,
    publicId: order.publicId,
    email: order.email,
    customerName: order.customerName,
    phone: order.phone,
    status: order.status,
    currency: order.currency,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    shippingLevel: order.shippingLevel,
    shippingAddress: (order.shippingAddress ?? null) as ShippingAddress | null,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      title: i.title,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: i.unitPriceCents * i.quantity,
    })),
    fulfillment: job ? serializeJob(job) : null,
  };
}

type AdminOrder = ReturnType<typeof serializeOrder>;

function customerKey(order: { email?: string | null; publicId: string }): string {
  const email = (order.email || "").trim().toLowerCase();
  return email || `guest:${order.publicId}`;
}

function dayKey(isoStr: string | null): string {
  if (!isoStr) return "";
  return isoStr.slice(0, 10);
}

function buildCustomers(
  orderRows: AdminOrder[],
  inbox: Array<{ email: string; id: string; topic: string; createdAt: string | null }>,
  subSet: Set<string>,
) {
  const map = new Map<
    string,
    {
      key: string;
      email: string | null;
      name: string | null;
      phone: string | null;
      guest: boolean;
      orderCount: number;
      paidOrderCount: number;
      lifetimeCents: number;
      refundedCents: number;
      firstOrderAt: string | null;
      lastOrderAt: string | null;
      statuses: Record<string, number>;
      products: string[];
      cities: string[];
      regions: string[];
      addresses: ShippingAddress[];
      orders: Array<{
        publicId: string;
        status: string;
        totalCents: number;
        createdAt: string | null;
      }>;
      inboxCount: number;
      subscribed: boolean;
    }
  >();

  const paid = paidStatuses();

  for (const order of orderRows) {
    const key = customerKey({
      email: order.email,
      publicId: order.publicId,
    });
    const existing = map.get(key);
    const addr = order.shippingAddress;
    const city = addr?.city ? `${addr.city}${addr.state_code ? `, ${addr.state_code}` : ""}` : null;
    const region = addr?.country_code
      ? `${addr.country_code}${addr.state_code ? `-${addr.state_code}` : ""}`
      : null;

    if (!existing) {
      map.set(key, {
        key,
        email: order.email,
        name: order.customerName,
        phone: order.phone,
        guest: key.startsWith("guest:"),
        orderCount: 1,
        paidOrderCount: paid.has(order.status) ? 1 : 0,
        lifetimeCents: paid.has(order.status) ? order.totalCents : 0,
        refundedCents: order.status === "refunded" ? order.totalCents : 0,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        statuses: { [order.status]: 1 },
        products: [...new Set(order.items.map((i) => i.title))],
        cities: city ? [city] : [],
        regions: region ? [region] : [],
        addresses: addr ? [addr] : [],
        orders: [
          {
            publicId: order.publicId,
            status: order.status,
            totalCents: order.totalCents,
            createdAt: order.createdAt,
          },
        ],
        inboxCount: 0,
        subscribed: order.email ? subSet.has(order.email.toLowerCase()) : false,
      });
      continue;
    }

    existing.orderCount += 1;
    if (paid.has(order.status)) {
      existing.paidOrderCount += 1;
      existing.lifetimeCents += order.totalCents;
    }
    if (order.status === "refunded") existing.refundedCents += order.totalCents;
    existing.statuses[order.status] = (existing.statuses[order.status] ?? 0) + 1;
    if (!existing.name && order.customerName) existing.name = order.customerName;
    if (!existing.phone && order.phone) existing.phone = order.phone;
    if (!existing.email && order.email) existing.email = order.email;
    for (const title of order.items.map((i) => i.title)) {
      if (!existing.products.includes(title)) existing.products.push(title);
    }
    if (city && !existing.cities.includes(city)) existing.cities.push(city);
    if (region && !existing.regions.includes(region)) existing.regions.push(region);
    if (addr) {
      const sig = `${addr.street1}|${addr.postcode}|${addr.country_code}`;
      if (!existing.addresses.some((a) => `${a.street1}|${a.postcode}|${a.country_code}` === sig)) {
        existing.addresses.push(addr);
      }
    }
    existing.orders.push({
      publicId: order.publicId,
      status: order.status,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
    });
    if (order.createdAt && (!existing.lastOrderAt || order.createdAt > existing.lastOrderAt)) {
      existing.lastOrderAt = order.createdAt;
    }
    if (order.createdAt && (!existing.firstOrderAt || order.createdAt < existing.firstOrderAt)) {
      existing.firstOrderAt = order.createdAt;
    }
  }

  for (const msg of inbox) {
    const email = msg.email.toLowerCase();
    const row = map.get(email);
    if (row) row.inboxCount += 1;
    else {
      map.set(email, {
        key: email,
        email: msg.email,
        name: null,
        phone: null,
        guest: false,
        orderCount: 0,
        paidOrderCount: 0,
        lifetimeCents: 0,
        refundedCents: 0,
        firstOrderAt: msg.createdAt,
        lastOrderAt: msg.createdAt,
        statuses: {},
        products: [],
        cities: [],
        regions: [],
        addresses: [],
        orders: [],
        inboxCount: 1,
        subscribed: subSet.has(email),
      });
    }
  }

  for (const email of subSet) {
    if (!map.has(email)) {
      map.set(email, {
        key: email,
        email,
        name: null,
        phone: null,
        guest: false,
        orderCount: 0,
        paidOrderCount: 0,
        lifetimeCents: 0,
        refundedCents: 0,
        firstOrderAt: null,
        lastOrderAt: null,
        statuses: {},
        products: [],
        cities: [],
        regions: [],
        addresses: [],
        orders: [],
        inboxCount: 0,
        subscribed: true,
      });
    } else {
      map.get(email)!.subscribed = true;
    }
  }

  return [...map.values()].sort((a, b) => {
    const ta = a.lastOrderAt ?? "";
    const tb = b.lastOrderAt ?? "";
    return tb.localeCompare(ta);
  });
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function loadSnapshot() {
  const [orderRows, itemRows, jobRows, productRows, inboxRows, subRows, hookRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db.select().from(printJobs).orderBy(desc(printJobs.createdAt)),
    db.select().from(products),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt)),
    db.select().from(webhookEvents).orderBy(desc(webhookEvents.processedAt)).limit(250),
  ]);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  const jobByOrder = new Map(jobRows.map((j) => [j.orderId, j]));

  const adminOrders = orderRows.map((o) =>
    serializeOrder(o, itemsByOrder.get(o.id) ?? [], jobByOrder.get(o.id)),
  );

  const paid = paidStatuses();
  const salesByProduct = new Map<string, { units: number; revenueCents: number; orders: number }>();
  for (const order of adminOrders) {
    if (!paid.has(order.status)) continue;
    const seen = new Set<string>();
    for (const item of order.items) {
      const cur = salesByProduct.get(item.productId) ?? { units: 0, revenueCents: 0, orders: 0 };
      cur.units += item.quantity;
      cur.revenueCents += item.lineTotalCents;
      if (!seen.has(item.productId)) {
        cur.orders += 1;
        seen.add(item.productId);
      }
      salesByProduct.set(item.productId, cur);
    }
  }

  const catalog = productRows.map((p) =>
    serializeAdminProduct(p, salesByProduct.get(p.id) ?? { units: 0, revenueCents: 0, orders: 0 }),
  );

  const ordersByStatus: Record<string, number> = {};
  for (const o of adminOrders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1;
  }

  const jobsByStatus: Record<string, number> = {};
  for (const j of jobRows) {
    jobsByStatus[j.status] = (jobsByStatus[j.status] ?? 0) + 1;
  }

  const paidOrders = adminOrders.filter((o) => paid.has(o.status));
  const revenueCents = paidOrders.reduce((n, o) => n + o.totalCents, 0);
  const shippingCollectedCents = paidOrders.reduce((n, o) => n + o.shippingCents, 0);
  const aovCents = paidOrders.length ? Math.round(revenueCents / paidOrders.length) : 0;

  const days = lastNDays(14);
  const revenueByDay = days.map((day) => {
    const rows = paidOrders.filter((o) => dayKey(o.createdAt) === day);
    return {
      day,
      orders: rows.length,
      revenueCents: rows.reduce((n, o) => n + o.totalCents, 0),
    };
  });

  const shippingByCountry: Record<string, { orders: number; revenueCents: number }> = {};
  for (const o of paidOrders) {
    const cc = o.shippingAddress?.country_code?.toUpperCase() || "UNSET";
    const cur = shippingByCountry[cc] ?? { orders: 0, revenueCents: 0 };
    cur.orders += 1;
    cur.revenueCents += o.totalCents;
    shippingByCountry[cc] = cur;
  }

  const inbox = inboxRows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    topic: m.topic,
    message: m.message,
    createdAt: iso(m.createdAt),
  }));

  const subSet = new Set(subRows.map((s) => s.email.toLowerCase()));
  const customers = buildCustomers(adminOrders, inbox, subSet);

  const webhooksBySource: Record<string, number> = {};
  for (const h of hookRows) {
    webhooksBySource[h.source] = (webhooksBySource[h.source] ?? 0) + 1;
  }

  const cfg = env();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const recentPaid = paidOrders.filter((o) => o.createdAt && now - Date.parse(o.createdAt) < dayMs);

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      orders: adminOrders.length,
      openOrders: adminOrders.filter((o) =>
        ["pending_payment", "paid", "fulfilling"].includes(o.status),
      ).length,
      paidOrders: paidOrders.length,
      revenueCents,
      shippingCollectedCents,
      aovCents,
      customers: customers.filter((c) => !c.guest || c.orderCount > 0).length,
      membersEstimate: customers.filter((c) => c.email && !c.guest).length,
      subscribers: subRows.length,
      inbox: inbox.length,
      catalog: catalog.length,
      available: catalog.filter((p) => p.status === "AVAILABLE").length,
      comingSoon: catalog.filter((p) => p.status === "COMING_SOON").length,
      pressQueued: jobRows.filter((j) => j.status === "queued" || j.status === "processing").length,
      pressFailed: jobRows.filter((j) => j.status === "failed").length,
      pressSubmitted: jobRows.filter((j) => j.status === "submitted").length,
      shipped: adminOrders.filter((o) => o.status === "shipped" || o.status === "delivered").length,
      last24hRevenueCents: recentPaid.reduce((n, o) => n + o.totalCents, 0),
      last24hOrders: recentPaid.length,
      unitsSold: [...salesByProduct.values()].reduce((n, s) => n + s.units, 0),
    },
    ordersByStatus,
    jobsByStatus,
    webhooksBySource,
    revenueByDay,
    revenueByProduct: catalog
      .map((p) => ({
        id: p.id,
        title: p.title,
        company: p.company,
        ticker: p.ticker,
        unitsSold: p.unitsSold,
        revenueCents: p.revenueCents,
        orderCount: p.orderCount,
        status: p.status,
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents),
    shippingByCountry: Object.entries(shippingByCountry)
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.orders - a.orders),
    catalogHealth: {
      samplePdfs: catalog.filter((p) => p.samplePdf).length,
      missingModule: catalog.filter((p) => !p.moduleLink).length,
      missingTicker: catalog.filter((p) => !p.ticker).length,
    },
    integrations: {
      stripe: Boolean(cfg.STRIPE_SECRET_KEY),
      lulu: Boolean(cfg.LULU_CLIENT_KEY),
      luluBase: cfg.LULU_API_BASE,
      frontendOrigin: cfg.FRONTEND_ORIGIN,
    },
    orders: adminOrders,
    customers,
    products: catalog,
    press: jobRows.map(serializeJob),
    inbox,
    subscribers: subRows.map((s) => ({
      email: s.email,
      createdAt: iso(s.createdAt),
    })),
    webhooks: hookRows.map((h) => ({
      id: h.id,
      source: h.source,
      processedAt: iso(h.processedAt),
    })),
  };
}

adminRoutes.get("/v1/admin", async (c) => {
  const snapshot = await loadSnapshot();
  return c.json(snapshot);
});

adminRoutes.get("/v1/admin/orders/:id", async (c) => {
  const id = c.req.param("id");
  const [order] = await db
    .select()
    .from(orders)
    .where(id.startsWith("mm_") ? eq(orders.publicId, id) : eq(orders.id, id))
    .limit(1);
  if (!order) return c.json({ error: "Order not found" }, 404);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const [job] = await db.select().from(printJobs).where(eq(printJobs.orderId, order.id)).limit(1);
  return c.json({ order: serializeOrder(order, items, job) });
});

const productPatch = z.object({
  status: z.enum(["AVAILABLE", "COMING_SOON"]).optional(),
  priceCents: z.number().int().positive().optional(),
  summary: z.string().min(1).max(800).optional(),
  title: z.string().min(1).max(160).optional(),
});

adminRoutes.patch("/v1/admin/products/:id", zValidator("json", productPatch), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  const [row] = await db
    .update(products)
    .set({
      ...(body.status ? { status: body.status } : {}),
      ...(body.priceCents ? { priceCents: body.priceCents } : {}),
      ...(body.summary ? { summary: body.summary } : {}),
      ...(body.title ? { title: body.title } : {}),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();
  if (!row) return c.json({ error: "Product not found" }, 404);
  return c.json({
    product: serializeAdminProduct(row, { units: 0, revenueCents: 0, orders: 0 }),
  });
});
