"use client";

import { useMemo, useState } from "react";
import { MintMarketMaps } from "@/components/MintMarketMaps";
import { mintContent } from "@/data/mint";
import { assets } from "@/lib/assets";
import { stripHtml } from "@/lib/format";

const CONCEPTS = [
  { domain: "raise", title: "raise_title", text: "raise_text", label: "RAISE" },
  { domain: "build", title: "build_title", text: "build_text", label: "BUILD" },
  { domain: "sell", title: "sell_title", text: "sell_text", label: "SELL" },
  { domain: "grow", title: "grow_title", text: "grow_text", label: "GROW" },
  { domain: "allocate", title: "allocate_title", text: "allocate_text", label: "ALLOCATE" },
  { domain: "defend", title: "defend_title", text: "defend_text", label: "DEFEND" },
] as const;

export default function MintPage() {
  const curriculum = mintContent.curriculum as {
    settings: Record<string, unknown>;
    levels: Array<Record<string, unknown>>;
  };
  const settings = curriculum.settings;
  const levels = curriculum.levels;
  const defaultOpen =
    levels.find((l) => l.open_by_default)?.id || (levels[0]?.id as string) || "";
  const [activeId, setActiveId] = useState(String(defaultOpen));
  const [domain, setDomain] = useState("all");
  const [query, setQuery] = useState("");

  const active = levels.find((l) => String(l.id) === activeId) || levels[0];

  const filteredConcepts = useMemo(() => {
    if (!active) return [];
    const q = query.trim().toLowerCase();
    return CONCEPTS.filter((c) => {
      if (domain !== "all" && c.domain !== domain) return false;
      if (!q) return true;
      const title = String(active[c.title] || "").toLowerCase();
      const text = String(active[c.text] || "").toLowerCase();
      return title.includes(q) || text.includes(q) || String(active.title).toLowerCase().includes(q);
    });
  }, [active, domain, query]);

  const style = {
    ["--ara-mint-bg" as string]: String(settings.background_color || "#F5EFE1"),
    ["--ara-mint-paper" as string]: String(settings.paper_color || "#F3ECDC"),
    ["--ara-mint-ink" as string]: String(settings.text_color || "#161B2E"),
    ["--ara-mint-muted" as string]: String(settings.muted_color || "#646575"),
    ["--ara-mint-mint" as string]: String(settings.mint_color || "#A6DECB"),
    ["--ara-mint-gold" as string]: String(settings.gold_color || "#E0A526"),
    ["--ara-mint-border" as string]: String(settings.border_color || "#C9BEA8"),
    ["--ara-mint-max" as string]: String(settings.max_width || "1450px"),
    ["--ara-mint-top" as string]: `${settings.padding_top || 70}px`,
    ["--ara-mint-bottom" as string]: `${settings.padding_bottom || 100}px`,
    ["--ara-mint-heading-desktop" as string]: `${settings.desktop_heading_size || 64}px`,
    ["--ara-mint-level-desktop" as string]: `${settings.desktop_level_size || 28}px`,
    ["--ara-mint-body-desktop" as string]: `${settings.desktop_body_size || 16}px`,
    ["--ara-mint-label-desktop" as string]: `${settings.desktop_label_size || 10}px`,
    ["--ara-mint-heading-mobile" as string]: `${settings.mobile_heading_size || 42}px`,
    ["--ara-mint-level-mobile" as string]: `${settings.mobile_level_size || 24}px`,
    ["--ara-mint-body-mobile" as string]: `${settings.mobile_body_size || 15}px`,
    ["--ara-mint-label-mobile" as string]: `${settings.mobile_label_size || 9}px`,
  };

  return (
    <>
    <section className="ara-mint-curriculum" style={style}>
      <div className="ara-mint-curriculum__rules" aria-hidden="true" />
      <div className="ara-mint-curriculum__inner">
        <div className="ara-mint-curriculum__masthead">
          <img
            src={assets.wordmarkInk}
            className="ara-mint-curriculum__wordmark"
            alt="Mintmark"
            width={488}
            height={88}
          />
          <div className="ara-mint-curriculum__masthead-center">
            <span>THE MINT</span>
            <small>CURRICULUM · SIX LEVELS · THIRTY-SIX CONCEPTS</small>
          </div>
          <img
            src={assets.mintEmblem}
            className="ara-mint-curriculum__mint-emblem"
            alt=""
            width={270}
            height={183}
          />
        </div>

        <header className="ara-mint-curriculum__cover">
          <div className="ara-mint-curriculum__cover-copy">
            <div className="ara-mint-curriculum__folio">
              <span>THE MINTMARK CURRICULUM</span>
              <span>EDITION · 01</span>
            </div>
            {settings.eyebrow ? (
              <p className="ara-mint-curriculum__eyebrow">{String(settings.eyebrow)}</p>
            ) : null}
            {settings.heading ? <h1>{String(settings.heading)}</h1> : null}
            {settings.description ? (
              <div className="ara-mint-curriculum__description">
                <p>{stripHtml(String(settings.description))}</p>
              </div>
            ) : null}
            <div className="ara-mint-curriculum__strike-path">
              <div>
                <b>01</b>
                <span>{String(settings.progress_one || "")}</span>
              </div>
              <i aria-hidden="true" />
              <div>
                <b>02</b>
                <span>{String(settings.progress_two || "")}</span>
              </div>
              <i aria-hidden="true" />
              <div>
                <b>03</b>
                <span>{String(settings.progress_three || "")}</span>
              </div>
            </div>
          </div>

          <div className="ara-mint-curriculum__coin-feature">
            <div className="ara-mint-curriculum__coin-head">
              <div>
                <span>THE COIN SYSTEM</span>
                <strong>METALS ARE THE CURRICULUM</strong>
              </div>
              <span className="ara-mint-curriculum__coin-folio">COMPANY COIN · SAMPLE</span>
            </div>
            <div className="ara-mint-curriculum__coin-stage">
              <img
                src={assets.companyCoinNvda}
                alt="Mintmark company coin sample for Nvidia"
                className="ara-mint-curriculum__company-coin"
                width={802}
                height={741}
              />
              <img
                src={assets.markTransparent}
                alt=""
                className="ara-mint-curriculum__mark-watermark"
                width={250}
                height={251}
              />
            </div>
            <div className="ara-mint-curriculum__coin-key">
              <span>ONE CELL = ONE CONCEPT</span>
              <span>METAL = TOPIC</span>
              <span>TREATMENT = DIFFICULTY</span>
            </div>
          </div>
        </header>

        <section className="ara-mint-curriculum__index" aria-label="Curriculum index">
          <div className="ara-mint-curriculum__section-heading">
            <div>
              <span>THE SIX LEVELS</span>
              <h2>From first principles to the corner office.</h2>
            </div>
            <p>Select a metal plate to open its six concepts. Each level keeps the supplied curriculum intact.</p>
          </div>

          <div className="ara-mint-curriculum__level-tabs" role="tablist" aria-label="Mint curriculum levels">
            {levels.map((level, i) => {
              const id = String(level.id);
              const selected = id === activeId;
              return (
                <button
                  key={id}
                  type="button"
                  className={`ara-mint-curriculum__level-tab${selected ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(id)}
                >
                  <span className="ara-mint-curriculum__metal-plate" aria-hidden="true">
                    <span className="ara-mint-curriculum__metal-inner">
                      <small>LEVEL</small>
                      <strong>{String(level.number || i + 1)}</strong>
                      <em>{String(level.metal || "")}</em>
                      <img src={assets.markTransparent} alt="" width={250} height={251} />
                    </span>
                  </span>
                  <span className="ara-mint-curriculum__level-tab-copy">
                    <small>{String(level.status || "")}</small>
                    <strong>{String(level.title || "")}</strong>
                    <span>{String(level.subtitle || "")}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ara-mint-curriculum__tools">
          <div className="ara-mint-curriculum__filters" role="group" aria-label="Filter curriculum by business function">
            {[
              ["all", "ALL", "36 CONCEPTS"],
              ["raise", "RAISE", "CAPITAL"],
              ["build", "BUILD", "PRODUCT"],
              ["sell", "SELL", "CUSTOMER"],
              ["grow", "GROW", "TEAM"],
              ["allocate", "ALLOCATE", "CAPITAL"],
              ["defend", "DEFEND", "ADVANTAGE"],
            ].map(([id, label, sub]) => (
              <button
                key={id}
                type="button"
                className={domain === id ? "is-active" : undefined}
                aria-pressed={domain === id}
                onClick={() => setDomain(id)}
              >
                <span>{label}</span>
                <small>{sub}</small>
              </button>
            ))}
          </div>

          <label className="ara-mint-curriculum__search">
            <span>{String(settings.search_label || "FIND A BOOK")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={String(settings.search_placeholder || "")}
            />
            <small>{String(settings.search_note || "")}</small>
          </label>
        </section>

        {active ? (
          <section className="ara-mint-curriculum__panel">
            <div className="ara-mint-curriculum__panel-head">
              <span>{String(active.metal)}</span>
              <h2>
                {String(active.number)} · {String(active.title)}
              </h2>
              <p>{String(active.subtitle)}</p>
            </div>
            <div className="ara-mint-curriculum__concept-grid">
              {filteredConcepts.map((c) => (
                <article key={c.domain} className="ara-mint-curriculum__concept" data-domain={c.domain}>
                  <span>{c.label}</span>
                  <h3>{String(active[c.title] || "")}</h3>
                  <p>{String(active[c.text] || "")}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="ara-mint-curriculum__matrix">
          <div className="ara-mint-curriculum__section-heading">
            <div>
              <span>THE WHOLE MAP</span>
              <h2>{String(settings.matrix_heading || "The whole map")}</h2>
            </div>
            <p>{String(settings.matrix_description || "")}</p>
          </div>
          <div className="ara-mint-curriculum__matrix-table" role="table">
            <div className="ara-mint-curriculum__matrix-row ara-mint-curriculum__matrix-row--head" role="row">
              <span>LEVEL</span>
              {CONCEPTS.map((c) => (
                <span key={c.domain}>{c.label}</span>
              ))}
            </div>
            {levels.map((level) => (
              <div key={String(level.id)} className="ara-mint-curriculum__matrix-row" role="row">
                <strong>
                  {String(level.number)} · {String(level.metal)}
                </strong>
                {CONCEPTS.map((c) => (
                  <span key={c.domain}>{String(level[c.title] || "")}</span>
                ))}
              </div>
            ))}
          </div>
          <p className="ara-mint-curriculum__matrix-footer">{String(settings.matrix_footer || "")}</p>
        </section>
      </div>
    </section>
    <MintMarketMaps />
    </>
  );
}
