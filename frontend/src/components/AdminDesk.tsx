"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { digestCover } from "@/data/products";
import { money } from "@/lib/format";
import {
  fetchAdminMembers,
  fetchAdminSnapshot,
  patchAdminProduct,
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

const DESKS: Array<{ id: DeskId; num: string; title: string; subtitle: string }> = [
  { id: "overview", num: "01", title: "The Desk", subtitle: "Pulse of the press" },
  { id: "orders", num: "02", title: "Orders", subtitle: "On the spike" },
  { id: "customers", num: "03", title: "Customers", subtitle: "The roll" },
  { id: "catalog", num: "04", title: "Catalog", subtitle: "The bound edition" },
  { id: "press", num: "05", title: "The Press", subtitle: "Print and post" },
  { id: "inbox", num: "06", title: "Inbox", subtitle: "Reader desk" },
  { id: "circulation", num: "07", title: "Circulation", subtitle: "The mailing" },
  { id: "content", num: "08", title: "Content", subtitle: "Long and short form" },
  { id: "members", num: "09", title: "The Ledger", subtitle: "Press passes" },
  { id: "ops", num: "10", title: "Operations", subtitle: "Wires and webhooks" },
];

function usd(cents: number) {
  return money(cents / 100);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function prettyStatus(value: string) {
  return value.replace(/_/g, " ");
}

function statusPill(status: string) {
  const warn = ["failed", "canceled", "refunded", "pending_payment"].includes(status);
  const gold = ["paid", "submitted", "AVAILABLE", "shipped", "delivered"].includes(status);
  const ink = status === "COMING_SOON";
  const cls = warn
    ? "ara-admin__pill ara-admin__pill--warn"
    : gold
      ? "ara-admin__pill ara-admin__pill--gold"
      : ink
        ? "ara-admin__pill ara-admin__pill--ink"
        : "ara-admin__pill";
  return <span className={cls}>{prettyStatus(status)}</span>;
}

function addressLines(addr: ShippingAddress | null | undefined) {
  if (!addr) return "No plate on file.";
  return [addr.name, addr.street1, addr.street2, `${addr.city}, ${addr.state_code} ${addr.postcode}`, addr.country_code]
    .filter(Boolean)
    .join("\n");
}

function MintCoin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="mm-admin-gold" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#f6e2a4" />
          <stop offset="42%" stopColor="#e0a526" />
          <stop offset="100%" stopColor="#9a6d12" />
        </radialGradient>
        <radialGradient id="mm-admin-face" cx="50%" cy="46%" r="58%">
          <stop offset="0%" stopColor="#fff6d4" />
          <stop offset="55%" stopColor="#f0c75a" />
          <stop offset="100%" stopColor="#c4891a" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#mm-admin-gold)" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#7a5610" strokeWidth="1.4" opacity="0.55" />
      {Array.from({ length: 72 }).map((_, i) => {
        const a = (i / 72) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={100 + Math.cos(a) * 90}
            y1={100 + Math.sin(a) * 90}
            x2={100 + Math.cos(a) * 96}
            y2={100 + Math.sin(a) * 96}
            stroke="#7a5610"
            strokeWidth="1.15"
          />
        );
      })}
      <circle cx="100" cy="100" r="78" fill="url(#mm-admin-face)" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#161b2e" strokeWidth="2.4" opacity="0.88" />
      <text x="100" y="118" textAnchor="middle" fill="#161b2e" fontFamily="Georgia, serif" fontSize="52" fontWeight="700">
        MM
      </text>
    </svg>
  );
}

function Colonnade({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 180" fill="none" aria-hidden="true">
      <path d="M28 62 L160 18 L292 62" stroke="currentColor" strokeWidth="1.6" />
      <path d="M40 62 H280" stroke="currentColor" strokeWidth="1.6" />
      <path d="M36 70 H284" stroke="currentColor" strokeWidth="1.2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 52 + i * 30;
        return <rect key={i} x={x} y="70" width="10" height="78" stroke="currentColor" strokeWidth="1.3" />;
      })}
      <path d="M24 148 H296" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 158 H304" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Stat({
  kicker,
  value,
  note,
}: {
  kicker: string;
  value: string;
  note?: string;
}) {
  return (
    <article className="ara-admin__stat">
      <span>{kicker}</span>
      <strong>{value}</strong>
      {note ? <em>{note}</em> : null}
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
      <strong>{value || "—"}</strong>
    </div>
  );
}

