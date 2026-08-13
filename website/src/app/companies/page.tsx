"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { catalogContent } from "@/data/catalog";
import { appHref } from "@/lib/assets";

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

export default function CompaniesPage() {
  const settings = catalogContent.settings as unknown as Record<string, unknown>;
  const companies = catalogContent.companies as unknown as Company[];
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [active, setActive] = useState<Company | null>(null);

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
                {[...grouped.flatMap((g) => g.companies), ...grouped.flatMap((g) => g.companies)].map((c, i) => (
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
        <div
          className="ara-company-catalog__modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.company_name} file`}
          onClick={() => setActive(null)}
        >
          <div
            className="ara-company-catalog__pop"
            style={{ ["--ara-company-marker" as string]: active.accent_color || "#176D5C" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ara-company-catalog__pop-close"
              onClick={() => setActive(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="ara-company-catalog__pop-head">
              <span className="ara-company-catalog__pop-marker" aria-hidden="true" />
              <div>
                <strong>{active.company_name}</strong>
                {active.business_model ? <small>{active.business_model}</small> : null}
              </div>
              {active.ticker ? <span className="ara-company-catalog__ticker">{active.ticker}</span> : null}
            </div>
            {active.headquarters ? (
              <p className="ara-company-catalog__pop-meta">{active.headquarters}</p>
            ) : null}
            <div className="ara-company-catalog__pop-tags">
              {(() => {
                const href =
                  appHref(active.module_link) ||
                  (active.company_name === "Apple" ? "/companies/apple" : "#");
                return (
                  <>
                    <Link className="ara-company-catalog__tag ara-company-catalog__tag--stories" href={href}>
                      Company Stories
                    </Link>
                    <Link className="ara-company-catalog__tag ara-company-catalog__tag--digest" href={href}>
                      Digest
                    </Link>
                    <Link className="ara-company-catalog__tag ara-company-catalog__tag--profile" href={href}>
                      Company Profile
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
