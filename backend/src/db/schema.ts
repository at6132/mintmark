import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const productStatusEnum = pgEnum("product_status", ["AVAILABLE", "COMING_SOON"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "fulfilling",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
  "failed",
]);
export const printJobQueueStatusEnum = pgEnum("print_job_queue_status", [
  "queued",
  "processing",
  "submitted",
  "failed",
]);
export const webhookSourceEnum = pgEnum("webhook_source", ["stripe", "lulu"]);
export const adminChallengeStatusEnum = pgEnum("admin_challenge_status", [
  "pending",
  "allowed",
  "denied",
  "expired",
  "consumed",
]);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  company: text("company").notNull(),
  title: text("title").notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: productStatusEnum("status").notNull().default("COMING_SOON"),
  sector: text("sector"),
  ticker: text("ticker"),
  summary: text("summary"),
  volume: text("volume"),
  color: text("color"),
  moduleLink: text("module_link"),
  headquarters: text("headquarters"),
  spineHeight: integer("spine_height"),
  spineWidth: integer("spine_width"),
  podPackageId: text("pod_package_id").notNull(),
  pageCount: integer("page_count").notNull(),
  interiorPdfUrl: text("interior_pdf_url").notNull(),
  coverPdfUrl: text("cover_pdf_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: text("public_id").notNull(),
    email: text("email"),
    customerName: text("customer_name"),
    phone: text("phone"),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    currency: text("currency").notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    shippingLevel: text("shipping_level"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress | null>(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_public_id_idx").on(t.publicId),
    uniqueIndex("orders_stripe_session_idx").on(t.stripeCheckoutSessionId),
    index("orders_email_idx").on(t.email),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    title: text("title").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
  },
  (t) => [index("order_items_order_id_idx").on(t.orderId)],
);

export const printJobs = pgTable(
  "print_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: printJobQueueStatusEnum("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(8),
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastError: text("last_error"),
    luluPrintJobId: text("lulu_print_job_id"),
    luluStatus: text("lulu_status"),
    trackingId: text("tracking_id"),
    trackingUrl: text("tracking_url"),
    carrier: text("carrier"),
    payload: jsonb("payload").$type<PrintJobPayload>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("print_jobs_order_id_idx").on(t.orderId),
    index("print_jobs_claim_idx").on(t.status, t.runAfter),
    uniqueIndex("print_jobs_lulu_id_idx").on(t.luluPrintJobId),
  ],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  source: webhookSourceEnum("source").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminChallenges = pgTable(
  "admin_challenges",
  {
    id: text("id").primaryKey(),
    status: adminChallengeStatusEnum("status").notNull().default("pending"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedByPhone: text("decided_by_phone"),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [index("admin_challenges_status_idx").on(t.status, t.createdAt)],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    challengeId: text("challenge_id").references(() => adminChallenges.id, { onDelete: "set null" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("admin_sessions_expires_idx").on(t.expiresAt)],
);

export type ShippingAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  postcode: string;
  country_code: string;
  phone_number: string;
  email?: string;
};

export type PrintJobPayload = {
  contact_email: string;
  shipping_level: string;
  shipping_address: ShippingAddress;
  line_items: Array<{
    product_id: string;
    title: string;
    quantity: number;
    pod_package_id: string;
    page_count: number;
    interior_pdf_url: string;
    cover_pdf_url: string;
  }>;
};

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PrintJob = typeof printJobs.$inferSelect;
export type AdminChallenge = typeof adminChallenges.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
