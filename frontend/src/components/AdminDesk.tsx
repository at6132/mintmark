"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { money } from "@/lib/format";
import {
  completeAdminChallenge,
  fetchAdminMembers,
  fetchAdminMe,
  fetchAdminSnapshot,
  logoutAdmin,
  patchAdminProduct,
  pollAdminChallenge,
  requestAdminAccess,
  type AdminCustomer,
  type AdminInbox,
  type AdminMember,
  type AdminOrder,
  type AdminPrintJob,
  type AdminProduct,
  type AdminSnapshot,
  type ShippingAddress,
} from "@/lib/admin";

type DeskId =
  | "overview"
  | "orders"
  | "customers"
  | "catalog"
  | "press"
  | "inbox"
  | "circulation"
  | "content"
  | "members"
  | "ops";

type ContentTab = "long" | "short";

const DESKS: Array<{
  id: DeskId;
  key: string;
  subtitle: string;
  count?: (s: AdminSnapshot, extra?: { members: number }) => number;
}> = [
  { id: "overview", key: "telemetry", subtitle: "kpis · 14d" },
  { id: "orders", key: "orders", subtitle: "checkout", count: (s) => s.orders.length },
  { id: "customers", key: "customers", subtitle: "ltv · cohorts", count: (s) => s.customers.length },
  { id: "catalog", key: "products", subtitle: "skus · pod", count: (s) => s.products.length },
  { id: "press", key: "print_jobs", subtitle: "lulu.queue", count: (s) => s.press.length },
  { id: "inbox", key: "contact_messages", subtitle: "inbox", count: (s) => s.inbox.length },
  { id: "circulation", key: "subscribers", subtitle: "newsletter", count: (s) => s.subscribers.length },
  { id: "content", key: "cms", subtitle: "unpublished" },
  { id: "members", key: "members", subtitle: "auth.sessions", count: (_s, extra) => extra?.members ?? 0 },
  { id: "ops", key: "infra", subtitle: "webhooks · env", count: (s) => s.webhooks.length },
];

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#6b7380",
  paid: "#2ec9a8",
  fulfilling: "#e0a526",
  shipped: "#6b8aff",
  delivered: "#3ec8c8",
  failed: "#e0544a",
  canceled: "#e0544a",
  refunded: "#e0544a",
  queued: "#e0a526",
  processing: "#6b8aff",
  submitted: "#2ec9a8",
  AVAILABLE: "#2ec9a8",
  COMING_SOON: "#6b7380",
  stripe: "#6b8aff",
  lulu: "#e0a526",
};

const FALLBACK_COLORS = ["#2ec9a8", "#e0a526", "#6b8aff", "#3ec8c8", "#8b7cf8", "#e0544a"];

function usd(cents: number) {
  return money(cents / 100);
}

function pct(n: number, d: number, digits = 1) {
  if (!d) return "0%";
  return `${((n / d) * 100).toFixed(digits)}%`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + "Z";
  } catch {
    return iso;
  }
}

function shortId(value: string | null | undefined, n = 10) {
  if (!value) return "null";
  return value.length > n ? `${value.slice(0, n)}…` : value;
}

function colorFor(status: string, i = 0) {
  return STATUS_COLOR[status] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}

function statusPill(status: string) {
  const warn = ["failed", "canceled", "refunded", "pending_payment"].includes(status);
  const ok = ["paid", "submitted", "AVAILABLE", "shipped", "delivered"].includes(status);
  const ink = status === "COMING_SOON";
  const cls = warn
    ? "ara-admin__pill ara-admin__pill--warn"
    : ok
      ? "ara-admin__pill ara-admin__pill--ok"
      : ink
        ? "ara-admin__pill ara-admin__pill--ink"
        : "ara-admin__pill";
  return <span className={cls}>{status}</span>;
}

function addressLines(addr: ShippingAddress | null | undefined) {
  if (!addr) return "null";
  return [addr.name, addr.street1, addr.street2, `${addr.city}, ${addr.state_code} ${addr.postcode}`, addr.country_code]
    .filter(Boolean)
    .join("\n");
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 88;
  const h = 22;
  const max = Math.max(1, ...values);
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 1.5 - (v / max) * (h - 3);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="ara-admin__spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.4" points={pts} />
    </svg>
  );
}

function DualChart({
  points,
  aLabel,
  bLabel,
  formatA,
}: {
  points: Array<{ label: string; a: number; b: number }>;
  aLabel: string;
  bLabel: string;
  formatA: (n: number) => string;
}) {
  const W = 640;
  const H = 156;
  const T = 8;
  const B = 4;
  const innerH = H - T - B;
  const maxA = Math.max(1, ...points.map((p) => p.a));
  const maxB = Math.max(1, ...points.map((p) => p.b));
  const n = Math.max(1, points.length);
  const slot = W / n;
  const barW = Math.max(4, slot * 0.58);
  const line = points
    .map((p, i) => {
      const x = slot * i + slot / 2;
      const y = T + innerH * (1 - p.b / maxB);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="ara-admin__chart">
      <div className="ara-admin__legend">
        <span>
          <i className="is-mint" />
          {aLabel}
        </span>
        <span>
          <i className="is-gold" />
          {bLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="ara-admin__svg" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1="0"
            x2={W}
            y1={T + innerH * (1 - g)}
            y2={T + innerH * (1 - g)}
            className="ara-admin__gridline"
          />
        ))}
        {points.map((p, i) => {
          const bh = (p.a / maxA) * innerH;
          const x = slot * i + (slot - barW) / 2;
          const y = T + innerH - bh;
          return (
            <rect key={p.label} x={x} y={y} width={barW} height={Math.max(1, bh)} className="ara-admin__col">
              <title>
                {p.label} · {formatA(p.a)} · {p.b} {bLabel}
              </title>
            </rect>
          );
        })}
        <polyline className="ara-admin__line" fill="none" points={line} />
        {points.map((p, i) => {
          const x = slot * i + slot / 2;
          const y = T + innerH * (1 - p.b / maxB);
          return <circle key={`d-${p.label}`} cx={x} cy={y} r="2.2" className="ara-admin__dot-mark" />;
        })}
      </svg>
      <div className="ara-admin__chart-x">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

function Donut({ slices }: { slices: Array<{ label: string; value: number; color?: string }> }) {
  const total = slices.reduce((n, s) => n + s.value, 0);
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="ara-admin__donut">
      <svg viewBox="0 0 108 108" className="ara-admin__donut-svg">
        <circle cx="54" cy="54" r={r} fill="none" stroke="#1c2330" strokeWidth="12" />
        {total
          ? slices.map((s, i) => {
              const dash = (s.value / total) * c;
              const el = (
                <circle
                  key={s.label}
                  cx="54"
                  cy="54"
                  r={r}
                  fill="none"
                  stroke={s.color || colorFor(s.label, i)}
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 54 54)"
                >
                  <title>
                    {s.label} {s.value}
                  </title>
                </circle>
              );
              offset += dash;
              return el;
            })
          : null}
        <text x="54" y="50" textAnchor="middle" className="ara-admin__donut-n">
          {total}
        </text>
        <text x="54" y="64" textAnchor="middle" className="ara-admin__donut-k">
          total
        </text>
      </svg>
      <ul>
        {slices.length ? (
          slices.map((s, i) => (
            <li key={s.label}>
              <i style={{ background: s.color || colorFor(s.label, i) }} />
              <span>{s.label}</span>
              <b>{s.value}</b>
              <em>{pct(s.value, total, 0)}</em>
            </li>
          ))
        ) : (
          <li className="is-empty">no rows</li>
        )}
      </ul>
    </div>
  );
}

