"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import statesTopoRaw from "us-atlas/states-10m.json";
import { catalogContent } from "@/data/catalog";
import { appleContent } from "@/data/apple";
import { appHref } from "@/lib/assets";
import { useCart } from "@/lib/cart";

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

const SECTOR_TONE: Record<string, string> = {
  all: "#161b2e",
  classics: "#8a6d3b",
  technology: "#1fa88f",
  consumer: "#7a9e5b",
  industrials: "#4c6b8a",
  "food-beverage": "#c25b3f",
  financials: "#e0a526",
  healthcare: "#9a5ba6",
  energy: "#b4482f",
  retail: "#3a5be0",
  other: "#646575",
};

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

// Apple module content — profile, digests (current + past), and FIN news by style
const APPLE_PROFILE = {
  description:
    "Apple makes the iPhone, Mac, iPad and the software and services that run on them — then ties them together so tightly that leaving means giving up your photos, apps, messages and habits. That lock-in is the business.",
  ticker: "AAPL",
  size: "MEGA CAP",
  sector: "Technology",
  country: "United States",
  state: "California",
  city: "Cupertino",
  ceo: "Tim Cook",
  founded: "1976",
};
const APPLE_DIGESTS = [
  { q: "Q3", year: "2026", current: true },
  { q: "Q2", year: "2026", current: false },
  { q: "Q1", year: "2026", current: false },
  { q: "Q4", year: "2025", current: false },
];
// FIN news, in the newsroom's own shapes (flip strips + flip squares)
const APPLE_STRIPS = [
  { ticker: "AAPL", time: "TODAY", heading: "Services hit a record quarter", summary: "Recurring revenue keeps climbing as the installed base grows.", link: "" },
  { ticker: "AAPL", time: "TODAY", heading: "iPhone upgrade cycle lengthens", summary: "Fewer phones sold, but customers stay in the ecosystem longer.", link: "" },
  { ticker: "AAPL", time: "1W", heading: "Gross margin holds near 46%", summary: "A rich services mix keeps profitability unusually high.", link: "" },
];
const APPLE_SQUARES: Array<{
  kind: "pitch" | "short";
  number: string;
  ticker: string;
  heading: string;
  foot: string;
  summary: string;
  link: string;
}> = [
  { kind: "pitch", number: "01", ticker: "AAPL", heading: "Apple Intelligence: the new privacy moat", foot: "Pitch", summary: "On-device AI becomes a wall competitors can’t climb — the privacy war, won one iPhone at a time.", link: "" },
  { kind: "short", number: "02", ticker: "AAPL", heading: "Services is now the second-biggest business", foot: "Short take", summary: "The quiet engine behind the headline numbers.", link: "" },
  { kind: "short", number: "03", ticker: "AAPL", heading: "A longer upgrade cycle, stickier customers", foot: "Short take", summary: "Fewer units sold, but far more loyalty.", link: "" },
];
const APPLE_NEWS_QUOTE = {
  text: "Understand the device in your pocket before you ever own the stock.",
  who: "The Mintmark view",
};

// a real US map (d3-geo + us-atlas — the site's own map data) with the HQ pinned
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
          <circle className="ara-cc-quick__pin-halo" r="15" fill="#e0a526" fillOpacity="0.28" />
          <path d="M0 -15 C8 -15 12 -9 12 -4 C12 4 3 9 0 15 C-3 9 -12 4 -12 -4 C-12 -9 -8 -15 0 -15 Z" fill="#e0a526" stroke="#161b2e" strokeWidth="1.2" />
          <circle cy="-4" r="3.4" fill="#fffdf6" />
          <text x="16" y="1" className="ara-cc-quick__pin-label" fill="#161b2e">{label}</text>
        </g>
      ) : null}
    </svg>
  );
}