function OrderDetail({ order }: { order: AdminOrder }) {
  const addr = order.shippingAddress;
  return (
    <div className="ara-admin__detail">
      <h3>{order.publicId}</h3>
      <div className="ara-admin__dl">
        <Field label="Status" value={statusPill(order.status)} />
        <Field label="Total" value={usd(order.totalCents)} />
        <Field label="Name" value={order.customerName} />
        <Field label="Email" value={order.email} />
        <Field label="Phone" value={order.phone} />
        <Field label="Opened" value={formatDateTime(order.createdAt)} />
        <Field label="Subtotal" value={usd(order.subtotalCents)} />
        <Field label="Shipping" value={`${usd(order.shippingCents)} · ${order.shippingLevel || "unset"}`} />
        <Field label="Stripe session" value={order.stripeCheckoutSessionId} />
        <Field label="Payment intent" value={order.stripePaymentIntentId} />
        <div>
          <span>Ship to</span>
          <p style={{ whiteSpace: "pre-wrap" }}>{addressLines(addr)}</p>
        </div>
        <div>
          <span>Press</span>
          <p>
            {order.fulfillment
              ? `${prettyStatus(order.fulfillment.status)}${order.fulfillment.luluStatus ? ` · ${order.fulfillment.luluStatus}` : ""}`
              : "Not on the press yet."}
          </p>
        </div>
      </div>
      <div className="ara-admin__table-wrap">
        <table className="ara-admin__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ cursor: "default" }}>
                <td>
                  {item.title}
                  <div className="ara-admin__file">{item.productId}</div>
                </td>
                <td className="num">{item.quantity}</td>
                <td className="num">{usd(item.unitPriceCents)}</td>
                <td className="num">{usd(item.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {order.fulfillment?.trackingUrl ? (
        <a className="ara-admin__btn ara-admin__btn--ghost" href={order.fulfillment.trackingUrl} target="_blank" rel="noreferrer">
          Track {order.fulfillment.carrier || "shipment"} →
        </a>
      ) : null}
      {order.fulfillment?.lastError ? (
        <p className="ara-admin__error">{order.fulfillment.lastError}</p>
      ) : null}
    </div>
  );
}

function CustomerDetail({ customer, inbox }: { customer: AdminCustomer; inbox: AdminInbox[] }) {
  const notes = inbox.filter((m) => m.email.toLowerCase() === (customer.email || "").toLowerCase());
  return (
    <div className="ara-admin__detail">
      <h3>{customer.name || customer.email || "Unaddressed reader"}</h3>
      <div className="ara-admin__dl">
        <Field label="Email" value={customer.email} />
        <Field label="Phone" value={customer.phone} />
        <Field label="Lifetime" value={usd(customer.lifetimeCents)} />
        <Field label="Orders" value={`${customer.orderCount} · ${customer.paidOrderCount} paid`} />
        <Field label="First seen" value={formatDate(customer.firstOrderAt)} />
        <Field label="Last activity" value={formatDate(customer.lastOrderAt)} />
        <Field label="Circulation" value={customer.subscribed ? "On the mailing" : "Not subscribed"} />
        <Field label="Inbox" value={`${customer.inboxCount} note${customer.inboxCount === 1 ? "" : "s"}`} />
        <Field label="Cities" value={customer.cities.join(" · ") || "—"} />
        <Field label="Titles" value={customer.products.join(" · ") || "—"} />
      </div>
      {customer.addresses.length ? (
        <div className="ara-admin__dl">
          {customer.addresses.map((addr, i) => (
            <div key={`${addr.street1}-${i}`}>
              <span>Plate {String(i + 1).padStart(2, "0")}</span>
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
                <th>Order</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((row) => (
                <tr key={row.publicId} style={{ cursor: "default" }}>
                  <td className="num">{row.publicId}</td>
                  <td>{statusPill(row.status)}</td>
                  <td className="num">{usd(row.totalCents)}</td>
                  <td>{formatDate(row.createdAt)}</td>
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

function ComingSoon({ tab }: { tab: ContentTab }) {
  const long = tab === "long";
  return (
    <div className="ara-admin__coming">
      <div className="ara-admin__nav-art" aria-hidden="true" style={{ width: "100%", maxWidth: 360, border: 0, minHeight: 140 }}>
        <Colonnade className="ara-admin__colonnade" />
        <MintCoin className="ara-admin__desk-coin" />
      </div>
      <span className="ara-admin__coming-stamp">Coming soon</span>
      <p className="ara-admin__coming-kicker">{long ? "Long form" : "Short form"} · Vol. I</p>
      <h3>{long ? "The essay is still on the spike." : "Short takes are being typeset."}</h3>
      <p>
        {long
          ? "Company modules, curriculum essays, and the bound digest copy will land here — drafted, edited, and marked for the press."
          : "Newsroom briefs, tickers, and one-line takes will live on this plate. The short form desk is not open yet."}
      </p>
    </div>
  );
}

export function AdminDesk() {
  const search = useSearchParams();
  const initial = (search.get("desk") as DeskId) || "overview";
  const [desk, setDesk] = useState<DeskId>(DESKS.some((d) => d.id === initial) ? initial : "overview");
  const [contentTab, setContentTab] = useState<ContentTab>("long");
  const [dateLabel, setDateLabel] = useState("");
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

  const style = useMemo(
    () =>
      ({
        ["--ara-admin-bg" as string]: "#e9f6f0",
        ["--ara-admin-paper" as string]: "#fffdf6",
        ["--ara-admin-ink" as string]: "#161b2e",
        ["--ara-admin-muted" as string]: "#646575",
        ["--ara-admin-mint" as string]: "#1fa88f",
        ["--ara-admin-deep" as string]: "#176d5c",
        ["--ara-admin-gold" as string]: "#e0a526",
        ["--ara-admin-rule" as string]: "#c9bea8",
        ["--ara-admin-max" as string]: "1640px",
      }) as CSSProperties,
    [],
  );

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [snap, ledger] = await Promise.all([fetchAdminSnapshot(), fetchAdminMembers()]);
      setSnapshot(snap);
      setMembers(ledger.members);
      setSessions(ledger.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The desk could not open.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const current = DESKS.find((d) => d.id === desk) ?? DESKS[0];
  const q = query.trim().toLowerCase();

  const filteredOrders = useMemo(() => {
    const rows = snapshot?.orders ?? [];
    return rows.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return `${o.publicId} ${o.email} ${o.customerName} ${o.status} ${o.items.map((i) => i.title).join(" ")}`
        .toLowerCase()
        .includes(q);
    });
  }, [snapshot, q, statusFilter]);

  const filteredCustomers = useMemo(() => {
    const rows = snapshot?.customers ?? [];
    return rows.filter((c) => {
      if (!q) return true;
      return `${c.name} ${c.email} ${c.phone} ${c.cities.join(" ")} ${c.products.join(" ")}`.toLowerCase().includes(q);
    });
  }, [snapshot, q]);

  const selectedOrder = snapshot?.orders.find((o) => o.id === openOrder) ?? null;
  const selectedCustomer = snapshot?.customers.find((c) => c.key === openCustomer) ?? null;
  const selectedInbox = snapshot?.inbox.find((m) => m.id === openInbox) ?? null;
  const selectedJob = snapshot?.press.find((j) => j.id === openJob) ?? null;
  const maxDay = Math.max(1, ...(snapshot?.revenueByDay.map((d) => d.revenueCents) ?? [1]));

  async function toggleProduct(product: AdminProduct) {
    setSaving(true);
    setError("");
    try {
      await patchAdminProduct(product.id, {
        status: product.status === "AVAILABLE" ? "COMING_SOON" : "AVAILABLE",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Catalog update failed.");
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

  return (
    <section className="ara-admin" style={style}>
      <div className="ara-admin__inner">
        <header className="ara-admin__folio">
          <span>Vol. I · Desk copy</span>
          <strong>The Press Desk</strong>
          <span>{dateLabel || "\u00a0"}</span>
        </header>

        <div className="ara-admin__intro">
          <div>
            <p className="ara-admin__eyebrow">Internal working paper</p>
            <h1>
              Keep the{" "}
              <mark>
                <span className="mm-hl">edition</span>
              </mark>{" "}
              honest.
            </h1>
          </div>
          <div>
            <p className="ara-admin__lede">
              Orders, the roll, the bound catalog, and the press — live from the backend. No lock on the door yet.
              Treat it like the spike: everything in, nothing lost.
            </p>
            <div className="ara-admin__intro-actions" style={{ marginTop: 16 }}>
              <button type="button" className="ara-admin__btn" onClick={() => void load()} disabled={busy}>
                {busy ? "Opening…" : "Refresh the desk"}
              </button>
              <Link className="ara-admin__btn ara-admin__btn--ghost" href="/shop">
                View the shop
              </Link>
            </div>
          </div>
        </div>

        <div className="ara-admin__shell">
          <aside className="ara-admin__nav">
            <div className="ara-admin__nav-art" aria-hidden="true">
              <Colonnade className="ara-admin__colonnade" />
              <MintCoin className="ara-admin__desk-coin" />
            </div>
            <div className="ara-admin__nav-head">
              <span className="ara-admin__nav-kicker">Desks</span>
              <strong>{busy ? "Pulling copy" : snapshot ? "Live wire" : "Offline"}</strong>
            </div>
            <nav className="ara-admin__nav-list" aria-label="Admin desks">
              {DESKS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={desk === item.id ? "is-active" : undefined}
                  onClick={() => goto(item.id)}
                >
                  <span>{item.num}</span>
                  <span>
                    <h2>{item.title}</h2>
                    <small>{item.subtitle}</small>
                  </span>
                </button>
              ))}
            </nav>
            <p className="ara-admin__nav-note">
              Big ideas for small readers. The desk is the paper before it is the shop.
            </p>
          </aside>

          <div className="ara-admin__stage">
            <div className="ara-admin__stage-head">
              {desk === "content" ? (
                <div className="ara-admin__tabs" role="tablist" aria-label="Content form">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={contentTab === "long"}
                    className={contentTab === "long" ? "is-active" : undefined}
                    onClick={() => setContentTab("long")}
                  >
                    Long form
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={contentTab === "short"}
                    className={contentTab === "short" ? "is-active" : undefined}
                    onClick={() => setContentTab("short")}
                  >
                    Short form
                  </button>
                </div>
              ) : null}
              <span className="ara-admin__stage-kicker">
                {current.num} · {current.subtitle}
              </span>
              <h2>{current.title}</h2>
              <p>
                {desk === "content"
                  ? contentTab === "long"
                    ? "Essays, modules, and the long read — still being made."
                    : "Briefs and takes — still being made."
                  : snapshot
                    ? `Last pulled ${formatDateTime(snapshot.generatedAt)}.`
                    : "Waiting on the wire."}
              </p>
            </div>

            <div className="ara-admin__stage-body">
              {error ? (
                <div className="ara-admin__error" role="alert">
                  {error}
                </div>
              ) : null}
              {busy && !snapshot ? <p className="ara-admin__loading">Opening the desk from the press…</p> : null}

              {desk === "overview" && snapshot ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="Revenue" value={usd(snapshot.kpis.revenueCents)} note={`${snapshot.kpis.paidOrders} paid orders`} />
                    <Stat kicker="On the spike" value={String(snapshot.kpis.openOrders)} note={`${snapshot.kpis.orders} all-time`} />
                    <Stat kicker="Average order" value={usd(snapshot.kpis.aovCents)} note={`${snapshot.kpis.unitsSold} units struck`} />
                    <Stat
                      kicker="Last day"
                      value={usd(snapshot.kpis.last24hRevenueCents)}
                      note={`${snapshot.kpis.last24hOrders} orders in 24h`}
                    />
                    <Stat kicker="The roll" value={String(snapshot.kpis.customers)} note={`${snapshot.kpis.subscribers} on the mailing`} />
                    <Stat kicker="Inbox" value={String(snapshot.kpis.inbox)} note="Reader desk notes" />
                    <Stat
                      kicker="Catalog"
                      value={`${snapshot.kpis.available}/${snapshot.kpis.catalog}`}
                      note={`${snapshot.kpis.comingSoon} still coming`}
                    />
                    <Stat
                      kicker="The press"
                      value={String(snapshot.kpis.pressQueued)}
                      note={`${snapshot.kpis.pressFailed} failed · ${snapshot.kpis.shipped} shipped`}
                    />
                  </div>
                  <div className="ara-admin__grid-2">
                    <section className="ara-admin__panel">
                      <h3>Fourteen-day take</h3>
                      <div className="ara-admin__bars">
                        {snapshot.revenueByDay.map((day) => (
                          <div className="ara-admin__bar" key={day.day}>
                            <span>{day.day.slice(5)}</span>
                            <i style={{ width: `${Math.max(4, (day.revenueCents / maxDay) * 100)}%` }} />
                            <span className="num">{usd(day.revenueCents)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="ara-admin__panel">
                      <h3>Order ledger</h3>
                      <div className="ara-admin__bars">
                        {Object.entries(snapshot.ordersByStatus).map(([status, count]) => (
                          <div className="ara-admin__bar" key={status}>
                            <span>{prettyStatus(status)}</span>
                            <i
                              style={{
                                width: `${Math.max(8, (count / Math.max(1, snapshot.kpis.orders)) * 100)}%`,
                              }}
                            />
                            <span className="num">{count}</span>
                          </div>
                        ))}
                        {!Object.keys(snapshot.ordersByStatus).length ? (
                          <Empty>The spike is empty. No orders have been struck.</Empty>
                        ) : null}
                      </div>
                    </section>
                  </div>
                  <section className="ara-admin__panel" style={{ marginTop: 14 }}>
                    <h3>Latest on the spike</h3>
                    <OrderTable
                      rows={snapshot.orders.slice(0, 8)}
                      openId={openOrder}
                      onOpen={(id) => {
                        setOpenOrder(id);
                        goto("orders");
                      }}
                    />
                  </section>
                </>
              ) : null}

              {desk === "orders" && snapshot ? (
                <>
                  <div className="ara-admin__toolbar">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search public id, name, email, title…"
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All statuses</option>
                      {Object.keys(snapshot.ordersByStatus).map((status) => (
                        <option key={status} value={status}>
                          {prettyStatus(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <OrderTable rows={filteredOrders} openId={openOrder} onOpen={setOpenOrder} />
                  {selectedOrder ? <OrderDetail order={selectedOrder} /> : null}
                </>
              ) : null}

              {desk === "customers" && snapshot ? (
                <>
                  <div className="ara-admin__toolbar">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search the roll — name, email, city, title…"
                    />
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>Reader</th>
                          <th>Contact</th>
                          <th>Orders</th>
                          <th>Lifetime</th>
                          <th>Mail</th>
                          <th>Last seen</th>
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
                              <strong>{c.name || "Unnamed plate"}</strong>
                              <div className="ara-admin__file">{c.guest ? "Guest ticket" : c.cities[0] || "On the roll"}</div>
                            </td>
                            <td>
                              {c.email || "—"}
                              <div className="ara-admin__file">{c.phone || "no phone"}</div>
                            </td>
                            <td className="num">{c.orderCount}</td>
                            <td className="num">{usd(c.lifetimeCents)}</td>
                            <td>{c.subscribed ? statusPill("subscribed") : "—"}</td>
                            <td>{formatDate(c.lastOrderAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!filteredCustomers.length ? (
                      <Empty>No readers on the roll yet. The first order writes the first name.</Empty>
                    ) : null}
                  </div>
                  {selectedCustomer ? <CustomerDetail customer={selectedCustomer} inbox={snapshot.inbox} /> : null}
                </>
              ) : null}

              {desk === "catalog" && snapshot ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="Bound titles" value={String(snapshot.kpis.catalog)} />
                    <Stat kicker="On sale" value={String(snapshot.kpis.available)} />
                    <Stat kicker="Coming soon" value={String(snapshot.kpis.comingSoon)} />
                    <Stat
                      kicker="Sample PDFs"
                      value={String(snapshot.catalogHealth.samplePdfs)}
                      note="Swap before real print runs"
                    />
                  </div>
                  <div className="ara-admin__catalog">
                    {snapshot.products.map((p) => {
                      const paint = digestCover(p.color);
                      return (
                        <article className="ara-admin__card" key={p.id}>
                          <div className="ara-admin__cover" style={{ background: paint.background, color: paint.color }}>
                            {(p.company || "M").slice(0, 1)}
                          </div>
                          <div>
                            <span className="ara-admin__file">
                              {p.volume} · {p.ticker || "no ticker"}
                            </span>
                            <h3>{p.title}</h3>
                            <p>{p.summary}</p>
                            <div className="ara-admin__card-meta">
                              {statusPill(p.status)}
                              <span className="num">{usd(p.priceCents)}</span>
                              <span className="ara-admin__file">
                                {p.unitsSold} sold · {p.pageCount} pp
                              </span>
                              {p.samplePdf ? <span className="ara-admin__pill ara-admin__pill--warn">sample pdf</span> : null}
                              <button
                                type="button"
                                className="ara-admin__text-btn"
                                disabled={saving}
                                onClick={() => void toggleProduct(p)}
                              >
                                {p.status === "AVAILABLE" ? "Hold for press" : "Release to shop"}
                              </button>
                            </div>
                            <p className="ara-admin__file" style={{ marginTop: 8 }}>
                              {p.headquarters} · {p.podPackageId} · {p.sector}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {desk === "press" && snapshot ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="Queued" value={String(snapshot.kpis.pressQueued)} />
                    <Stat kicker="Submitted" value={String(snapshot.kpis.pressSubmitted)} />
                    <Stat kicker="Failed" value={String(snapshot.kpis.pressFailed)} />
                    <Stat kicker="Shipped orders" value={String(snapshot.kpis.shipped)} />
                  </div>
                  <PressTable rows={snapshot.press} orders={snapshot.orders} openId={openJob} onOpen={setOpenJob} />
                  {selectedJob ? <JobDetail job={selectedJob} order={snapshot.orders.find((o) => o.id === selectedJob.orderId)} /> : null}
                </>
              ) : null}

              {desk === "inbox" && snapshot ? (
                <>
                  <div className="ara-admin__toolbar">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search notes — name, email, topic…"
                    />
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>Topic</th>
                          <th>Note</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {snapshot.inbox
                          .filter((m) =>
                            q
                              ? `${m.name} ${m.email} ${m.topic} ${m.message}`.toLowerCase().includes(q)
                              : true,
                          )
                          .map((m) => (
                            <tr
                              key={m.id}
                              className={openInbox === m.id ? "is-open" : undefined}
                              onClick={() => setOpenInbox(m.id === openInbox ? null : m.id)}
                            >
                              <td>
                                <strong>{m.name}</strong>
                                <div className="ara-admin__file">{m.email}</div>
                              </td>
                              <td>{m.topic}</td>
                              <td>{m.message.slice(0, 90)}{m.message.length > 90 ? "…" : ""}</td>
                              <td>{formatDateTime(m.createdAt)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!snapshot.inbox.length ? <Empty>The reader desk is quiet. No notes on the spike.</Empty> : null}
                  </div>
                  {selectedInbox ? (
                    <div className="ara-admin__detail">
                      <h3>{selectedInbox.topic}</h3>
                      <div className="ara-admin__dl">
                        <Field label="From" value={selectedInbox.name} />
                        <Field label="Email" value={selectedInbox.email} />
                        <Field label="Phone" value={selectedInbox.phone} />
                        <Field label="Received" value={formatDateTime(selectedInbox.createdAt)} />
                      </div>
                      <p className="ara-admin__message">{selectedInbox.message}</p>
                    </div>
                  ) : null}
                </>
              ) : null}

              {desk === "circulation" && snapshot ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="On the list" value={String(snapshot.subscribers.length)} />
                    <Stat
                      kicker="Also customers"
                      value={String(snapshot.customers.filter((c) => c.subscribed && c.orderCount > 0).length)}
                    />
                    <Stat kicker="Inbox writers" value={String(snapshot.customers.filter((c) => c.inboxCount > 0).length)} />
                    <Stat kicker="Guests" value={String(snapshot.customers.filter((c) => c.guest).length)} />
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Joined</th>
                          <th>On the roll</th>
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
                              <td>
                                {customer?.orderCount
                                  ? `${customer.orderCount} order${customer.orderCount === 1 ? "" : "s"} · ${usd(customer.lifetimeCents)}`
                                  : "Mailing only"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!snapshot.subscribers.length ? (
                      <Empty>The mailing is empty. The first address writes the circulation book.</Empty>
                    ) : null}
                  </div>
                </>
              ) : null}

              {desk === "content" ? <ComingSoon tab={contentTab} /> : null}

              {desk === "members" ? (
                <>
                  <div className="ara-admin__stats">
                    <Stat kicker="Press passes" value={String(members.length)} />
                    <Stat kicker="Open sessions" value={String(sessions)} />
                    <Stat kicker="Customers on file" value={String(snapshot?.kpis.membersEstimate ?? 0)} />
                    <Stat kicker="Subscribers" value={String(snapshot?.kpis.subscribers ?? 0)} />
                  </div>
                  <div className="ara-admin__table-wrap">
                    <table className="ara-admin__table">
                      <thead>
                        <tr>
                          <th>Plate</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Issued</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.id} style={{ cursor: "default" }}>
                            <td className="num">{m.memberNo}</td>
                            <td>{m.name}</td>
                            <td>{m.email}</td>
                            <td>{formatDate(m.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!members.length ? (
                      <Empty>No press passes issued. The ledger still has empty plates.</Empty>
                    ) : null}
                  </div>
                </>
              ) : null}

              {desk === "ops" && snapshot ? (
                <>
                  <div className="ara-admin__ops-grid">
                    <article className="ara-admin__stat">
                      <span>Stripe</span>
                      <strong>{snapshot.integrations.stripe ? "Wired" : "Dark"}</strong>
                      <em>Checkout sessions land on the spike.</em>
                    </article>
                    <article className="ara-admin__stat">
                      <span>Lulu</span>
                      <strong>{snapshot.integrations.lulu ? "Wired" : "Dark"}</strong>
                      <em>{snapshot.integrations.luluBase}</em>
                    </article>
                    <article className="ara-admin__stat">
                      <span>Storefront</span>
                      <strong>Origin</strong>
                      <em>{snapshot.integrations.frontendOrigin}</em>
                    </article>
                    <article className="ara-admin__stat">
                      <span>Webhooks</span>
                      <strong>{snapshot.webhooks.length}</strong>
                      <em>
                        {Object.entries(snapshot.webhooksBySource)
                          .map(([src, n]) => `${src} ${n}`)
                          .join(" · ") || "None processed"}
                      </em>
                    </article>
                  </div>
                  <div className="ara-admin__grid-2">
                    <section className="ara-admin__panel">
                      <h3>Shipping map</h3>
                      {snapshot.shippingByCountry.length ? (
                        <div className="ara-admin__bars">
                          {snapshot.shippingByCountry.map((row) => (
                            <div className="ara-admin__bar" key={row.country}>
                              <span>{row.country}</span>
                              <i
                                style={{
                                  width: `${Math.max(8, (row.orders / Math.max(1, snapshot.kpis.paidOrders)) * 100)}%`,
                                }}
                              />
                              <span className="num">
                                {row.orders} · {usd(row.revenueCents)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty>No paid shipments have a country plate yet.</Empty>
                      )}
                    </section>
                    <section className="ara-admin__panel">
                      <h3>Title take</h3>
                      <div className="ara-admin__bars">
                        {snapshot.revenueByProduct.map((p) => (
                          <div className="ara-admin__bar" key={p.id}>
                            <span>{p.company}</span>
                            <i
                              style={{
                                width: `${Math.max(4, (p.revenueCents / Math.max(1, snapshot.kpis.revenueCents || 1)) * 100)}%`,
                              }}
                            />
                            <span className="num">
                              {p.unitsSold} · {usd(p.revenueCents)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  <section className="ara-admin__panel" style={{ marginTop: 14 }}>
                    <h3>Webhook tape</h3>
                    <div className="ara-admin__table-wrap">
                      <table className="ara-admin__table">
                        <thead>
                          <tr>
                            <th>Source</th>
                            <th>Event</th>
                            <th>Processed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {snapshot.webhooks.map((h) => (
                            <tr key={h.id} style={{ cursor: "default" }}>
                              <td>{statusPill(h.source)}</td>
                              <td className="num">{h.id}</td>
                              <td>{formatDateTime(h.processedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!snapshot.webhooks.length ? <Empty>No webhook events have been idempotently filed.</Empty> : null}
                    </div>
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
  if (!rows.length) return <Empty>No orders match this plate.</Empty>;
  return (
    <div className="ara-admin__table-wrap">
      <table className="ara-admin__table">
        <thead>
          <tr>
            <th>Public id</th>
            <th>Reader</th>
            <th>Status</th>
            <th>Items</th>
            <th>Total</th>
            <th>Opened</th>
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
                {o.customerName || o.email || "Guest"}
                <div className="ara-admin__file">{o.email || "no email"}</div>
              </td>
              <td>{statusPill(o.status)}</td>
              <td>
                {o.itemCount}
                <div className="ara-admin__file">{o.items.map((i) => i.title).join(", ") || "—"}</div>
              </td>
              <td className="num">{usd(o.totalCents)}</td>
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
  if (!rows.length) return <Empty>The press is idle. Paid orders will queue a print job.</Empty>;
  const byId = new Map(orders.map((o) => [o.id, o]));
  return (
    <div className="ara-admin__table-wrap">
      <table className="ara-admin__table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Queue</th>
            <th>Lulu</th>
            <th>Tracking</th>
            <th>Attempts</th>
            <th>Updated</th>
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
                <td className="num">{order?.publicId || j.orderId.slice(0, 8)}</td>
                <td>{statusPill(j.status)}</td>
                <td>{j.luluStatus || j.luluPrintJobId || "—"}</td>
                <td>{j.trackingId || "—"}</td>
                <td className="num">
                  {j.attempts}/{j.maxAttempts}
                </td>
                <td>{formatDateTime(j.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function JobDetail({ job, order }: { job: AdminPrintJob; order?: AdminOrder }) {
  const payload = job.payload as { line_items?: Array<{ title: string; quantity: number }>; shipping_level?: string } | null;
  return (
    <div className="ara-admin__detail">
      <h3>{order?.publicId || "Print job"}</h3>
      <div className="ara-admin__dl">
        <Field label="Queue" value={statusPill(job.status)} />
        <Field label="Lulu status" value={job.luluStatus} />
        <Field label="Lulu id" value={job.luluPrintJobId} />
        <Field label="Carrier" value={job.carrier} />
        <Field label="Tracking" value={job.trackingId} />
        <Field label="Run after" value={formatDateTime(job.runAfter)} />
        <Field label="Locked" value={formatDateTime(job.lockedAt)} />
        <Field label="Attempts" value={`${job.attempts} / ${job.maxAttempts}`} />
      </div>
      {job.lastError ? <p className="ara-admin__error">{job.lastError}</p> : null}
      {job.trackingUrl ? (
        <a className="ara-admin__btn ara-admin__btn--ghost" href={job.trackingUrl} target="_blank" rel="noreferrer">
          Open tracking →
        </a>
      ) : null}
      {payload?.line_items?.length ? (
        <p className="ara-admin__lede">
          {payload.shipping_level ? `${payload.shipping_level} · ` : ""}
          {payload.line_items.map((i) => `${i.title} × ${i.quantity}`).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
