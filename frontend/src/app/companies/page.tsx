"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import statesTopoRaw from "us-atlas/states-10m.json";
import { catalogContent } from "@/data/catalog";
import { appHref } from "@/lib/assets";
import { FeedAd } from "@/components/FeedAd";
import { useCart } from "@/lib/cart";
import { SECTOR_TONE } from "@/lib/sectors";
import { companies as companyRecords, FEED_TRIMS, type CompanyFeedItem, type CompanyRecord } from "@/data/companies";
import { DigestCover } from "@/components/DigestCover";
import { MemberAuth } from "@/components/MemberAuth";
import { useAuth } from "@/lib/auth";
import { useWantList } from "@/lib/wantlist";

/* eslint-disable @typescript-eslint/no-explicit-any */
const usStatesTopo = statesTopoRaw as any;

type Company = {
  id: string;
  company_name: string;
  ticker?: string;
  sector?: string;
  sector_label?: string;
  headquarters?: string;
  business_model?: string;
  keywords?: string;
  accent_color?: string;
  direction?: string;
  change?: string;
  period?: string;
  status?: string;
  module_link?: string;
  sparkline_style?: string;
  popup_tagline?: string;
  popup_chapter?: string;
  popup_level?: number;
};

const FILTERS: Array<{ id: string; labelKey: string; fallback: string }> = [
  { id: "all", labelKey: "all_filter_label", fallback: "ALL" },
  { id: "classics", labelKey: "classics_label", fallback: "CLASSICS" },
  { id: "technology", labelKey: "technology_label", fallback: "TECHNOLOGY" },
  { id: "consumer", labelKey: "consumer_label", fallback: "CONSUMER" },
  { id: "industrials", labelKey: "industrials_label", fallback: "INDUSTRIALS" },
  { id: "food-beverage", labelKey: "food_beverage_label", fallback: "FOOD & BEVERAGE" },
  { id: "financials", labelKey: "financials_label", fallback: "FINANCIALS" },
  { id: "healthcare", labelKey: "healthcare_label", fallback: "HEALTHCARE" },
  { id: "energy", labelKey: "energy_label", fallback: "ENERGY" },
  { id: "retail", labelKey: "retail_label", fallback: "RETAIL" },
  { id: "other", labelKey: "other_label", fallback: "OTHER" },
];


const SPARK: Record<string, string> = {
  "steady-up": "M2 46 C24 43 43 39 61 35 C82 30 101 31 121 25 C143 19 164 21 184 15 C205 10 222 11 238 7",
  "wave-up": "M2 42 C21 28 37 30 53 38 C69 46 82 25 99 28 C116 31 130 39 147 30 C165 21 181 25 198 19 C214 13 228 18 238 9",
  "volatile-up": "M2 48 C14 19 26 34 38 15 C51 35 63 24 76 42 C90 19 104 27 118 13 C132 33 147 18 161 25 C178 9 194 22 211 8 C224 19 232 13 238 5",
  "steady-down": "M2 10 C24 14 43 17 62 21 C82 26 102 24 122 31 C143 35 162 34 182 40 C203 44 222 46 238 50",
  "wave-down": "M2 12 C20 20 36 11 53 19 C70 28 84 18 101 27 C119 36 134 24 152 34 C171 43 185 31 203 40 C220 48 230 40 238 50",
  "volatile-down": "M2 7 C15 29 27 15 40 36 C53 20 66 44 79 27 C93 47 108 32 123 51 C139 34 154 50 170 39 C186 54 203 42 219 52 C230 44 235 48 238 54",
  flat: "M2 31 C22 28 39 34 58 30 C78 27 97 34 116 29 C137 26 157 33 177 28 C198 25 218 31 238 26",
};
const DEFAULT_PATH =
  "M2 43 C20 39 31 42 46 36 C62 30 75 38 91 31 C107 25 121 29 137 23 C154 17 170 24 187 18 C205 12 222 17 238 10";


/**
 * Feed advertising rule: at most one ad per AD_EVERY content pieces, and never
 * before AD_MIN_LEAD pieces have run. A short feed therefore carries one ad or
 * none — the ad unit is full width and tall, so a tighter ratio reads as an ad
 * break rather than a feed.
 */
