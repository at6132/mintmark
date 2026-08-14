"use client";

import { Fragment, useEffect, useRef, useState, type MouseEvent } from "react";

type Kind = "news" | "digest" | "mint";

const STEPS: Array<{
  key: Kind;
  tag: string;
  accent: string;
  title: string;
  line: string;
}> = [
  { key: "news", tag: "Every day", accent: "#3a5be0", title: "Financial news", line: "Explained — not just reported." },
  { key: "digest", tag: "Every quarter", accent: "#e0a526", title: "Quarterly digests", line: "One company, one read." },
  { key: "mint", tag: "Every child", accent: "#176d5c", title: "Mint your future", line: "Own what you understand." },
];

const MINT_METALS = ["#c47a34", "#c9a24a", "#a06a34", "#4fa98f", "#c3c7d0", "#d8b23f"];
// a few cells carry a symbol, like a real periodic tile
const MINT_SYMBOLS: Record<number, string> = { 0: "Ra", 3: " Au", 6: "Ag", 9: "Cu", 12: "Zn", 16: "Sn" };

function NewsGfx() {
  return (
    <div className="mm-gfx mm-gfx--news" aria-hidden="true">
      <div className="mm-gfx__paper">
        <span className="mm-gfx__topline">
          <span className="mm-gfx__masthead">THE DAILY</span>
          <span className="mm-gfx__live"><i />LIVE</span>
        </span>
        <span className="mm-gfx__hl" />
        <span className="mm-gfx__line mm-gfx__line--1" />
        <span className="mm-gfx__line mm-gfx__line--2" />
        <span className="mm-gfx__line mm-gfx__line--3" />
        <div className="mm-gfx__bars">
          <i style={{ ["--h" as string]: "60%" }} />
          <i style={{ ["--h" as string]: "82%" }} />
          <i style={{ ["--h" as string]: "48%" }} />
          <i style={{ ["--h" as string]: "94%" }} />
          <i style={{ ["--h" as string]: "70%" }} />
          <i style={{ ["--h" as string]: "88%" }} />
        </div>
      </div>
      <div className="mm-gfx__ticker">
        <span>NASDAQ ▲ &nbsp;·&nbsp; S&amp;P 500 ▲ &nbsp;·&nbsp; 10Y ▼ &nbsp;·&nbsp; GOLD ▲ &nbsp;·&nbsp; OIL ▼ &nbsp;·&nbsp; </span>
        <span>NASDAQ ▲ &nbsp;·&nbsp; S&amp;P 500 ▲ &nbsp;·&nbsp; 10Y ▼ &nbsp;·&nbsp; GOLD ▲ &nbsp;·&nbsp; OIL ▼ &nbsp;·&nbsp; </span>
      </div>
    </div>
  );
}

function DigestGfx() {
  return (
    <div className="mm-gfx mm-gfx--digest" aria-hidden="true">
      <div className="mm-gfx__book">
        <span className="mm-gfx__leaf mm-gfx__leaf--r" />
        <span className="mm-gfx__leaf mm-gfx__leaf--l" />
        <span className="mm-gfx__cover">
          <span className="mm-gfx__cover-tag">Q3</span>
          <span className="mm-gfx__cover-title">Digest</span>
          <span className="mm-gfx__cover-shine" />
        </span>
      </div>
      <div className="mm-gfx__dots">
        {Array.from({ length: 6 }).map((_, i) => (
          <i key={i} style={{ ["--i" as string]: i }} />
        ))}
      </div>
    </div>
  );
}

function MintGfx() {
  const cells = Array.from({ length: 21 });
  return (
    <div className="mm-gfx mm-gfx--mint" aria-hidden="true">
      <div className="mm-gfx__grid">
        {cells.map((_, i) => (
          <span
            key={i}
            className="mm-gfx__cell"
            style={{ ["--co" as string]: MINT_METALS[i % MINT_METALS.length], ["--i" as string]: i }}
          >
            {MINT_SYMBOLS[i] ? <b>{MINT_SYMBOLS[i]}</b> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MissionFlow() {
  const [open, setOpen] = useState<Kind | null>(null);
  const boxRefs = useRef<Record<string, HTMLElement | null>>({});

  // bring the freshly opened box into view
  useEffect(() => {
    if (!open) return;
    const el = boxRefs.current[open];
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 260);
    return () => clearTimeout(t);
  }, [open]);

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="mm-flow">
      {STEPS.map((s, i) => {
        const isOpen = open === s.key;
        return (
          <Fragment key={s.key}>
            <article
              ref={(el) => {
                boxRefs.current[s.key] = el;
              }}
              className={`mm-flow__box${isOpen ? " is-open" : ""}`}
              style={{ ["--acc" as string]: s.accent, ["--d" as string]: `${0.2 + i * 0.16}s` }}
              onMouseMove={handleMove}
            >
              <span className="mm-flow__spot" aria-hidden="true" />
              <button
                type="button"
                className="mm-flow__head"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : s.key)}
              >
                <span className="mm-flow__box-glow" aria-hidden="true" />
                <span className="mm-flow__tag">
                  <i className="mm-flow__tag-dot" aria-hidden="true" />
                  {s.tag}
                </span>
                <span className="mm-flow__box-title">{s.title}</span>
                <span className="mm-flow__box-line">{s.line}</span>
                <span className="mm-flow__chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>

              <div className="mm-flow__panel">
                <div className="mm-flow__panel-in">
                  {s.key === "news" ? <NewsGfx /> : s.key === "digest" ? <DigestGfx /> : <MintGfx />}
                </div>
              </div>
            </article>

            {i < STEPS.length - 1 && (
              <span className="mm-flow__link" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
