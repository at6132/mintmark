"use client";

import { useMemo, useState } from "react";
import { marketMapsContent } from "@/data/marketMaps";
import { SECTOR_COLORS } from "@/lib/sectors";

type Company = {
  id: string;
  ticker?: string;
  company_name?: string;
  sector?: string;
  market_cap?: string;
  daily_move?: string;
};


export function MintMarketMaps() {
  const settings = marketMapsContent.settings as Record<string, unknown>;
  const companies = marketMapsContent.companies as unknown as Company[];
  const [view, setView] = useState<"heat" | "hq">(
    settings.default_view === "hq" ? "hq" : "heat",
  );

  const style = {
    ["--ara-heat-bg" as string]: String(settings.background_color || "#F5EFE1"),
    ["--ara-heat-text" as string]: String(settings.text_color || "#161B2E"),
    ["--ara-heat-mint" as string]: String(settings.mint_color || "#1FA88F"),
    ["--ara-heat-gold" as string]: String(settings.gold_color || "#E0A526"),
    ["--ara-heat-paper" as string]: String(settings.paper_color || "#FBF7EC"),
    ["--ara-heat-max" as string]: `${settings.max_width || 1200}px`,
    ["--ara-heat-top" as string]: `${settings.padding_top || 70}px`,
    ["--ara-heat-bottom" as string]: `${settings.padding_bottom || 70}px`,
  };

  const sorted = useMemo(() => {
    return [...companies].sort(
      (a, b) => Number(b.market_cap || 0) - Number(a.market_cap || 0),
    );
  }, [companies]);

  return (
    <section className="ara-mint-heatmap" style={style}>
      <div className="ara-mint-heatmap__lines" aria-hidden="true" />
      <div className="ara-mint-heatmap__inner">
        <div className="ara-mint-heatmap__intro-frame">
          <div className="ara-mint-heatmap__intro">
            <div className="ara-mint-heatmap__copy">
              <span className="ara-mint-heatmap__eyebrow">MARKET MAP</span>
              <h2 className="ara-mint-heatmap__heading">
                {String(settings.title || "U.S. companies")}{" "}
                <em>
                  {view === "heat"
                    ? String(settings.heat_subtitle || "")
                    : String(settings.hq_subtitle || "")}
                </em>
              </h2>
              <p className="ara-mint-heatmap__note">
                {view === "heat"
                  ? String(settings.heat_group_label || "")
                  : String(settings.hq_note || "")}
              </p>
            </div>
            <div className="ara-mint-heatmap__legend">
              <div className="ara-mint-heatmap__legend-head">
                <span>TODAY&apos;S MOVE</span>
                <small>{String(settings.data_note || "")}</small>
              </div>
              <div className="ara-mint-heatmap__legend-items">
                <div>
                  <i className="ara-mint-heatmap__legend-color ara-mint-heatmap__legend-color--positive" />
                  <span>{String(settings.legend_up_label || "up")}</span>
                </div>
                <div>
                  <i className="ara-mint-heatmap__legend-color ara-mint-heatmap__legend-color--neutral" />
                  <span>flat</span>
                </div>
                <div>
                  <i className="ara-mint-heatmap__legend-color ara-mint-heatmap__legend-color--negative" />
                  <span>{String(settings.legend_down_label || "down")}</span>
                </div>
              </div>
              <div className="ara-mint-heatmap__live-note">
                <span className="ara-mint-heatmap__live-dot" />
                {String(settings.heat_size_label || "Cell size = market cap")}
              </div>
            </div>
          </div>
        </div>

        <div className="ara-mint-heatmap__board-frame">
          <div className="ara-mint-heatmap__board">
            <div className="ara-mint-heatmap__board-head">
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="ara-mint-heatmap__board-badge"
                  aria-pressed={view === "heat"}
                  onClick={() => setView("heat")}
                  style={{
                    opacity: view === "heat" ? 1 : 0.55,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {String(settings.heat_button_label || "Heat map")}
                </button>
                <button
                  type="button"
                  className="ara-mint-heatmap__board-badge"
                  aria-pressed={view === "hq"}
                  onClick={() => setView("hq")}
                  style={{
                    opacity: view === "hq" ? 1 : 0.55,
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {String(settings.hq_button_label || "Headquarters")}
                </button>
              </div>
              <span className="ara-mint-heatmap__board-badge">{sorted.length} NAMES</span>
            </div>

            <div
              className="ara-mint-heatmap__grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 10,
                alignItems: "stretch",
              }}
            >
              {sorted.map((c) => {
                const move = Number(c.daily_move || 0);
                const dir = move > 0.05 ? "up" : move < -0.05 ? "down" : "flat";
                const cap = Math.max(40, Number(c.market_cap || 50));
                const weight = Math.min(2.4, Math.max(0.75, cap / 280));
                const sectorColor = SECTOR_COLORS[c.sector || ""] || "#1FA88F";
                return (
                  <article
                    key={c.id}
                    className={`ara-mint-heatmap__tile ara-mint-heatmap__tile--${dir}`}
                    style={{
                      gridRow: `span ${Math.round(weight * 2)}`,
                      minHeight: 88 * weight,
                      borderColor: sectorColor,
                      ["--ara-tile-accent" as string]: sectorColor,
                    }}
                  >
                    <div className="ara-mint-heatmap__tile-top">
                      <span>{c.ticker}</span>
                      <small>
                        {move > 0 ? "+" : ""}
                        {move.toFixed(1)}%
                      </small>
                    </div>
                    <div className="ara-mint-heatmap__tile-main">
                      <strong>{c.company_name}</strong>
                      <span>{c.sector}</span>
                      {view === "hq" ? (
                        <small style={{ opacity: 0.75 }}>
                          HQ · {c.sector}
                        </small>
                      ) : (
                        <small style={{ opacity: 0.75 }}>cap {c.market_cap}</small>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="ara-mint-heatmap__footer-note">
              {String(settings.data_note || "")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
