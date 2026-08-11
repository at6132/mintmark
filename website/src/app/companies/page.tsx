"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { catalogContent } from "@/data/catalog";

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
  status?: string;
  module_link?: string;
};

export default function CompaniesPage() {
  const settings = catalogContent.settings as unknown as Record<string, unknown>;
  const companies = catalogContent.companies as unknown as Company[];
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");

  const sectors = useMemo(() => {
    const set = new Set(companies.map((c) => c.sector_label || c.sector || "OTHER"));
    return ["ALL", ...Array.from(set)];
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const sectorMatch =
        sector === "all" || sector === "ALL"
          ? true
          : String(c.sector_label || c.sector || "").toLowerCase() === sector.toLowerCase();
      const q = query.trim().toLowerCase();
      const text = `${c.company_name} ${c.ticker} ${c.keywords || ""} ${c.business_model || ""}`.toLowerCase();
      return sectorMatch && (!q || text.includes(q));
    });
  }, [companies, query, sector]);

  return (
    <section className="page-section cream">
      <div className="shell">
        <p className="eyebrow">{String(settings.eyebrow || "COMPANY CATALOG")}</p>
        <h1>{String(settings.heading || "Companies, collected for study.")}</h1>
        <p className="lede">
          {settings.description
            ? String(settings.description).replace(/<[^>]+>/g, "")
            : "Browse the catalog of company files, market movers and coming volumes."}
        </p>

        <div className="email-form" style={{ marginTop: 24, maxWidth: 640 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Apple, Costco, Airbus…"
            aria-label="Search companies"
          />
          <button type="button">SEARCH</button>
        </div>

        <div className="filters" style={{ marginTop: 18 }}>
          {sectors.map((s) => (
            <button
              key={s}
              type="button"
              className="filter-btn"
              aria-pressed={sector.toUpperCase() === s.toUpperCase() || (s === "ALL" && sector === "all")}
              onClick={() => setSector(s === "ALL" ? "all" : s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="catalog-grid" style={{ marginTop: 24 }}>
          {filtered.map((c) => {
            const href = c.module_link || (c.company_name === "Apple" ? "/companies/apple" : "");
            const body = (
              <>
                <div className="company-tile__top">
                  <span style={{ color: c.accent_color || "var(--mint-deep)" }}>{c.ticker}</span>
                  <span>{c.status || "COMING SOON"}</span>
                </div>
                <h3>{c.company_name}</h3>
                <p>
                  {c.business_model}
                  {c.headquarters ? ` · ${c.headquarters}` : ""}
                </p>
                <div className="company-tile__footer">
                  <span>{c.sector_label || c.sector}</span>
                  <span className={c.direction === "down" ? "change-down" : "change-up"}>{c.change}</span>
                </div>
              </>
            );
            return href ? (
              <Link key={c.id} href={href} className="company-tile">
                {body}
              </Link>
            ) : (
              <div key={c.id} className="company-tile" aria-disabled>
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