const PRICE_RANGES = ["1W", "1M", "YTD", "1Y", "3Y", "ALL"] as const;
const PRICE_DATA: Record<string, { pts: number[]; chg: string; up: boolean }> = {
  "1W": { pts: [0.4, 0.42, 0.38, 0.46, 0.5, 0.47, 0.55], chg: "+1.2%", up: true },
  "1M": { pts: [0.32, 0.36, 0.3, 0.42, 0.4, 0.48, 0.52, 0.5, 0.58], chg: "+3.4%", up: true },
  YTD: { pts: [0.5, 0.44, 0.4, 0.48, 0.56, 0.5, 0.6, 0.58, 0.66], chg: "+6.1%", up: true },
  "1Y": { pts: [0.35, 0.3, 0.4, 0.44, 0.5, 0.42, 0.56, 0.6, 0.58, 0.7], chg: "+4.7%", up: true },
  "3Y": { pts: [0.2, 0.3, 0.24, 0.4, 0.5, 0.44, 0.6, 0.7, 0.64, 0.82], chg: "+58%", up: true },
  ALL: { pts: [0.04, 0.09, 0.07, 0.2, 0.34, 0.3, 0.5, 0.64, 0.8, 0.96], chg: "+21,400%", up: true },
};
function pricePath(pts: number[]) {
  const W = 300;
  const H = 88;
  const pad = 6;
  const step = (W - 2 * pad) / (pts.length - 1);
  const y = (v: number) => H - pad - v * (H - 2 * pad);
  return pts.map((v, i) => `${i ? "L" : "M"}${(pad + i * step).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
}
function PriceTracker() {
  return (
    <div className="ara-cc-quick__tracker">
      <span className="ara-cc-quick__tracker-lbl">Share price return</span>
      <div className="ara-cc-quick__tracker-grid">
        {PRICE_RANGES.map((r) => {
          const d = PRICE_DATA[r];
          const color = d.up ? "#12a67c" : "#ed5c5c";
          return (
            <div className="ara-cc-quick__tracker-cell" key={r}>
              <span className="ara-cc-quick__tracker-range">{r}</span>
              <strong style={{ color }}>{d.up ? "▲" : "▼"} {d.chg}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const settings = catalogContent.settings as unknown as Record<string, unknown>;
  // catalog is focused on a single company for now — Apple
  const companies = (catalogContent.companies as unknown as Company[]).filter((c) => c.id === "apple");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("classics");
  const [active, setActive] = useState<Company | null>(null);
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [digestIdx, setDigestIdx] = useState(0);

  const availableSectors = useMemo(() => {
    const counts = new Map<string, number>();
    companies.forEach((c) => {
      const s = c.sector || "other";
      counts.set(s, (counts.get(s) || 0) + 1);
    });
    return FILTERS.filter((f) => f.id === "all" || (counts.get(f.id) || 0) > 0);
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
    const order = availableSectors.filter((s) => s.id !== "all").map((s) => s.id);
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
          <div className="mm-vitrine__frame">
            <span className="mm-vitrine__lamp" aria-hidden="true" />
            <div className="mm-conveyor">
              <div className="mm-conveyor__fade mm-conveyor__fade--l" aria-hidden="true" />
              <div className="mm-conveyor__fade mm-conveyor__fade--r" aria-hidden="true" />
              <div className="mm-conveyor__track">
                {(() => {
                  const base = grouped.flatMap((g) => g.companies);
                  if (!base.length) return [] as Company[];
                  const filled = Array.from({ length: Math.max(10, base.length * 2) }, (_, i) => base[i % base.length]);
                  return [...filled, ...filled];
                })().map((c, i) => (
                  <button
                    key={`${c.id}-${i}`}
                    type="button"
                    className="mm-conveyor__book"
                    style={{ ["--co" as string]: c.accent_color || "#176d5c" }}
                    onClick={() => setActive(c)}
                    aria-haspopup="dialog"
                    aria-label={c.company_name}
                    title={c.company_name}
                  >
                    <span className="mm-conveyor__band" aria-hidden="true" />
                    <span className="mm-conveyor__tk">{c.ticker || c.company_name.slice(0, 3).toUpperCase()}</span>
                    <span className="mm-conveyor__name">{c.company_name}</span>
                    <span className="mm-conveyor__band mm-conveyor__band--lo" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="mm-conveyor__belt" aria-hidden="true" />
            </div>
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
                className={`ara-company-catalog__filter${sector === f.id ? " is-active" : ""}`}
                style={{ ["--chip" as string]: SECTOR_TONE[f.id] || "#161b2e" }}
                aria-pressed={sector === f.id}
                onClick={() => setSector(f.id)}
              >
                {String(settings[f.labelKey] || f.fallback)}
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
              <div className="ara-company-catalog__group-heading">
                <strong>{group.label}</strong>
                <small>
                  {String(group.companies.length).padStart(2, "0")} · {group.sector.toUpperCase()}
                </small>
              </div>
              <div className="ara-company-catalog__grid">
                {group.companies.map((c) => {
                  const path = SPARK[c.sparkline_style || ""] || DEFAULT_PATH;
                  const href =
                    appHref(c.module_link) ||
                    (c.company_name === "Apple" ? "/companies/apple" : undefined);
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
                  const styleCard = { ["--ara-company-marker" as string]: c.accent_color || "#176D5C" };

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
          const marker = active.accent_color || "#176D5C";
          // all tagged stories for this company, grouped by content (category)
          const rawStories =
            (appleContent.apple_company_stories?.blocks as unknown as Array<Record<string, string>>)?.filter(
              (b) => b.type === "story",
            ) || [];
          const storyGroups = Object.values(
            rawStories.reduce((acc, st) => {
              const cat = (st.category || "Stories").toUpperCase();
              (acc[cat] = acc[cat] || { cat, items: [] as Array<Record<string, string>> }).items.push(st);
              return acc;
            }, {} as Record<string, { cat: string; items: Array<Record<string, string>> }>),
          );
          const digestTitle = `The ${active.company_name} Digest`;
          const price = 9.99;
          const current = APPLE_DIGESTS[digestIdx] || APPLE_DIGESTS[0];
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
                style={{ ["--ara-company-marker" as string]: marker }}
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
                    {active.change ? (
                      <span className={`is-${active.direction || "up"}`}>
                        {active.change} · {active.period || "1Y"}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* sliding sections */}
                <div className="ara-cc-quick__body">
                  <section className="ara-cc-quick__sec" style={{ ["--d" as string]: "0.06s" }}>
                    <h4 className="ara-cc-quick__sec-h">Profile</h4>
                    <div className="ara-cc-quick__map">
                      <HqMiniMap lon={-122.0322} lat={37.323} label={APPLE_PROFILE.city} />
                    </div>
                    <PriceTracker />
                    <p className="ara-cc-quick__lead">{APPLE_PROFILE.description}</p>
                    <div className="ara-cc-quick__rows">
                      <div className="ara-cc-quick__row"><span>Ticker</span><strong>{APPLE_PROFILE.ticker}</strong></div>
                      <div className="ara-cc-quick__row"><span>Size</span><strong>{APPLE_PROFILE.size}</strong></div>
                      <div className="ara-cc-quick__row"><span>Sector</span><strong>{APPLE_PROFILE.sector}</strong></div>
                      <div className="ara-cc-quick__row"><span>Headquarters</span><strong>{APPLE_PROFILE.city} · {APPLE_PROFILE.state} · USA</strong></div>
                      <div className="ara-cc-quick__row"><span>Chief executive</span><strong>{APPLE_PROFILE.ceo}</strong></div>
                      <div className="ara-cc-quick__row"><span>Founded</span><strong>{APPLE_PROFILE.founded}</strong></div>
                    </div>
                  </section>

                  <section className="ara-cc-quick__sec" style={{ ["--d" as string]: "0.14s" }}>
                    <h4 className="ara-cc-quick__sec-h">Digest</h4>
                    <div className="ara-cc-quick__digest">
                      <span className="ara-cc-quick__digest-cover" aria-hidden="true">
                        <b>{current.q}</b>
                        <i>Digest</i>
                      </span>
                      <span className="ara-cc-quick__digest-txt">
                        <strong>{digestTitle}</strong>
                        <small>{current.q} {current.year} · one company, one read.</small>
                      </span>
                    </div>
                    <div className="ara-cc-quick__buy">
                      <span className="ara-cc-quick__price">${price}</span>
                      <button type="button" className="ara-cc-quick__addbtn" onClick={onAdd}>
                        {added ? "Added ✓" : "Add to cart"}
                      </button>
                      <Link className="ara-cc-quick__viewcart" href="/cart">View cart</Link>
                    </div>
                    <div className="ara-cc-quick__past">
                      <span className="ara-cc-quick__past-h">Past digests — tap to select</span>
                      <div className="ara-cc-quick__past-grid">
                        {APPLE_DIGESTS.map((d, i) =>
                          i === digestIdx ? null : (
                            <button
                              key={`${d.q}-${d.year}`}
                              type="button"
                              className="ara-cc-quick__slot"
                              onClick={() => setDigestIdx(i)}
                              aria-label={`Select the ${d.q} ${d.year} digest`}
                              title={`Select ${d.q} ${d.year}`}
                            >
                              <b>{d.q}</b>
                              <i>{d.year}</i>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="ara-cc-quick__sec ara-cc-quick__feed" style={{ ["--d" as string]: "0.22s" }}>
                    <h4 className="ara-cc-quick__sec-h">News from FIN</h4>
                    <p className="ara-cc-quick__feed-note">A live feed of everything FIN has tagged to {active.company_name}.</p>

                    <div className="ara-editorial-front-page ara-cc-quick__fin">
                    {/* news strips — real FIN flip tickers (tap to flip → read) */}
                    <div className="ara-nr-strips ara-cc-quick__nr" style={{ ["--sec" as string]: "#176d5c" }}>
                      {APPLE_STRIPS.map((m, i) => (
                        <div key={i} className="ara-nr-flip ara-nr-strip">
                          <div className="ara-nr-flip__inner">
                            <div className="ara-nr-flip__face ara-nr-flip__front">
                              <div className="ara-nr-strip__tick">
                                <b>{m.ticker}</b>
                                <small>{m.time}</small>
                              </div>
                              <h4>{m.heading}</h4>
                            </div>
                            <div className="ara-nr-flip__face ara-nr-flip__back">
                              <div className="ara-nr-strip__tick"><b>{m.ticker}</b></div>
                              <p>{m.summary}</p>
                              <a className="ara-nr-strip__go" href={appHref(m.link) || "#"}>
                                Read <span aria-hidden="true">→</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* pitches + short takes — real FIN flip squares */}
                    <div className="ara-nr-sqgrid ara-cc-quick__nr" style={{ ["--sec" as string]: "#c0881e" }}>
                      {APPLE_SQUARES.map((q, i) => (
                        <div key={i} className={`ara-nr-flip ara-nr-sq${q.kind === "pitch" ? " ara-nr-sq--pitch" : ""}`}>
                          <div className="ara-nr-flip__inner">
                            <div className="ara-nr-flip__face ara-nr-flip__front">
                              <div className="ara-nr-sq__num">
                                <span>{q.number}</span>
                                <b>{q.ticker}</b>
                              </div>
                              <h4>{q.heading}</h4>
                              <div className="ara-nr-sq__foot">
                                <span>{q.foot}</span>
                                <span>Tap</span>
                              </div>
                            </div>
                            <div className="ara-nr-flip__face ara-nr-flip__back">
                              <p>{q.summary}</p>
                              <a className="ara-nr-sq__go" href={appHref(q.link) || "#"}>
                                {q.kind === "pitch" ? "Read the pitch" : "Read"} <span aria-hidden="true">→</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* question / quote — real FIN question card */}
                    <article
                      className="ara-editorial-front-page__question ara-cc-quick__nr"
                      style={{ ["--ara-question-bg" as string]: "#161b2e", ["--ara-question-text" as string]: "#f2f8f6" }}
                    >
                      <div className="ara-editorial-front-page__question-copy">
                        <div className="ara-editorial-front-page__question-label">
                          <span>The Mintmark view</span>
                          <i />
                        </div>
                        <h3>{APPLE_NEWS_QUOTE.text}</h3>
                        <Link className="ara-editorial-front-page__question-link" href="/mint">
                          Explore the curriculum <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                    </div>

                    {/* stories — tagged, organized by content */}
                    {storyGroups.map((g) => (
                      <div className="ara-cc-quick__storygroup" key={g.cat}>
                        <div className="ara-cc-quick__storycat">
                          <span>{g.cat}</span>
                          <i>{String(g.items.length).padStart(2, "0")}</i>
                        </div>
                        {g.items.map((st, i) => (
                          <article className="ara-cc-quick__story" key={i}>
                            <strong>{st.custom_title}</strong>
                            <p>{st.custom_excerpt}</p>
                            <span>{st.custom_date}</span>
                          </article>
                        ))}
                      </div>
                    ))}
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
