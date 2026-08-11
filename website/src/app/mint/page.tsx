"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mintContent } from "@/data/mint";
import { stripHtml } from "@/lib/format";

const CONCEPT_KEYS = [
  ["raise_title", "raise_text"],
  ["build_title", "build_text"],
  ["sell_title", "sell_text"],
  ["grow_title", "grow_text"],
  ["allocate_title", "allocate_text"],
  ["defend_title", "defend_text"],
] as const;

export default function MintPage() {
  const { curriculum, markets } = mintContent;
  const { settings, levels } = curriculum;
  const [openId, setOpenId] = useState(
    levels.find((l) => l.open_by_default)?.id || levels[0]?.id || "",
  );
  const [query, setQuery] = useState("");

  const filteredLevels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return levels;
    return levels.filter((level) => {
      const blob = JSON.stringify(level).toLowerCase();
      return blob.includes(q);
    });
  }, [levels, query]);

  return (
    <>
      <section className="mint-hero page-section cream">
        <div className="shell">
          <p className="eyebrow">{settings.eyebrow}</p>
          <h1>{settings.heading}</h1>
          <p className="lede">{stripHtml(settings.description)}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {[settings.progress_one, settings.progress_two, settings.progress_three].map((step, i) => (
              <span
                key={step}
                style={{
                  border: "1px solid var(--rule)",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontFamily: "var(--font-ui)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                0{i + 1}. {step}
              </span>
            ))}
          </div>

          <div className="email-form" style={{ marginTop: 28, maxWidth: 560 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={settings.search_placeholder}
              aria-label={settings.search_label}
            />
            <button type="button" onClick={() => undefined}>
              {settings.search_label}
            </button>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>{settings.search_note}</p>

          <div className="levels">
            {filteredLevels.map((level) => {
              const open = openId === level.id;
              return (
                <article key={level.id} className="level" data-open={open}>
                  <button
                    type="button"
                    className="level__toggle"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? "" : level.id)}
                  >
                    <span className="level__num">{level.number}</span>
                    <div>
                      <h3>{level.title}</h3>
                      <p>{level.subtitle}</p>
                    </div>
                    <span className="level__metal">{level.metal}</span>
                  </button>
                  <div className="level__body">
                    {CONCEPT_KEYS.map(([titleKey, textKey]) => {
                      const row = level as unknown as Record<string, string>;
                      return (
                        <div key={titleKey} className="concept">
                          <span>{level.status}</span>
                          <h4>{row[titleKey]}</h4>
                          <p>{row[textKey]}</p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="map-panel">
            <div className="section-label">
              <h3>{settings.matrix_heading || "Market maps"}</h3>
              <span>LIVE POSITIONS</span>
            </div>
            <p className="lede" style={{ marginBottom: 16 }}>
              {settings.matrix_description}
            </p>
            <div className="map-canvas" aria-label="Company headquarters map">
              {markets.companies.map((c) => {
                const left = ((Number(c.longitude) + 180) / 360) * 100;
                const top = ((90 - Number(c.latitude)) / 180) * 100;
                const up = Number(c.daily_move) >= 0;
                return (
                  <Link
                    key={c.id}
                    href={c.module_link || "/companies"}
                    className="map-dot"
                    data-up={up}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    title={`${c.company_name} ${c.daily_move}%`}
                  />
                );
              })}
            </div>
            <div className="map-legend">
              {markets.companies.slice(0, 12).map((c) => (
                <span key={c.id}>
                  {c.ticker} {Number(c.daily_move) >= 0 ? "▲" : "▼"}
                  {c.daily_move}%
                </span>
              ))}
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 16 }}>{settings.matrix_footer}</p>
          </div>
        </div>
      </section>
    </>
  );
}