const AD_EVERY = 8;
const AD_MIN_LEAD = 5;
const adSlots = (count: number): Set<number> => {
  const slots = new Set<number>();
  for (let i = AD_MIN_LEAD; i < count; i += AD_EVERY) slots.add(i);
  return slots;
};

// a real US map (d3-geo + us-atlas — the site's own map data) with the HQ pinned

/** Six ranges, each showing the return on its own — no chart. */
function PriceTracker({ returns }: { returns: CompanyRecord["returns"] }) {
  return (
    <div className="ara-cc-quick__tracker">
      <span className="ara-cc-quick__tracker-lbl">Share price return</span>
      <div className="ara-cc-quick__tracker-grid">
        {returns.map((d) => (
          <div className="ara-cc-quick__tracker-cell" key={d.range}>
            <span className="ara-cc-quick__tracker-range">{d.range}</span>
            <strong style={{ color: d.up ? "#176d5c" : "#a6432a" }}>{d.chg}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function HqMiniMap({ lon, lat, label }: { lon: number; lat: number; label: string }) {
  const W = 320;
  const H = 176;
  const geo = useMemo(() => {
    const states = feature(usStatesTopo, usStatesTopo.objects.states) as any;
    const proj = geoAlbersUsa().fitExtent([[10, 10], [W - 10, H - 10]], states);
    const path = geoPath(proj);
    const statesPath = path(states) || "";
    const borders = path(mesh(usStatesTopo, usStatesTopo.objects.states, (a: any, b: any) => a !== b) as any) || "";
    const pin = proj([lon, lat]);
    return { statesPath, borders, pin };
  }, [lon, lat]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" className="ara-cc-quick__map-svg">
      <rect x="0" y="0" width={W} height={H} fill="#efe7d3" />
      <path d={geo.statesPath} fill="#e7dcc6" stroke="none" />
      <path d={geo.borders} fill="none" stroke="#c9bea8" strokeWidth={0.6} />
      {geo.pin ? (
        <g className="ara-cc-quick__pin" transform={`translate(${geo.pin[0]} ${geo.pin[1]})`}>
          <path d="M0 -15 C8 -15 12 -9 12 -4 C12 4 3 9 0 15 C-3 9 -12 4 -12 -4 C-12 -9 -8 -15 0 -15 Z" fill="#e0a526" stroke="#161b2e" strokeWidth="1.2" />
          <circle cy="-4" r="3.4" fill="#fffdf6" />
          <text x="16" y="1" className="ara-cc-quick__pin-label" fill="#161b2e">{label}</text>
        </g>
      ) : null}
    </svg>
  );
}

export default function CompaniesPage() {
  const settings = catalogContent.settings as unknown as Record<string, unknown>;
  const companies = companyRecords as unknown as Company[];
  const [query, setQuery] = useState("");
  // default to every sector — the shell must not assume one exists
  const [sector, setSector] = useState("all");
  const [active, setActive] = useState<Company | null>(null);
  const [belt, setBelt] = useState<"catalog" | "bookshelf">("catalog");
  const { member } = useAuth();
  const want = useWantList();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [digestIdx, setDigestIdx] = useState(0);

  const availableSectors = useMemo(() => {
    const counts = new Map<string, number>();
    companies.forEach((c) => {
      const s = c.sector || "other";
      counts.set(s, (counts.get(s) || 0) + 1);
    });
    return FILTERS.map((f) => ({
      ...f,
      count: f.id === "all" ? companies.length : counts.get(f.id) || 0,
    }));
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const sectorMatch = sector === "all" ? true : (c.sector || "other") === sector;
      const q = query.trim().toLowerCase();
      const text =
        `${c.company_name} ${c.ticker || ""} ${c.keywords || ""} ${c.business_model || ""} ${c.headquarters || ""}`.toLowerCase();
      return sectorMatch && (!q || text.includes(q));
    });
  }, [companies, query, sector]);

  const grouped = useMemo(() => {
    const order = availableSectors.filter((s) => s.id !== "all" && s.count > 0).map((s) => s.id);
    const map = new Map<string, Company[]>();
    filtered.forEach((c) => {
      const key = c.sector || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return order
      .filter((k) => map.has(k))
      .map((k) => ({
        sector: k,
        label: map.get(k)![0]?.sector_label || k.toUpperCase(),
        companies: map.get(k)!,
      }));
  }, [filtered, availableSectors]);

  const style = {
    ["--ara-cc-bg" as string]: String(settings.background_color || "#F5EFE1"),
    ["--ara-cc-card" as string]: String(settings.card_color || "#F3ECDC"),
    ["--ara-cc-text" as string]: String(settings.text_color || "#161B2E"),
    ["--ara-cc-muted" as string]: String(settings.muted_text_color || "#646575"),
    ["--ara-cc-line" as string]: String(settings.line_color || "#A6DECB"),
    ["--ara-cc-border" as string]: String(settings.border_color || "#C9BEA8"),
    ["--ara-cc-positive" as string]: String(settings.positive_color || "#12A67C"),
    ["--ara-cc-negative" as string]: String(settings.negative_color || "#ED5C5C"),
    ["--ara-cc-neutral" as string]: String(settings.neutral_color || "#176D5C"),
    ["--ara-cc-gold" as string]: String(settings.gold_color || "#E0A526"),
    ["--ara-cc-max" as string]: String(settings.max_width || "1500px"),
    ["--ara-cc-columns" as string]: String(settings.desktop_columns || 5),
    ["--ara-cc-top" as string]: `${settings.padding_top || 70}px`,
    ["--ara-cc-bottom" as string]: `${settings.padding_bottom || 100}px`,
    ["--ara-cc-heading-desktop" as string]: `${settings.desktop_heading_size || 64}px`,
    ["--ara-cc-category-desktop" as string]: `${settings.desktop_category_size || 14}px`,
    ["--ara-cc-company-desktop" as string]: `${settings.desktop_company_size || 18}px`,
    ["--ara-cc-meta-desktop" as string]: `${settings.desktop_meta_size || 10}px`,
    ["--ara-cc-heading-mobile" as string]: `${settings.mobile_heading_size || 42}px`,
    ["--ara-cc-category-mobile" as string]: `${settings.mobile_category_size || 12}px`,
    ["--ara-cc-company-mobile" as string]: `${settings.mobile_company_size || 16}px`,
    ["--ara-cc-meta-mobile" as string]: `${settings.mobile_meta_size || 9}px`,
  };

  return (
    <section className="ara-company-catalog" style={style}>
      <div className="ara-company-catalog__inner">
        {/* conveyor-belt loop of books — a few pass in front of you at a time */}
        <div className="mm-vitrine mm-vitrine--belt">
          <div className="mm-belt-switch" role="tablist" aria-label="Which belt to show">
            <button
              type="button"
              role="tab"
              aria-selected={belt === "catalog"}
              className={`mm-belt-switch__btn${belt === "catalog" ? " is-on" : ""}`}
              onClick={() => setBelt("catalog")}
            >
              Catalog
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={belt === "bookshelf"}
              className={`mm-belt-switch__btn${belt === "bookshelf" ? " is-on" : ""}`}
              onClick={() => setBelt("bookshelf")}
            >
              Bookshelf
              {member && want.items.length ? <i>{want.items.length}</i> : null}
            </button>
          </div>

          <div className="mm-vitrine__frame">
            <span className="mm-vitrine__lamp" aria-hidden="true" />

            {belt === "bookshelf" && !member ? (
              <div className="mm-belt-gate">
                <MemberAuth compact />
              </div>
            ) : (
              <div className="mm-conveyor">
                <div className="mm-conveyor__fade mm-conveyor__fade--l" aria-hidden="true" />
                <div className="mm-conveyor__fade mm-conveyor__fade--r" aria-hidden="true" />
                <div className="mm-conveyor__track">
                  {(() => {
                    const base =
                      belt === "bookshelf"
                        ? (want.items
                            .map((w) => companies.find((c) => c.id === w.id))
                            .filter(Boolean) as Company[])
                        : grouped.flatMap((g) => g.companies);
                    if (!base.length) return [] as Company[];
                    const filled = Array.from({ length: Math.max(10, base.length * 2) }, (_, i) => base[i % base.length]);
                    return [...filled, ...filled];
                  })().map((c, i) => (
                    <button
                      key={`${c.id}-${i}`}
                      type="button"
                      className="mm-conveyor__book"
                      onClick={() => setActive(c)}
                      aria-haspopup="dialog"
                      aria-label={c.company_name}
                      title={c.company_name}
                    >
                      <DigestCover
                        label={c.company_name}
                        accent={c.accent_color || "#176d5c"}
                        size="md"
                      />
                    </button>
                  ))}
                </div>
                <div className="mm-conveyor__belt" aria-hidden="true" />
                {belt === "bookshelf" && !want.items.length ? (
                  <p className="mm-belt-empty">
                    Your Bookshelf is empty — open a company and add it to your list.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="ara-company-catalog__tools">
          <label className="ara-company-catalog__search">
            <span>{String(settings.search_label || "SEARCH")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={String(settings.search_placeholder || "Search companies…")}
              autoComplete="off"
            />
          </label>

          <div className="ara-company-catalog__filters" aria-label="Company category filters">
            {availableSectors.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`ara-company-catalog__filter${sector === f.id ? " is-active" : ""}${
                  f.count === 0 ? " is-empty" : ""
                }`}
                style={{ ["--chip" as string]: SECTOR_TONE[f.id] || "#161b2e" }}
                aria-pressed={sector === f.id}
                disabled={f.count === 0}
                title={f.count === 0 ? "No companies in this sector yet" : undefined}
                onClick={() => setSector(f.id)}
              >
                {String(settings[f.labelKey] || f.fallback)}
                <i className="ara-company-catalog__filter-n">{f.count}</i>
              </button>
            ))}
          </div>

          <p className="ara-company-catalog__count">
            <strong>{filtered.length}</strong>
            <span>{String(settings.visible_count_label || "COMPANIES")}</span>
          </p>
        </div>

        <div className="ara-company-catalog__groups">
          {grouped.map((group) => (
            <div key={group.sector} className="ara-company-catalog__group">
              <div
                className="ara-company-catalog__group-heading"
                style={{ ["--ara-company-marker" as string]: SECTOR_TONE[group.sector] || "#176D5C" }}
              >
                <strong>{group.label}</strong>
                <small>
                  {String(group.companies.length).padStart(2, "0")} · {group.sector.toUpperCase()}
                </small>
              </div>
              <div className="ara-company-catalog__grid">
                {group.companies.map((c) => {
                  const path = SPARK[c.sparkline_style || ""] || DEFAULT_PATH;
                  // companies have no full page — the quick-open panel is the view
                  const href = appHref(c.module_link);
                  const cy =
                    c.direction === "down" ? 50 : c.direction === "flat" ? 26 : 9;
                  const card = (
                    <>
                      <div className="ara-company-catalog__card-heading">
                        <span className="ara-company-catalog__marker" aria-hidden="true" />
                        <div>
                          <strong>{c.company_name}</strong>
                          {settings.show_business_model !== false && c.business_model ? (
                            <small>{c.business_model}</small>
                          ) : null}
                        </div>
                        {settings.show_ticker !== false && c.ticker ? (
                          <span className="ara-company-catalog__ticker">{c.ticker}</span>
                        ) : null}
                      </div>
                      <div className="ara-company-catalog__chart" aria-hidden="true">
                        <svg viewBox="0 0 240 62" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`grad-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="20" x2="240" y2="20" className="ara-company-catalog__guide" />
                          <line x1="0" y1="42" x2="240" y2="42" className="ara-company-catalog__guide" />
                          <path d={`${path} L238 62 L2 62 Z`} fill={`url(#grad-${c.id})`} />
                          <path d={path} className="ara-company-catalog__line" />
                          <circle cx="238" cy={cy} r="2.8" className="ara-company-catalog__dot" />
                        </svg>
                      </div>
                      <div className="ara-company-catalog__card-footer">
                        <span className="ara-company-catalog__change">{c.change}</span>
                        {settings.show_status !== false && c.status ? (
                          <span className="ara-company-catalog__status">{c.status}</span>
                        ) : null}
                        <span className="ara-company-catalog__period">{c.period || "1Y"}</span>
                      </div>
                      <div className="ara-company-catalog__open">
                        <span>{String(settings.open_label || "OPEN FILE")}</span>
                        <span aria-hidden="true">↗</span>
                      </div>
                    </>
                  );

                  const className = `ara-company-catalog__card ara-company-catalog__card--${c.direction || "up"}`;
                  const styleCard = {
                    ["--ara-company-marker" as string]: SECTOR_TONE[c.sector || "other"] || "#176D5C",
                  };

                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={className}
                      style={styleCard}
                      onClick={() => setActive(c)}
                      aria-haspopup="dialog"
                    >
                      {card}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {active ? (
        (() => {
          const keywords = (active.keywords || "").split(/\s+/).filter(Boolean);
          // the header keeps the company's own colour; only its trim and the
          // smaller markings carry the sector, so colour says which sector you
          // are in without repainting the company
          const marker = active.accent_color || "#176D5C";
          const sectorColor = SECTOR_TONE[active.sector || "other"] || "#176D5C";
          // one mixed stream — news, takes, pitches, the view and the tagged
          // stories interleaved the way a feed reads, not filed into sections
          const record = companyRecords.find((r) => r.id === active.id);
          const profile = record?.profile;
          type FeedEntry = CompanyFeedItem & { t1: string; t2: string };
          // round-robin by kind so types alternate instead of clumping
          const byKind = new Map<string, FeedEntry[]>();
          (record?.feed || []).forEach((f) => {
            const entry = { ...f, ...FEED_TRIMS[f.kind] };
            byKind.set(f.kind, [...(byKind.get(f.kind) || []), entry]);
          });
          const pools = [...byKind.values()];
          const feed: FeedEntry[] = [];
          const total = pools.reduce((n, pool) => n + pool.length, 0);
          for (let i = 0; feed.length < total; i += 1) {
            pools.forEach((pool) => { if (pool[i]) feed.push(pool[i]); });
          }
          const ads = adSlots(feed.length);
          const digestTitle = `The ${active.company_name} Digest`;
          const price = 9.99;
          const issues = record?.digests || [];
          const current = issues[digestIdx] || issues[0] || { q: "", year: "" };
          const onAdd = () => {
            addItem({
              id: `digest-${active.id}-${current.q}-${current.year}`,
              title: `${digestTitle} · ${current.q} ${current.year}`,
              price,
              company: active.company_name,
            });
            setAdded(true);
            window.setTimeout(() => setAdded(false), 2000);
          };
          return (
            <div
              className="ara-company-catalog__modal ara-cc-quick-scrim"
              role="dialog"
              aria-modal="true"
              aria-label={`${active.company_name} file`}
              onClick={() => setActive(null)}
            >
              <aside
                className="ara-cc-quick"
                style={{
                  ["--ara-company-marker" as string]: marker,
                  ["--ara-company-sector" as string]: sectorColor,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="ara-cc-quick__close"
                  onClick={() => setActive(null)}
                  aria-label="Close"
                >
                  ×
                </button>

                {/* cover / hero */}
                <div className="ara-cc-quick__cover">
                  <span className="ara-cc-quick__kicker">Mintmark · Profile</span>
                  <div className="ara-cc-quick__cover-row">
                    <strong className="ara-cc-quick__name">{active.company_name}</strong>
                    {active.ticker ? <span className="ara-cc-quick__tk">{active.ticker}</span> : null}
                  </div>
                  {active.popup_tagline ? (
                    <span className="ara-cc-quick__tagline">{active.popup_tagline}</span>
                  ) : null}
                  <div className="ara-cc-quick__cover-meta">
                    {active.business_model ? <span>{active.business_model}</span> : null}
                    {active.headquarters ? <span>{active.headquarters}</span> : null}
                  </div>
                </div>

                {/* sliding sections */}
                <div className="ara-cc-quick__body">
                  <section className="ara-cc-quick__sec" style={{ ["--d" as string]: "0.06s" }}>
                    <h4 className="ara-cc-quick__sec-h">Profile</h4>
                    <div className="ara-cc-quick__map">
                      <HqMiniMap lon={profile?.lon ?? -98.5} lat={profile?.lat ?? 39.8} label={profile?.city || ""} />
                    </div>
                    {record ? <PriceTracker returns={record.returns} /> : null}
                    <p className="ara-cc-quick__lead">{(profile?.description || "—")}</p>
                    <div className="ara-cc-quick__rows">
                      <div className="ara-cc-quick__row"><span>Ticker</span><strong>{(active.ticker || "—")}</strong></div>
                      <div className="ara-cc-quick__row"><span>Size</span><strong>{(profile?.size || "—")}</strong></div>
                      <div className="ara-cc-quick__row"><span>Sector</span><strong>{(profile?.sector || "—")}</strong></div>
                      <div className="ara-cc-quick__row"><span>Headquarters</span><strong>{(profile?.city || "—")} · {(profile?.state || "—")} · USA</strong></div>
                      <div className="ara-cc-quick__row"><span>Chief executive</span><strong>{(profile?.ceo || "—")}</strong></div>
                      <div className="ara-cc-quick__row"><span>Founded</span><strong>{(profile?.founded || "—")}</strong></div>
                    </div>
                  </section>

                  <section className="ara-cc-quick__sec" style={{ ["--d" as string]: "0.14s" }}>
                    <h4 className="ara-cc-quick__sec-h">Digest</h4>
                    <div className="ara-cc-quick__digest">
                      {/* the heading already says the company — the cover shows
                          the ticker only, so nothing is said twice */}
                      <DigestCover
                        label={active.ticker || active.company_name}
                        accent={active.accent_color || "#176d5c"}
                        size="lg"
                      />
                      <span className="ara-cc-quick__digest-txt">
                        <strong>{digestTitle}</strong>
                        <label className="ara-cc-quick__qtr">
                          <span>Issue</span>
                          <select
                            value={digestIdx}
                            onChange={(e) => setDigestIdx(Number(e.target.value))}
                          >
                            {issues.map((d, i) => (
                              <option key={`${d.q}-${d.year}`} value={i}>
                                {d.q} {d.year}
                              </option>
                            ))}
                          </select>
                        </label>
                        <small>One company, one read.</small>
                      </span>
                    </div>

                    <div className="ara-cc-quick__buy">
                      <span className="ara-cc-quick__price">${price}</span>
                      <button type="button" className="ara-cc-quick__addbtn" onClick={onAdd}>
                        {added ? "Added ✓" : "Add to cart"}
                      </button>
                      <Link className="ara-cc-quick__viewcart" href="/cart">View cart</Link>
                      <button
                        type="button"
                        className={`ara-cc-quick__wantbtn${want.has(active.id) ? " is-on" : ""}`}
                        onClick={() =>
                          want.toggle({
                            id: active.id,
                            name: active.company_name,
                            ticker: active.ticker,
                            accent: active.accent_color,
                          })
                        }
                        disabled={!member}
                        title={member ? undefined : "Sign in to keep a Bookshelf"}
                      >
                        {want.has(active.id) ? "On my Bookshelf ✓" : "Add to Bookshelf"}
                      </button>
                    </div>

                  </section>

                  <section className="ara-cc-quick__sec ara-cc-quick__feed" style={{ ["--d" as string]: "0.22s" }}>
                    <h4 className="ara-cc-quick__sec-h">News from FIN</h4>
                    <p className="ara-cc-quick__feed-note">A live feed of everything FIN has tagged to {active.company_name}.</p>

                    <div className="ara-editorial-front-page ara-nr-quickfeed">
                      {feed.map((f, i) => (
                        <Fragment key={`${f.kind}-${i}`}>
                          {f.kind === "news" ? (
                            <div className="ara-nr-flip ara-nr-strip" style={{ ["--t1" as string]: f.t1, ["--t2" as string]: f.t2 }}>
                              <div className="ara-nr-flip__inner">
                                <div className="ara-nr-flip__face ara-nr-flip__front">
                                  <span className="ara-nr-trim" aria-hidden="true" />
                                  <div className="ara-nr-strip__tick">
                                    <small>{f.tag}</small>
                                  </div>
                                  <h4>{f.title}</h4>
                                </div>
                                <div className="ara-nr-flip__face ara-nr-flip__back">
                                  <span className="ara-nr-trim" aria-hidden="true" />
                                  <p>{f.body}</p>
                                  <a className="ara-nr-strip__go" href={appHref(f.link) || "#"}>
                                    {f.cta} <span aria-hidden="true">&rarr;</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {f.kind === "short" ? (
                            <div className="ara-nr-flip ara-nr-sq" style={{ ["--t1" as string]: f.t1, ["--t2" as string]: f.t2 }}>
                              <div className="ara-nr-flip__inner">
                                <div className="ara-nr-flip__face ara-nr-flip__front">
                                  <span className="ara-nr-trim" aria-hidden="true" />
                                  <div className="ara-nr-sq__num">
                                    <span>{String(i + 1).padStart(2, "0")}</span>
                                  </div>
                                  <h4>{f.title}</h4>
                                  <div className="ara-nr-sq__foot">
                                    <span>{f.tag}</span>
                                  </div>
                                </div>
                                <div className="ara-nr-flip__face ara-nr-flip__back">
                                  <span className="ara-nr-trim" aria-hidden="true" />
                                  <p>{f.body}</p>
                                  <a className="ara-nr-sq__go" href={appHref(f.link) || "#"}>
                                    {f.cta} <span aria-hidden="true">&rarr;</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {f.kind === "pitch" || f.kind === "story" ? (
                            <div
                              className={`ara-nr-flip ara-nr-sq ara-nr-sq--pitch${f.kind === "story" ? " ara-nr-sq--story" : ""}`}
                              style={{ ["--t1" as string]: f.t1, ["--t2" as string]: f.t2 }}
                            >
                              <div className="ara-nr-flip__inner">
                                <div className="ara-nr-flip__face ara-nr-flip__front">
                                  <span className="ara-nr-trim" aria-hidden="true" />
                                  <div className="ara-nr-sq__num">
                                    <span>{String(i + 1).padStart(2, "0")}</span>
                                    {f.kind === "story" && f.meta ? <b>{f.meta}</b> : null}
                                  </div>
                                  <h4>{f.title}</h4>
                                  <div className="ara-nr-sq__foot">
                                    <span>{f.tag}</span>
                                    <a className="ara-nr-sq__go" href={appHref(f.link) || "#"}>
                                      {f.cta} <span aria-hidden="true">&rarr;</span>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {f.kind === "view" ? (
                            <article
                              className="ara-editorial-front-page__question"
                              style={{
                                ["--ara-question-bg" as string]: "#161b2e",
                                ["--ara-question-text" as string]: "#f2f8f6",
                                ["--t1" as string]: f.t1,
                                ["--t2" as string]: f.t2,
                              }}
                            >
                              <span className="ara-nr-trim" aria-hidden="true" />
                              <div className="ara-editorial-front-page__question-copy">
                                <div className="ara-editorial-front-page__question-label">
                                  <span>{f.tag}</span>
                                  <i />
                                </div>
                                <h3>{f.title}</h3>
                                <Link className="ara-editorial-front-page__question-link" href={appHref(f.link) || "/mint"}>
                                  {f.cta} <span aria-hidden="true">&rarr;</span>
                                </Link>
                              </div>
                            </article>
                          ) : null}

                          {ads.has(i) ? (
                            <div className="ara-nr-quickfeed__ad">
                              <FeedAd />
                            </div>
                          ) : null}
                        </Fragment>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="ara-cc-quick__foot">
                  <button type="button" className="ara-cc-quick__cta" onClick={onAdd}>
                    {added ? "Added to cart ✓" : `Add the digest · $${price}`}
                  </button>
                </div>
              </aside>
            </div>
          );
        })()
      ) : null}
    </section>
  );
}