function Pipeline({ steps }: { steps: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="ara-admin__pipe">
      {steps.map((s) => (
        <div key={s.label} className="ara-admin__pipe-col">
          <b>{s.value}</b>
          <div className="ara-admin__pipe-track">
            <i style={{ height: `${Math.max(s.value ? 6 : 2, (s.value / max) * 100)}%` }} />
          </div>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ cells }: { cells: Array<{ label: string; value: number; hint?: string }> }) {
  const max = Math.max(1, ...cells.map((c) => c.value));
  return (
    <div className="ara-admin__heat">
      {cells.map((c) => (
        <div
          key={c.label}
          className="ara-admin__heat-cell"
          style={{ background: `rgba(46, 201, 168, ${0.08 + (c.value / max) * 0.72})` }}
          title={c.hint || `${c.label} ${c.value}`}
        >
          <span>{c.label}</span>
          <strong>{c.value ? usd(c.value) : "—"}</strong>
        </div>
      ))}
    </div>
  );
}

function Bars({
  rows,
}: {
  rows: Array<{ label: string; value: number; note?: string }>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <Empty>no series</Empty>;
  return (
    <div className="ara-admin__bars">
      {rows.map((r) => (
        <div className="ara-admin__bar" key={r.label}>
          <span>{r.label}</span>
          <i style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} />
          <span className="num">{r.note ?? String(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({
  kicker,
  value,
  note,
  spark,
  warn,
}: {
  kicker: string;
  value: string;
  note?: string;
  spark?: number[];
  warn?: boolean;
}) {
  return (
    <article className={`ara-admin__stat${warn ? " is-warn" : ""}`}>
      <span>{kicker}</span>
      <strong>{value}</strong>
      {note ? <em>{note}</em> : null}
      {spark ? <Sparkline values={spark} /> : null}
    </article>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="ara-admin__empty">{children}</p>;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "null"}</strong>
    </div>
  );
}

function SnapshotAge({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const sec = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  return <span className="ara-admin__mono">{sec}s lag</span>;
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const addr = order.shippingAddress;
  return (
    <div className="ara-admin__detail">
      <h3>
        {order.publicId} <span className="ara-admin__file">{order.id}</span>
      </h3>
      <div className="ara-admin__dl">
        <Field label="status" value={statusPill(order.status)} />
        <Field label="total_cents" value={`${order.totalCents} · ${usd(order.totalCents)}`} />
        <Field label="subtotal_cents" value={`${order.subtotalCents} · ${usd(order.subtotalCents)}`} />
        <Field label="shipping_cents" value={`${order.shippingCents} · ${usd(order.shippingCents)}`} />
        <Field label="currency" value={order.currency} />
        <Field label="email" value={order.email} />
        <Field label="customer_name" value={order.customerName} />
        <Field label="phone" value={order.phone} />
        <Field label="created_at" value={formatDateTime(order.createdAt)} />
        <Field label="updated_at" value={formatDateTime(order.updatedAt)} />
        <Field label="shipping_level" value={order.shippingLevel} />
        <Field label="stripe.session" value={<span className="ara-admin__mono">{order.stripeCheckoutSessionId}</span>} />
        <Field label="stripe.pi" value={<span className="ara-admin__mono">{order.stripePaymentIntentId}</span>} />
        <Field
          label="print_job"
          value={
            order.fulfillment
              ? `${order.fulfillment.status}${order.fulfillment.luluStatus ? ` · lulu=${order.fulfillment.luluStatus}` : ""}`
              : "null"
          }
        />
        <div>
          <span>shipping_address</span>
          <p style={{ whiteSpace: "pre-wrap" }}>{addressLines(addr)}</p>
        </div>
      </div>
      <div className="ara-admin__table-wrap">
        <table className="ara-admin__table">
          <thead>
            <tr>
              <th>product_id</th>
              <th>title</th>
              <th>qty</th>
              <th>unit_cents</th>
              <th>line_cents</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ cursor: "default" }}>
                <td className="num">{item.productId}</td>
                <td>{item.title}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{item.unitPriceCents}</td>
                <td className="num">{item.lineTotalCents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {order.fulfillment?.trackingUrl ? (
        <a className="ara-admin__btn ara-admin__btn--ghost" href={order.fulfillment.trackingUrl} target="_blank" rel="noreferrer">
          tracking_url
        </a>
      ) : null}
      {order.fulfillment?.lastError ? <p className="ara-admin__error">{order.fulfillment.lastError}</p> : null}
    </div>
  );
}

function CustomerDetail({ customer, inbox }: { customer: AdminCustomer; inbox: AdminInbox[] }) {
  const notes = inbox.filter((m) => m.email.toLowerCase() === (customer.email || "").toLowerCase());
  return (
    <div className="ara-admin__detail">
      <h3>
        {customer.email || customer.key}{" "}
        <span className="ara-admin__file">{customer.guest ? "guest=true" : "guest=false"}</span>
      </h3>
      <div className="ara-admin__dl">
        <Field label="name" value={customer.name} />
        <Field label="phone" value={customer.phone} />
        <Field label="ltv_cents" value={`${customer.lifetimeCents} · ${usd(customer.lifetimeCents)}`} />
        <Field label="refunded_cents" value={`${customer.refundedCents} · ${usd(customer.refundedCents)}`} />
        <Field label="orders" value={`${customer.orderCount} · ${customer.paidOrderCount} paid`} />
        <Field label="first_order_at" value={formatDateTime(customer.firstOrderAt)} />
        <Field label="last_order_at" value={formatDateTime(customer.lastOrderAt)} />
        <Field label="subscribed" value={String(customer.subscribed)} />
        <Field label="inbox_count" value={String(customer.inboxCount)} />
        <Field label="cities" value={customer.cities.join(" · ") || "[]"} />
        <Field label="regions" value={customer.regions.join(" · ") || "[]"} />
        <Field label="skus" value={customer.products.join(" · ") || "[]"} />
        <Field
          label="statuses"
          value={
            Object.entries(customer.statuses)
              .map(([k, v]) => `${k}=${v}`)
              .join(" · ") || "{}"
          }
        />
      </div>
      {customer.addresses.length ? (
        <div className="ara-admin__dl">
          {customer.addresses.map((addr, i) => (
            <div key={`${addr.street1}-${i}`}>
              <span>address[{i}]</span>
              <p style={{ whiteSpace: "pre-wrap" }}>{addressLines(addr)}</p>
            </div>
          ))}
        </div>
      ) : null}
      {customer.orders.length ? (
        <div className="ara-admin__table-wrap">
          <table className="ara-admin__table">
            <thead>
              <tr>
                <th>public_id</th>
                <th>status</th>
                <th>total_cents</th>
                <th>created_at</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((row) => (
                <tr key={row.publicId} style={{ cursor: "default" }}>
                  <td className="num">{row.publicId}</td>
                  <td>{statusPill(row.status)}</td>
                  <td className="num">{row.totalCents}</td>
                  <td>{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {notes.map((note) => (
        <article key={note.id}>
          <span className="ara-admin__file">
            {note.topic} · {formatDateTime(note.createdAt)}
          </span>
          <p className="ara-admin__message">{note.message}</p>
        </article>
      ))}
    </div>
  );
}

function ProductDetail({ product }: { product: AdminProduct }) {
  return (
    <div className="ara-admin__detail">
      <h3>
        {product.slug} <span className="ara-admin__file">{product.id}</span>
      </h3>
      <div className="ara-admin__dl">
        <Field label="status" value={statusPill(product.status)} />
        <Field label="price_cents" value={`${product.priceCents} · ${usd(product.priceCents)}`} />
        <Field label="currency" value={product.currency} />
        <Field label="ticker" value={product.ticker} />
        <Field label="volume" value={product.volume} />
        <Field label="sector" value={product.sector} />
        <Field label="company" value={product.company} />
        <Field label="headquarters" value={product.headquarters} />
        <Field label="page_count" value={String(product.pageCount)} />
        <Field label="pod_package_id" value={product.podPackageId} />
        <Field label="spine" value={`${product.spineHeight ?? "null"} × ${product.spineWidth ?? "null"}`} />
        <Field label="units_sold" value={String(product.unitsSold)} />
        <Field label="revenue_cents" value={`${product.revenueCents} · ${usd(product.revenueCents)}`} />
        <Field label="order_count" value={String(product.orderCount)} />
        <Field label="sample_pdf" value={String(product.samplePdf)} />
        <Field label="module_link" value={product.moduleLink} />
        <Field label="interior_pdf_url" value={<span className="ara-admin__mono">{product.interiorPdfUrl}</span>} />
        <Field label="cover_pdf_url" value={<span className="ara-admin__mono">{product.coverPdfUrl}</span>} />
        <Field label="created_at" value={formatDateTime(product.createdAt)} />
        <Field label="updated_at" value={formatDateTime(product.updatedAt)} />
      </div>
    </div>
  );
}

function AdminLock({ onAuthed }: { onAuthed: () => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [dev, setDev] = useState(false);
  const [phase, setPhase] = useState<"pin" | "wait">("pin");

  useEffect(() => {
    if (phase !== "wait" || !challengeId) return;
    let stop = false;
    const tick = async () => {
      try {
        const row = await pollAdminChallenge(challengeId);
        if (stop) return;
        if (row.status === "allowed") {
          await completeAdminChallenge(challengeId);
          onAuthed();
          return;
        }
        if (row.status === "denied") {
          setError("challenge.status=denied");
          setPhase("pin");
          setChallengeId(null);
          return;
        }
        if (row.status === "expired") {
          setError("challenge.status=expired");
          setPhase("pin");
          setChallengeId(null);
        }
      } catch (err) {
        if (!stop) setError(err instanceof Error ? err.message : "poll failed");
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [phase, challengeId, onAuthed]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const row = await requestAdminAccess(pin);
      setPin("");
      setChallengeId(row.challengeId);
      setExpiresAt(row.expiresAt);
      setDev(Boolean(row.dev));
      setPhase("wait");
    } catch (err) {
      setError(err instanceof Error ? err.message : "POST /v1/admin/auth/request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ara-admin ara-admin--lock">
      <div className="ara-admin__lock">
        <div className="ara-admin__brand">
          MM <strong>OPS</strong>
        </div>
        <h1>auth.challenge</h1>
        {phase === "pin" ? (
          <>
            <p>
              POST /v1/admin/auth/request → WhatsApp tap Allow from either operator. Unknown numbers never get the message.
            </p>
            <form onSubmit={onSubmit}>
              {error ? (
                <div className="ara-admin__error" role="alert">
                  {error}
                </div>
              ) : null}
              <label>
                <span>ADMIN_PIN</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  minLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </label>
              <button type="submit" className="ara-admin__btn" disabled={busy}>
                {busy ? "requesting…" : "request_access"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p>
              challenge_id=<code>{challengeId}</code>
              {expiresAt ? ` expires_at=${expiresAt.replace("T", " ").slice(0, 19)}Z` : ""}
            </p>
            <p>
              tap Allow or Deny in the WhatsApp we sent both operators
            </p>
            {dev ? (
              <p className="ara-admin__lede">dev: WhatsApp unset. POST /v1/admin/auth/dev-allow</p>
            ) : null}
            {error ? (
              <div className="ara-admin__error" role="alert">
                {error}
              </div>
            ) : (
              <p className="ara-admin__loading">poll /v1/admin/auth/status …</p>
            )}
            <button
              type="button"
              className="ara-admin__btn ara-admin__btn--ghost"
              onClick={() => {
                setPhase("pin");
                setChallengeId(null);
                setError("");
              }}
            >
              abort
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function ComingSoon({ tab }: { tab: ContentTab }) {
  const long = tab === "long";
  return (
    <div className="ara-admin__coming">
      <span className="ara-admin__coming-stamp">501</span>
      <p className="ara-admin__coming-kicker">{long ? "cms.long_form" : "cms.short_form"}</p>
      <h3>NOT_IMPLEMENTED</h3>
      <p>
        {long
          ? "No drafts table, editor, or publish pipeline. company modules / digest interiors / essays are unwired."
          : "No posts table or editor. newsroom briefs / tickers / one-liners are unwired."}
      </p>
    </div>
  );
}

export function AdminDesk() {
  const search = useSearchParams();
  const initial = (search.get("desk") as DeskId) || "overview";
  const [desk, setDesk] = useState<DeskId>(DESKS.some((d) => d.id === initial) ? initial : "overview");
  const [contentTab, setContentTab] = useState<ContentTab>("long");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [sessions, setSessions] = useState(0);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [openCustomer, setOpenCustomer] = useState<string | null>(null);
  const [openInbox, setOpenInbox] = useState<string | null>(null);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [snap, ledger] = await Promise.all([fetchAdminSnapshot(), fetchAdminMembers()]);
      setSnapshot(snap);
      setMembers(ledger.members);
      setSessions(ledger.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GET /v1/admin unreachable");
      if (err instanceof Error && err.message === "Unauthorized") setAuthed(false);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdminMe().then((me) => {
      setAuthed(Boolean(me));
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  const current = DESKS.find((d) => d.id === desk) ?? DESKS[0];
  const q = query.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    const rows = snapshot?.orders ?? [];
    return rows.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return `${o.publicId} ${o.id} ${o.email} ${o.customerName} ${o.status} ${o.stripePaymentIntentId} ${o.items.map((i) => i.productId).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [snapshot, q, statusFilter]);

  const filteredCustomers = useMemo(() => {
    const rows = snapshot?.customers ?? [];
    return rows.filter((c) => {
      if (!q) return true;
      return `${c.name} ${c.email} ${c.phone} ${c.cities.join(" ")} ${c.products.join(" ")} ${c.key}`
        .toLowerCase()
        .includes(q);
    });
  }, [snapshot, q]);

  const derived = useMemo(() => {
    if (!snapshot) return null;
    const { kpis, orders, customers, inbox, subscribers, press, webhooks, revenueByDay } = snapshot;
    const fillRate = kpis.paidOrders ? kpis.shipped / kpis.paidOrders : 0;
    const shipShare = kpis.revenueCents ? kpis.shippingCollectedCents / kpis.revenueCents : 0;
    const identified = customers.filter((c) => !c.guest && c.email);
    const guests = customers.filter((c) => c.guest);
    const repeat = customers.filter((c) => c.paidOrderCount > 1);
    const refunded = orders.filter((o) => o.status === "refunded" || o.status === "canceled");
    const ltvBuckets = [
      { label: "$0", value: customers.filter((c) => c.lifetimeCents <= 0).length },
      { label: "<$50", value: customers.filter((c) => c.lifetimeCents > 0 && c.lifetimeCents < 5000).length },
      { label: "$50–99", value: customers.filter((c) => c.lifetimeCents >= 5000 && c.lifetimeCents < 10000).length },
      { label: "$100–249", value: customers.filter((c) => c.lifetimeCents >= 10000 && c.lifetimeCents < 25000).length },
      { label: "$250+", value: customers.filter((c) => c.lifetimeCents >= 25000).length },
    ];
    const topics: Record<string, number> = {};
    for (const m of inbox) topics[m.topic] = (topics[m.topic] ?? 0) + 1;
    const subsByDay = revenueByDay.map((d) => ({
      day: d.day,
      n: subscribers.filter((s) => s.createdAt && s.createdAt.slice(0, 10) === d.day).length,
    }));
    const lastHook = webhooks[0]?.processedAt ?? null;
    const exceptions: string[] = [];
    if (!snapshot.integrations.stripe) exceptions.push("STRIPE_SECRET_KEY unset");
    if (!snapshot.integrations.lulu) exceptions.push("LULU_CLIENT_KEY unset");
    if (kpis.pressFailed) exceptions.push(`print_jobs.failed=${kpis.pressFailed}`);
    if (snapshot.catalogHealth.samplePdfs) exceptions.push(`catalog.sample_pdf=${snapshot.catalogHealth.samplePdfs}`);
    if (snapshot.catalogHealth.missingTicker) exceptions.push(`products.ticker=null × ${snapshot.catalogHealth.missingTicker}`);
    if (snapshot.catalogHealth.missingModule) exceptions.push(`products.module_link=null × ${snapshot.catalogHealth.missingModule}`);
    const failedJobs = press.filter((j) => j.status === "failed" || j.lastError);
    const unitsPerOrder = kpis.paidOrders ? kpis.unitsSold / kpis.paidOrders : 0;
    return {
      fillRate,
      shipShare,
      identified: identified.length,
      guests: guests.length,
      repeat: repeat.length,
      refunded: refunded.length,
      ltvBuckets,
      topics,
      subsByDay,
      lastHook,
      exceptions,
      failedJobs,
      unitsPerOrder,
      revSpark: revenueByDay.map((d) => d.revenueCents),
      orderSpark: revenueByDay.map((d) => d.orders),
    };
  }, [snapshot]);

  const selectedOrder = snapshot?.orders.find((o) => o.id === openOrder) ?? null;
  const selectedCustomer = snapshot?.customers.find((c) => c.key === openCustomer) ?? null;
  const selectedInbox = snapshot?.inbox.find((m) => m.id === openInbox) ?? null;
  const selectedJob = snapshot?.press.find((j) => j.id === openJob) ?? null;
  const selectedProduct = snapshot?.products.find((p) => p.id === openProduct) ?? null;

  async function toggleProduct(product: AdminProduct) {
    setSaving(true);
    setError("");
    try {
      await patchAdminProduct(product.id, {
        status: product.status === "AVAILABLE" ? "COMING_SOON" : "AVAILABLE",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PATCH /v1/admin/products failed");
    } finally {
      setSaving(false);
    }
  }

  function goto(id: DeskId) {
    setDesk(id);
    setQuery("");
    setStatusFilter("all");
    const url = new URL(window.location.href);
    url.searchParams.set("desk", id);
    window.history.replaceState({}, "", url);
  }

  async function onLogout() {
    await logoutAdmin();
    setAuthed(false);
    setSnapshot(null);
  }

  if (!authReady) {
    return (
      <section className="ara-admin ara-admin--lock">
        <div className="ara-admin__lock">
          <div className="ara-admin__brand">
            MM <strong>OPS</strong>
          </div>
          <p className="ara-admin__loading">GET /v1/admin/auth/me …</p>
        </div>
      </section>
    );
  }

  if (!authed) return <AdminLock onAuthed={() => setAuthed(true)} />;

  return (
    <section className="ara-admin">
      <div className="ara-admin__inner">
        <header className="ara-admin__top">
          <div className="ara-admin__brand">
            MM <strong>OPS</strong>
          </div>
          <span className={`ara-admin__dot${snapshot ? " is-live" : ""}`}>
            {busy ? "sync" : snapshot ? "live" : "down"}
          </span>
          <span className="ara-admin__mono">GET /v1/admin</span>
          <div className="ara-admin__top-meta">
            <span>{snapshot ? <SnapshotAge iso={snapshot.generatedAt} /> : "no snapshot"}</span>
            <span>
              stripe={snapshot?.integrations.stripe ? "ok" : "unset"} lulu=
              {snapshot?.integrations.lulu ? "ok" : "unset"}
            </span>
            <button type="button" className="ara-admin__btn" onClick={() => void load()} disabled={busy}>
              {busy ? "refresh…" : "refresh"}
            </button>
            <button type="button" className="ara-admin__btn" onClick={() => void onLogout()}>
              logout
            </button>
            <Link className="ara-admin__btn" href="/">
              origin
            </Link>
          </div>
        </header>

        <div className="ara-admin__shell">
          <aside className="ara-admin__nav">
            <div className="ara-admin__nav-head">
              <span>desks</span>
              <strong>{busy ? "…" : snapshot ? "200" : "ERR"}</strong>
            </div>
            <nav className="ara-admin__nav-list" aria-label="Admin desks">
              {DESKS.map((item) => {
                const count = snapshot ? item.count?.(snapshot, { members: members.length }) : undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={desk === item.id ? "is-active" : undefined}
                    onClick={() => goto(item.id)}
                  >
                    <span>
                      <h2>{item.key}</h2>
                      <small>{item.subtitle}</small>
                    </span>
                    {count != null ? <span className="ara-admin__count">{count}</span> : <span />}
                  </button>
                );
              })}
            </nav>
            <p className="ara-admin__nav-note">pin + wa tap</p>
          </aside>

          <div className="ara-admin__stage">
            <div className="ara-admin__stage-head">
              {desk === "content" ? (
                <div className="ara-admin__tabs" role="tablist" aria-label="CMS form">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={contentTab === "long"}
                    className={contentTab === "long" ? "is-active" : undefined}
                    onClick={() => setContentTab("long")}
                  >
                    long_form
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={contentTab === "short"}
                    className={contentTab === "short" ? "is-active" : undefined}
                    onClick={() => setContentTab("short")}
                  >
                    short_form
                  </button>
                </div>
              ) : null}
              <div>
                <span className="ara-admin__stage-kicker">/admin?desk={current.id}</span>
                <h2>{current.key}</h2>
                <p>
                  {desk === "content"
                    ? `cms.${contentTab}_form status=501`
                    : snapshot
                      ? `${formatDateTime(snapshot.generatedAt)} · orders=${snapshot.orders.length} jobs=${snapshot.press.length} hooks=${snapshot.webhooks.length}`
                      : "waiting GET /v1/admin"}
                </p>
              </div>
            </div>

            <div className="ara-admin__stage-body">
              {error ? (
                <div className="ara-admin__error" role="alert">
                  {error}
                </div>
              ) : null}
              {busy && !snapshot ? <p className="ara-admin__loading">loading snapshot…</p> : null}

              {desk === "overview" && snapshot && derived ? (
                <>
                  {derived.exceptions.length ? (
                    <div className="ara-admin__ex">
                      {derived.exceptions.map((e) => (
                        <span key={e}>{e}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="ara-admin__stats">
                    <Stat
                      kicker="gmv"
                      value={usd(snapshot.kpis.revenueCents)}
                      note={`${snapshot.kpis.revenueCents} cents · ${snapshot.kpis.paidOrders} paid`}
                      spark={derived.revSpark}
                    />
                    <Stat
                      kicker="aov"
                      value={usd(snapshot.kpis.aovCents)}
                      note={`${derived.unitsPerOrder.toFixed(2)} units/order`}
                    />
                    <Stat
                      kicker="open"
                      value={String(snapshot.kpis.openOrders)}
                      note={`${snapshot.kpis.orders} total`}
                    />
                    <Stat
                      kicker="24h"
                      value={usd(snapshot.kpis.last24hRevenueCents)}
                      note={`${snapshot.kpis.last24hOrders} orders`}
                      spark={derived.orderSpark}
                    />
                    <Stat
                      kicker="fill_rate"
                      value={pct(snapshot.kpis.shipped, snapshot.kpis.paidOrders)}
                      note={`${snapshot.kpis.shipped} shipped / ${snapshot.kpis.paidOrders} paid`}
                    />
                    <Stat
                      kicker="ship_share"
                      value={pct(snapshot.kpis.shippingCollectedCents, snapshot.kpis.revenueCents)}
                      note={`${usd(snapshot.kpis.shippingCollectedCents)} collected`}
                    />
                    <Stat
                      kicker="print_queue"
                      value={String(snapshot.kpis.pressQueued)}
                      note={`${snapshot.kpis.pressSubmitted} submitted`}
                    />
                    <Stat
                      kicker="print_jobs.failed"
                      value={String(snapshot.kpis.pressFailed)}
                      note={`${derived.refunded} refunded|canceled`}
                      warn={snapshot.kpis.pressFailed > 0}
                    />
                  </div>
                  <div className="ara-admin__stats ara-admin__stats--tight">
                    <Stat kicker="customers" value={String(snapshot.kpis.customers)} note={`${derived.identified} identified · ${derived.guests} guest`} />
                    <Stat kicker="repeat" value={String(derived.repeat)} note={pct(derived.repeat, snapshot.kpis.customers)} />
                    <Stat kicker="subscribers" value={String(snapshot.kpis.subscribers)} note={`${snapshot.kpis.inbox} inbox`} />
                    <Stat
                      kicker="sku"
                      value={`${snapshot.kpis.available}/${snapshot.kpis.catalog}`}
                      note={`${snapshot.kpis.comingSoon} COMING_SOON`}
                    />
                  </div>
                  <div className="ara-admin__grid-2">
                    <section className="ara-admin__panel">
                      <h3>revenue_cents · orders 14d</h3>
                      <DualChart
                        points={snapshot.revenueByDay.map((d) => ({
                          label: d.day.slice(8),
                          a: d.revenueCents,
                          b: d.orders,
                        }))}
                        aLabel="revenue"
                        bLabel="orders"
                        formatA={usd}
                      />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>orders.status</h3>
                      <Donut
                        slices={Object.entries(snapshot.ordersByStatus).map(([label, value]) => ({
                          label,
                          value,
                        }))}
                      />
                    </section>
                  </div>
                  <section className="ara-admin__panel" style={{ marginTop: 10 }}>
                    <h3>gmv heatmap 14d</h3>
                    <Heatmap
                      cells={snapshot.revenueByDay.map((d) => ({
                        label: d.day.slice(8),
                        value: d.revenueCents,
                        hint: `${d.day} · ${d.orders} orders · ${usd(d.revenueCents)}`,
                      }))}
                    />
                  </section>
                  <div className="ara-admin__grid-2" style={{ marginTop: 10 }}>
                    <section className="ara-admin__panel">
                      <h3>fulfillment pipeline</h3>
                      <Pipeline
                        steps={[
                          { label: "pending", value: snapshot.ordersByStatus.pending_payment ?? 0 },
                          { label: "paid", value: snapshot.ordersByStatus.paid ?? 0 },
                          { label: "fulfilling", value: snapshot.ordersByStatus.fulfilling ?? 0 },
                          { label: "shipped", value: snapshot.ordersByStatus.shipped ?? 0 },
                          { label: "delivered", value: snapshot.ordersByStatus.delivered ?? 0 },
                          {
                            label: "dead",
                            value:
                              (snapshot.ordersByStatus.failed ?? 0) +
                              (snapshot.ordersByStatus.canceled ?? 0) +
                              (snapshot.ordersByStatus.refunded ?? 0),
                          },
                        ]}
                      />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>print_jobs.status</h3>
                      <Donut
                        slices={Object.entries(snapshot.jobsByStatus).map(([label, value]) => ({
                          label,
                          value,
                        }))}
                      />
                    </section>
                  </div>
                  <div className="ara-admin__grid-2" style={{ marginTop: 10 }}>
                    <section className="ara-admin__panel">
                      <h3>revenue by sku</h3>
                      <Bars
                        rows={snapshot.revenueByProduct.slice(0, 8).map((p) => ({
                          label: p.ticker || p.company,
                          value: p.revenueCents,
                          note: `${p.unitsSold}u · ${usd(p.revenueCents)}`,
                        }))}
                      />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>shipping.country_code</h3>
                      <Bars
                        rows={snapshot.shippingByCountry.map((r) => ({
                          label: r.country,
                          value: r.revenueCents,
                          note: `${r.orders} · ${usd(r.revenueCents)}`,
                        }))}
                      />
                    </section>
                  </div>
                  {derived.failedJobs.length ? (
                    <section className="ara-admin__panel" style={{ marginTop: 10 }}>
                      <h3>exceptions.print_jobs</h3>
                      <PressTable
                        rows={derived.failedJobs}
                        orders={snapshot.orders}
                        openId={openJob}
                        onOpen={(id) => {
                          setOpenJob(id);
                          goto("press");
                        }}
                      />
                    </section>
                  ) : null}
                  <section className="ara-admin__panel" style={{ marginTop: 10 }}>
                    <h3>orders.recent n=10</h3>
                    <OrderTable
                      rows={snapshot.orders.slice(0, 10)}
                      openId={openOrder}
                      onOpen={(id) => {
                        setOpenOrder(id);
                        goto("orders");
                      }}
                    />
                  </section>
                  <section className="ara-admin__panel" style={{ marginTop: 10 }}>
                    <h3>
                      webhook_events n={snapshot.webhooks.length}
                      {derived.lastHook ? ` · last=${formatDateTime(derived.lastHook)}` : ""}
                    </h3>
                    <WebhookTable rows={snapshot.webhooks.slice(0, 8)} />
                  </section>
                </>
              ) : null}

              {desk === "orders" && snapshot ? (
                <>
                  <div className="ara-admin__stats ara-admin__stats--tight">
                    {Object.entries(snapshot.ordersByStatus).map(([status, count]) => (
                      <Stat key={status} kicker={status} value={String(count)} note={pct(count, snapshot.kpis.orders)} />
                    ))}
                  </div>
                  <div className="ara-admin__toolbar">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="public_id, uuid, email, pi, sku…"
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">status=*</option>
                      {Object.keys(snapshot.ordersByStatus).map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <span className="ara-admin__file">
                      {filteredOrders.length}/{snapshot.orders.length}
                    </span>
                  </div>
                  <OrderTable rows={filteredOrders} openId={openOrder} onOpen={setOpenOrder} />
                  {selectedOrder ? <OrderDetail order={selectedOrder} /> : null}
                </>
              ) : null}

              {desk === "customers" && snapshot && derived ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="n" value={String(snapshot.customers.length)} />
                    <Stat kicker="identified" value={String(derived.identified)} note={pct(derived.identified, snapshot.customers.length)} />
                    <Stat kicker="guest" value={String(derived.guests)} />
                    <Stat kicker="repeat" value={String(derived.repeat)} note="paid_order_count>1" />
                  </div>
                  <div className="ara-admin__grid-2">
                    <section className="ara-admin__panel">
                      <h3>ltv buckets</h3>
                      <Donut slices={derived.ltvBuckets} />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>ltv histogram</h3>
                      <Bars
                        rows={derived.ltvBuckets.map((b) => ({
                          label: b.label,
                          value: b.value,
                        }))}
                      />
                    </section>
                  </div>
                  <div className="ara-admin__toolbar" style={{ marginTop: 10 }}>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="email, phone, city, sku, key…"
                    />
                    <span className="ara-admin__file">
                      {filteredCustomers.length}/{snapshot.customers.length}
                    </span>
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>email</th>
                          <th>guest</th>
                          <th>orders</th>
                          <th>paid</th>
                          <th>ltv_cents</th>
                          <th>refunded</th>
                          <th>sub</th>
                          <th>last_order_at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((c) => (
                          <tr
                            key={c.key}
                            className={openCustomer === c.key ? "is-open" : undefined}
                            onClick={() => setOpenCustomer(c.key === openCustomer ? null : c.key)}
                          >
                            <td>
                              <strong>{c.email || "null"}</strong>
                              <div className="ara-admin__file">{c.name || c.key}</div>
                            </td>
                            <td className="num">{String(c.guest)}</td>
                            <td className="num">{c.orderCount}</td>
                            <td className="num">{c.paidOrderCount}</td>
                            <td className="num">{c.lifetimeCents}</td>
                            <td className="num">{c.refundedCents}</td>
                            <td>{c.subscribed ? "true" : "false"}</td>
                            <td>{formatDateTime(c.lastOrderAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!filteredCustomers.length ? <Empty>no customers</Empty> : null}
                  </div>
                  {selectedCustomer ? <CustomerDetail customer={selectedCustomer} inbox={snapshot.inbox} /> : null}
                </>
              ) : null}

              {desk === "catalog" && snapshot ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="skus" value={String(snapshot.kpis.catalog)} />
                    <Stat kicker="AVAILABLE" value={String(snapshot.kpis.available)} />
                    <Stat kicker="COMING_SOON" value={String(snapshot.kpis.comingSoon)} />
                    <Stat
                      kicker="sample_pdf"
                      value={String(snapshot.catalogHealth.samplePdfs)}
                      note={`ticker=null ${snapshot.catalogHealth.missingTicker} · module=null ${snapshot.catalogHealth.missingModule}`}
                      warn={snapshot.catalogHealth.samplePdfs > 0}
                    />
                  </div>
                  <section className="ara-admin__panel" style={{ marginBottom: 10 }}>
                    <h3>units · revenue by sku</h3>
                    <Bars
                      rows={snapshot.revenueByProduct.map((p) => ({
                        label: p.ticker || p.company,
                        value: p.revenueCents,
                        note: `${p.unitsSold}u · ${p.orderCount}o · ${usd(p.revenueCents)}`,
                      }))}
                    />
                  </section>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>slug</th>
                          <th>ticker</th>
                          <th>status</th>
                          <th>price_cents</th>
                          <th>units</th>
                          <th>gmv_cents</th>
                          <th>pp</th>
                          <th>pod_package_id</th>
                          <th>pdf</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.products.map((p) => (
                          <tr
                            key={p.id}
                            className={openProduct === p.id ? "is-open" : undefined}
                            onClick={() => setOpenProduct(p.id === openProduct ? null : p.id)}
                          >
                            <td>
                              <strong>{p.slug}</strong>
                              <div className="ara-admin__file">{p.id}</div>
                            </td>
                            <td className="num">{p.ticker || "null"}</td>
                            <td>{statusPill(p.status)}</td>
                            <td className="num">{p.priceCents}</td>
                            <td className="num">{p.unitsSold}</td>
                            <td className="num">{p.revenueCents}</td>
                            <td className="num">{p.pageCount}</td>
                            <td className="num">{p.podPackageId}</td>
                            <td>
                              {p.samplePdf ? (
                                <span className="ara-admin__pill ara-admin__pill--warn">sample</span>
                              ) : (
                                "prod"
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="ara-admin__text-btn"
                                disabled={saving}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void toggleProduct(p);
                                }}
                              >
                                {p.status === "AVAILABLE" ? "set COMING_SOON" : "set AVAILABLE"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedProduct ? <ProductDetail product={selectedProduct} /> : null}
                </>
              ) : null}

              {desk === "press" && snapshot ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="queued" value={String(snapshot.kpis.pressQueued)} />
                    <Stat kicker="submitted" value={String(snapshot.kpis.pressSubmitted)} />
                    <Stat kicker="failed" value={String(snapshot.kpis.pressFailed)} warn={snapshot.kpis.pressFailed > 0} />
                    <Stat kicker="orders.shipped" value={String(snapshot.kpis.shipped)} />
                  </div>
                  <div className="ara-admin__grid-2">
                    <section className="ara-admin__panel">
                      <h3>print_jobs.status</h3>
                      <Donut
                        slices={Object.entries(snapshot.jobsByStatus).map(([label, value]) => ({ label, value }))}
                      />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>attempts</h3>
                      <Bars
                        rows={Object.entries(
                          snapshot.press.reduce<Record<string, number>>((acc, j) => {
                            const k = `${j.attempts}/${j.maxAttempts}`;
                            acc[k] = (acc[k] ?? 0) + 1;
                            return acc;
                          }, {}),
                        ).map(([label, value]) => ({ label, value }))}
                      />
                    </section>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <PressTable rows={snapshot.press} orders={snapshot.orders} openId={openJob} onOpen={setOpenJob} />
                  </div>
                  {selectedJob ? (
                    <JobDetail job={selectedJob} order={snapshot.orders.find((o) => o.id === selectedJob.orderId)} />
                  ) : null}
                </>
              ) : null}

              {desk === "inbox" && snapshot && derived ? (
                <>
                  <div className="ara-admin__grid-2" style={{ marginBottom: 10 }}>
                    <section className="ara-admin__panel">
                      <h3>topic</h3>
                      <Donut
                        slices={Object.entries(derived.topics).map(([label, value]) => ({ label, value }))}
                      />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>volume</h3>
                      <Stat kicker="contact_messages" value={String(snapshot.inbox.length)} note={`unique emails ${new Set(snapshot.inbox.map((m) => m.email.toLowerCase())).size}`} />
                    </section>
                  </div>
                  <div className="ara-admin__toolbar">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="name, email, topic…"
                    />
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>id</th>
                          <th>from</th>
                          <th>topic</th>
                          <th>body</th>
                          <th>created_at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.inbox
                          .filter((m) =>
                            q ? `${m.name} ${m.email} ${m.topic} ${m.message}`.toLowerCase().includes(q) : true,
                          )
                          .map((m) => (
                            <tr
                              key={m.id}
                              className={openInbox === m.id ? "is-open" : undefined}
                              onClick={() => setOpenInbox(m.id === openInbox ? null : m.id)}
                            >
                              <td className="num">{shortId(m.id, 8)}</td>
                              <td>
                                <strong>{m.email}</strong>
                                <div className="ara-admin__file">{m.name}</div>
                              </td>
                              <td>{m.topic}</td>
                              <td>{m.message.slice(0, 80)}{m.message.length > 80 ? "…" : ""}</td>
                              <td>{formatDateTime(m.createdAt)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!snapshot.inbox.length ? <Empty>contact_messages=0</Empty> : null}
                  </div>
                  {selectedInbox ? (
                    <div className="ara-admin__detail">
                      <h3>{selectedInbox.topic}</h3>
                      <div className="ara-admin__dl">
                        <Field label="id" value={<span className="ara-admin__mono">{selectedInbox.id}</span>} />
                        <Field label="name" value={selectedInbox.name} />
                        <Field label="email" value={selectedInbox.email} />
                        <Field label="phone" value={selectedInbox.phone} />
                        <Field label="created_at" value={formatDateTime(selectedInbox.createdAt)} />
                      </div>
                      <p className="ara-admin__message">{selectedInbox.message}</p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {desk === "circulation" && snapshot && derived ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="subscribers" value={String(snapshot.subscribers.length)} spark={derived.subsByDay.map((d) => d.n)} />
                    <Stat
                      kicker="also_ordered"
                      value={String(snapshot.customers.filter((c) => c.subscribed && c.orderCount > 0).length)}
                    />
                    <Stat kicker="also_inbox" value={String(snapshot.customers.filter((c) => c.inboxCount > 0).length)} />
                    <Stat kicker="guest_checkouts" value={String(snapshot.customers.filter((c) => c.guest).length)} />
                  </div>
                  <section className="ara-admin__panel" style={{ marginBottom: 10 }}>
                    <h3>signups 14d</h3>
                    <DualChart
                      points={derived.subsByDay.map((d) => ({
                        label: d.day.slice(8),
                        a: d.n,
                        b: d.n,
                      }))}
                      aLabel="signups"
                      bLabel="n"
                      formatA={(n) => String(n)}
                    />
                  </section>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>email</th>
                          <th>created_at</th>
                          <th>orders</th>
                          <th>ltv_cents</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.subscribers.map((s) => {
                          const customer = snapshot.customers.find(
                            (c) => c.email?.toLowerCase() === s.email.toLowerCase(),
                          );
                          return (
                            <tr key={s.email} style={{ cursor: "default" }}>
                              <td>{s.email}</td>
                              <td>{formatDateTime(s.createdAt)}</td>
                              <td className="num">{customer?.orderCount ?? 0}</td>
                              <td className="num">{customer?.lifetimeCents ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!snapshot.subscribers.length ? <Empty>subscribers=0</Empty> : null}
                  </div>
                </>
              ) : null}

              {desk === "content" ? <ComingSoon tab={contentTab} /> : null}

              {desk === "members" ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="members.json" value={String(members.length)} />
                    <Stat kicker="sessions" value={String(sessions)} />
                    <Stat kicker="email_overlap" value={String(snapshot?.kpis.membersEstimate ?? 0)} />
                    <Stat kicker="subscribers" value={String(snapshot?.kpis.subscribers ?? 0)} />
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>id</th>
                          <th>member_no</th>
                          <th>name</th>
                          <th>email</th>
                          <th>created_at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.id} style={{ cursor: "default" }}>
                            <td className="num">{shortId(m.id, 8)}</td>
                            <td className="num">{m.memberNo}</td>
                            <td>{m.name}</td>
                            <td>{m.email}</td>
                            <td>{formatDate(m.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!members.length ? <Empty>members.json rows=0</Empty> : null}
                  </div>
                </>
              ) : null}

              {desk === "ops" && snapshot ? (
                <>
                  <div className="ara-admin__ops-grid">
                    <article className={`ara-admin__stat${snapshot.integrations.stripe ? "" : " is-warn"}`}>
                      <span>STRIPE_SECRET_KEY</span>
                      <strong>{snapshot.integrations.stripe ? "set" : "unset"}</strong>
                      <em>checkout + webhooks</em>
                    </article>
                    <article className={`ara-admin__stat${snapshot.integrations.lulu ? "" : " is-warn"}`}>
                      <span>LULU_CLIENT_KEY</span>
                      <strong>{snapshot.integrations.lulu ? "set" : "unset"}</strong>
                      <em>{snapshot.integrations.luluBase}</em>
                    </article>
                    <article className="ara-admin__stat">
                      <span>FRONTEND_ORIGIN</span>
                      <strong className="ara-admin__stat-origin">{snapshot.integrations.frontendOrigin.replace(/^https?:\/\//, "")}</strong>
                      <em>{snapshot.integrations.frontendOrigin}</em>
                    </article>
                    <article className="ara-admin__stat">
                      <span>webhook_events</span>
                      <strong>{snapshot.webhooks.length}</strong>
                      <em>
                        {Object.entries(snapshot.webhooksBySource)
                          .map(([src, n]) => `${src}=${n}`)
                          .join(" · ") || "none"}
                      </em>
                    </article>
                  </div>
                  <div className="ara-admin__grid-2">
                    <section className="ara-admin__panel">
                      <h3>webhooks.source</h3>
                      <Donut
                        slices={Object.entries(snapshot.webhooksBySource).map(([label, value]) => ({
                          label,
                          value,
                        }))}
                      />
                    </section>
                    <section className="ara-admin__panel">
                      <h3>shipping.country_code</h3>
                      <Bars
                        rows={snapshot.shippingByCountry.map((row) => ({
                          label: row.country,
                          value: row.orders,
                          note: `${row.orders} · ${usd(row.revenueCents)}`,
                        }))}
                      />
                    </section>
                  </div>
                  <section className="ara-admin__panel" style={{ marginTop: 10 }}>
                    <h3>revenue by sku</h3>
                    <Bars
                      rows={snapshot.revenueByProduct.map((p) => ({
                        label: `${p.company} ${p.status}`,
                        value: p.revenueCents,
                        note: `${p.unitsSold}u · ${usd(p.revenueCents)}`,
                      }))}
                    />
                  </section>
                  <section className="ara-admin__panel" style={{ marginTop: 10 }}>
                    <h3>webhook_events</h3>
                    <WebhookTable rows={snapshot.webhooks} />
                  </section>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderTable({
  rows,
  openId,
  onOpen,
}: {
  rows: AdminOrder[];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  if (!rows.length) return <Empty>orders=0</Empty>;
  return (
    <div className="ara-admin__table-wrap">
      <table className="ara-admin__table">
        <thead>
          <tr>
            <th>public_id</th>
            <th>email</th>
            <th>status</th>
            <th>job</th>
            <th>cc</th>
            <th>level</th>
            <th>pi</th>
            <th>items</th>
            <th>total_cents</th>
            <th>created_at</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr
              key={o.id}
              className={openId === o.id ? "is-open" : undefined}
              onClick={() => onOpen(openId === o.id ? null : o.id)}
            >
              <td className="num">{o.publicId}</td>
              <td>
                {o.email || "null"}
                <div className="ara-admin__file">{o.customerName || o.id}</div>
              </td>
              <td>{statusPill(o.status)}</td>
              <td>{o.fulfillment ? statusPill(o.fulfillment.status) : "null"}</td>
              <td className="num">{o.shippingAddress?.country_code || "—"}</td>
              <td className="num">{o.shippingLevel || "null"}</td>
              <td className="num">{shortId(o.stripePaymentIntentId, 12)}</td>
              <td className="num">
                {o.itemCount}
                <div className="ara-admin__file">{o.items.map((i) => i.productId).join(",") || "—"}</div>
              </td>
              <td className="num">{o.totalCents}</td>
              <td>{formatDateTime(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PressTable({
  rows,
  orders,
  openId,
  onOpen,
}: {
  rows: AdminPrintJob[];
  orders: AdminOrder[];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  if (!rows.length) return <Empty>print_jobs=0</Empty>;
  const byId = new Map(orders.map((o) => [o.id, o]));
  return (
    <div className="ara-admin__table-wrap">
      <table className="ara-admin__table">
        <thead>
          <tr>
            <th>order</th>
            <th>status</th>
            <th>lulu_status</th>
            <th>lulu_print_job_id</th>
            <th>tracking_id</th>
            <th>attempts</th>
            <th>locked_at</th>
            <th>updated_at</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((j) => {
            const order = byId.get(j.orderId);
            return (
              <tr
                key={j.id}
                className={openId === j.id ? "is-open" : undefined}
                onClick={() => onOpen(openId === j.id ? null : j.id)}
              >
                <td className="num">{order?.publicId || shortId(j.orderId, 8)}</td>
                <td>{statusPill(j.status)}</td>
                <td>{j.luluStatus || "null"}</td>
                <td className="num">{shortId(j.luluPrintJobId, 12)}</td>
                <td className="num">{j.trackingId || "null"}</td>
                <td className="num">
                  {j.attempts}/{j.maxAttempts}
                </td>
                <td>{formatDateTime(j.lockedAt)}</td>
                <td>{formatDateTime(j.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WebhookTable({ rows }: { rows: AdminSnapshot["webhooks"] }) {
  if (!rows.length) return <Empty>webhook_events=0</Empty>;
  return (
    <div className="ara-admin__table-wrap">
      <table className="ara-admin__table">
        <thead>
          <tr>
            <th>source</th>
            <th>event_id</th>
            <th>processed_at</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id} style={{ cursor: "default" }}>
              <td>{statusPill(h.source)}</td>
              <td className="num">{h.id}</td>
              <td>{formatDateTime(h.processedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobDetail({ job, order }: { job: AdminPrintJob; order?: AdminOrder }) {
  const payload = job.payload;
  return (
    <div className="ara-admin__detail">
      <h3>
        {order?.publicId || "print_job"} <span className="ara-admin__file">{job.id}</span>
      </h3>
      <div className="ara-admin__dl">
        <Field label="status" value={statusPill(job.status)} />
        <Field label="lulu_status" value={job.luluStatus} />
        <Field label="lulu_print_job_id" value={<span className="ara-admin__mono">{job.luluPrintJobId}</span>} />
        <Field label="carrier" value={job.carrier} />
        <Field label="tracking_id" value={job.trackingId} />
        <Field label="run_after" value={formatDateTime(job.runAfter)} />
        <Field label="locked_at" value={formatDateTime(job.lockedAt)} />
        <Field label="created_at" value={formatDateTime(job.createdAt)} />
        <Field label="updated_at" value={formatDateTime(job.updatedAt)} />
        <Field label="attempts" value={`${job.attempts} / ${job.maxAttempts}`} />
        <Field label="order_id" value={<span className="ara-admin__mono">{job.orderId}</span>} />
      </div>
      {job.lastError ? <p className="ara-admin__error">{job.lastError}</p> : null}
      {job.trackingUrl ? (
        <a className="ara-admin__btn ara-admin__btn--ghost" href={job.trackingUrl} target="_blank" rel="noreferrer">
          tracking_url
        </a>
      ) : null}
      {payload ? (
        <pre className="ara-admin__json">{JSON.stringify(payload, null, 2)}</pre>
      ) : null}
    </div>
  );
}
