"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { homeContent } from "@/data/home";
import { appHref, assets } from "@/lib/assets";
import { stripHtml } from "@/lib/format";

// "write it 100 times" assignment — the second half of each line changes.
const STAKE_LINES = [
  "what they own",
  "how it works",
  "what that's worth",
  "what to do with it",
  "what it's made of",
  "why it grows",
  "how to read it",
  "what stands behind it",
  "what they're holding",
  "what a stake is",
];

export function HomeHero() {
  const hero = homeContent.hero as Record<string, unknown>;
  const blocks = (homeContent.hero.blocks || []) as unknown as Array<Record<string, string>>;
  const news = blocks.filter((b) => b.type === "market_news");
  const items = blocks.filter((b) => b.type === "market_item");

  // Market snapshot as a slideshow carousel (pages of tiles that auto-advance).
  const marketTiles = useMemo(
    () => [
      ...news.map((b) => ({
        id: b.id,
        name: b.market_name,
        front: b.headline,
        value: b.market_value,
        change: b.change,
        direction: b.direction,
      })),
      ...items.map((b) => ({
        id: b.id,
        name: b.market_name,
        front: "Tap for today’s level",
        value: b.market_value,
        change: b.change,
        direction: b.direction,
      })),
    ],
    [news, items],
  );
  const [dateLabel, setDateLabel] = useState("");
  const [highlightWord, setHighlightWord] = useState("read");
  const [outgoingWord, setOutgoingWord] = useState<string | null>(null);
  const [highlightMinWidth, setHighlightMinWidth] = useState<number | undefined>(undefined);

  // market snapshot box toggles between snapshot and ad — click-only, no auto-cycle
  const [mktView, setMktView] = useState(0);

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  const style = {
    ["--ara-hero-bg" as string]: String(hero.background_color || "#f2fbf7"),
    ["--ara-hero-text" as string]: String(hero.text_color || "#161b2e"),
    ["--ara-hero-muted" as string]: String(hero.muted_text_color || "#646575"),
    ["--ara-hero-accent" as string]: String(hero.accent_color || "#176d5c"),
    ["--ara-hero-gold" as string]: String(hero.gold_color || "#b88332"),
    ["--ara-hero-border" as string]: String(hero.border_color || "#c9bea8"),
    ["--ara-hero-panel" as string]: String(hero.panel_color || "#f6fcf9"),
    ["--ara-hero-deep-bg" as string]: String(hero.deep_background_color || "#e4f5ed"),
    ["--ara-hero-blue" as string]: String(hero.blue_color || "#3a5be0"),
    ["--ara-hero-blue-deep" as string]: String(hero.blue_deep_color || "#22389a"),
    ["--ara-hero-line" as string]: String(hero.line_color || "#70bfa1"),
    ["--ara-hero-overlay" as string]: String(Number(hero.overlay_strength || 60) / 100),
    ["--ara-hero-max" as string]: String(hero.max_width || "1700px"),
    ["--ara-hero-min-height" as string]: `${hero.minimum_height || 760}px`,
    ["--ara-hero-padding-top" as string]: `${hero.padding_top || 70}px`,
    ["--ara-hero-padding-bottom" as string]: `${hero.padding_bottom || 70}px`,
    ["--ara-hero-image-position" as string]: String(hero.image_position || "82% center"),
    ["--ara-hero-mobile-image-position" as string]: String(hero.mobile_image_position || "82% center"),
    ["--ara-hero-mobile-min-height" as string]: `${hero.mobile_minimum_height || 820}px`,
    ["--ara-hero-eyebrow-size" as string]: `${hero.desktop_eyebrow_size || 15}px`,
    ["--ara-hero-heading-size" as string]: `${hero.desktop_heading_size || 88}px`,
    ["--ara-hero-description-size" as string]: `${hero.desktop_description_size || 16}px`,
    ["--ara-hero-button-size" as string]: `${hero.desktop_button_size || 12}px`,
    ["--ara-hero-folio-size" as string]: `${hero.desktop_folio_size || 8}px`,
    ["--ara-hero-market-heading-size" as string]: `${hero.desktop_market_heading_size || 10}px`,
    ["--ara-hero-market-item-size" as string]: `${hero.desktop_market_item_size || 9}px`,
    ["--ara-hero-market-note-size" as string]: `${hero.desktop_market_note_size || 9}px`,
    ["--ara-hero-mobile-eyebrow-size" as string]: `${hero.mobile_eyebrow_size || 10}px`,
    ["--ara-hero-mobile-heading-size" as string]: `${hero.mobile_heading_size || 56}px`,
    ["--ara-hero-mobile-description-size" as string]: `${hero.mobile_description_size || 14}px`,
    ["--ara-hero-mobile-button-size" as string]: `${hero.mobile_button_size || 10}px`,
    ["--ara-hero-mobile-folio-size" as string]: `${hero.mobile_folio_size || 8}px`,
    ["--ara-hero-mobile-market-heading-size" as string]: `${hero.mobile_market_heading_size || 10}px`,
    ["--ara-hero-mobile-market-item-size" as string]: `${hero.mobile_market_item_size || 9}px`,
    ["--ara-hero-mobile-market-note-size" as string]: `${hero.mobile_market_note_size || 9}px`,
  };

  // Live theme wraps "read" in `.mm-hl` (neon marker), then cycles words.
  const headingParts = useMemo(() => {
    const raw = String(hero.heading || "");
    const match = raw.match(/\bread\b/i);
    if (!match || match.index === undefined) {
      return { before: raw, after: "", original: "read", hasHighlight: false };
    }
    return {
      before: raw.slice(0, match.index),
      after: raw.slice(match.index + match[0].length),
      original: match[0],
      hasHighlight: true,
    };
  }, [hero.heading]);

  useEffect(() => {
    if (!headingParts.hasHighlight) return;
    setHighlightWord(headingParts.original);
  }, [headingParts.hasHighlight, headingParts.original]);

  useEffect(() => {
    if (!headingParts.hasHighlight) return;
    const seq = ["learn", "invest", "grow", "create", headingParts.original];
    const host = document.querySelector(".ara-mintmark-hero .ara-mintmark-hero__heading");
    if (!host) return;

    // Lock the plate to the widest word so "here" never shifts or resizes.
    // Measure with the real (loaded) heading font, not the fallback.
    const measureWidest = () => {
      const measure = document.createElement("span");
      measure.style.cssText =
        "position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;font:inherit;";
      host.appendChild(measure);
      let max = 0;
      for (const word of seq) {
        measure.textContent = word;
        max = Math.max(max, measure.offsetWidth);
      }
      host.removeChild(measure);
      if (max > 0) setHighlightMinWidth(Math.ceil(max) + 4);
    };
    measureWidest();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(measureWidest).catch(() => {});

    // Cycle through the words exactly once on landing, then stop on the real word.
    let ix = 0;
    let current = headingParts.original;
    const swapTimers: number[] = [];
    const iv = window.setInterval(() => {
      if (ix >= seq.length) {
        window.clearInterval(iv);
        setOutgoingWord(null);
        return;
      }
      const next = seq[ix];
      ix += 1;
      setOutgoingWord(current);
      setHighlightWord(next);
      current = next;
      const t = window.setTimeout(() => {
        setOutgoingWord(null);
      }, 480);
      swapTimers.push(t);
    }, 2400);

    return () => {
      window.clearInterval(iv);
      for (const t of swapTimers) window.clearTimeout(t);
    };
  }, [headingParts.hasHighlight, headingParts.original]);

  const primaryHref = appHref(String(hero.primary_button_link || "")) || "/bookshelf";
  const secondaryHref = appHref(String(hero.secondary_button_link || "")) || "/mint";

  const renderHeadingLines = (text: string) =>
    text.split("\n").map((line, i, arr) => (
      <span key={`${line}-${i}`}>
        {line}
        {i < arr.length - 1 ? <br /> : null}
      </span>
    ));

  return (
    <section className="ara-mintmark-hero" style={style}>
      <div className="ara-mintmark-hero__media">
        <picture>
          <img
            className="ara-mintmark-hero__background-image"
            src={assets.heroBooks}
            alt=""
            width={2000}
            height={1200}
            fetchPriority="high"
          />
        </picture>
      </div>
      <div className="ara-mintmark-hero__paper-lines" aria-hidden="true" />
      <div className="ara-mintmark-hero__overlay" aria-hidden="true" />

      <div className="ara-mintmark-hero__inner">
        <div className="ara-mintmark-hero__content-frame">
          <div className="ara-mintmark-hero__content">
            <div className="ara-mintmark-hero__meta">
              {hero.eyebrow ? <p className="ara-mintmark-hero__eyebrow">{String(hero.eyebrow)}</p> : null}
              {hero.folio_text ? (
                <span className="ara-mintmark-hero__folio">{String(hero.folio_text)}</span>
              ) : null}
            </div>

            <h1 className="ara-mintmark-hero__heading">
              {headingParts.hasHighlight ? (
                <>
                  {renderHeadingLines(headingParts.before)}
                  <mark>
                    <span
                      className="mm-hl"
                      style={
                        highlightMinWidth
                          ? { minWidth: highlightMinWidth, textAlign: "center" as const }
                          : undefined
                      }
                    >
                      <span className="mm-hl__clip">
                        {outgoingWord ? (
                          <span className="mm-hl__word mm-hl__word--out" aria-hidden="true">
                            {outgoingWord}
                          </span>
                        ) : null}
                        <span
                          key={highlightWord}
                          className={`mm-hl__word${outgoingWord ? " mm-hl__word--in" : ""}`}
                        >
                          {highlightWord}
                        </span>
                      </span>
                    </span>
                  </mark>
                  {renderHeadingLines(headingParts.after)}
                </>
              ) : (
                renderHeadingLines(String(hero.heading || ""))
              )}
            </h1>

            {hero.description ? (
              <div className="ara-mintmark-hero__description">
                <p>{stripHtml(String(hero.description))}</p>
              </div>
            ) : null}

            <div className="ara-mintmark-hero__buttons">
              {hero.primary_button_label ? (
                <Link className="ara-mintmark-hero__button ara-mintmark-hero__button--primary" href={primaryHref}>
                  {String(hero.primary_button_label)}
                </Link>
              ) : null}
              {hero.secondary_button_label ? (
                <Link className="ara-mintmark-hero__button ara-mintmark-hero__button--secondary" href={secondaryHref}>
                  {String(hero.secondary_button_label)}
                </Link>
              ) : null}
            </div>

            {hero.bottom_note ? (
              <span className="ara-mintmark-hero__bottom-note">{String(hero.bottom_note)}</span>
            ) : null}
          </div>
        </div>

        {hero.show_market_snapshot ? (
          <div className="ara-mintmark-hero__market-frame">
            <aside className="ara-mintmark-hero__market">
              {mktView === 0 ? (
                <>
                  <div className="ara-mintmark-hero__market-head">
                    <div>
                      <span>{String(hero.market_heading || "MARKET SNAPSHOT")}</span>
                      <small>{dateLabel}</small>
                    </div>
                  </div>

                  <div className="ara-mintmark-hero__market-tiles">
                    {marketTiles.map((block) => (
                      <div key={block.id} className="ara-mintmark-hero__mtile" tabIndex={0}>
                        <div className="ara-mintmark-hero__mtile-inner">
                          <div className="ara-mintmark-hero__mtile-face ara-mintmark-hero__mtile-front">
                            <strong>{block.name}</strong>
                            <p>{block.front}</p>
                          </div>
                          <div className="ara-mintmark-hero__mtile-face ara-mintmark-hero__mtile-back">
                            <span className="ara-mintmark-hero__mtile-name">{block.name}</span>
                            <span className="ara-mintmark-hero__mtile-val">{block.value}</span>
                            <em className={`ara-mintmark-hero__market-change ara-mintmark-hero__market-change--${block.direction}`}>
                              {block.direction === "up" ? "+" : block.direction === "down" ? "−" : ""}
                              {block.change}
                            </em>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : mktView === 1 ? (
                <div className="ara-mintmark-hero__market-ad ara-mintmark-hero__market-ad--usa">
                  <img className="ara-mintmark-hero__market-ad-mark" src={assets.markApp} alt="" aria-hidden="true" width={200} height={200} />
                  <span className="ara-mintmark-hero__market-ad-eyebrow">Trump Accounts</span>
                  <h3 className="ara-mintmark-hero__market-ad-headline">
                    Does your child know what&rsquo;s in his <em>Trump Account?</em>
                  </h3>
                  <div className="ara-mintmark-hero__market-ad-top">
                    <img
                      className="ara-mintmark-hero__market-ad-logo"
                      src={assets.logo}
                      alt="Mintmark"
                      width={620}
                      height={140}
                    />
                  </div>
                  <p className="ara-mintmark-hero__market-ad-tagline">Mint your child&rsquo;s future.</p>
                  <p className="ara-mintmark-hero__market-ad-body">A platform for young readers with big ideas.</p>
                  <Link className="ara-mintmark-hero__market-ad-cta" href="/mission">
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : (
                <div className="ara-mintmark-hero__market-ad ara-mintmark-hero__market-ad--usa ara-mintmark-hero__market-ad--lines">
                  <div className="ara-mintmark-hero__lines-sheet">
                    {STAKE_LINES.map((end, i) => (
                      <p key={i} className="ara-mintmark-hero__lines-row">
                        Every child should have a stake in America. Every child should know{" "}
                        <mark className="ara-mintmark-hero__lines-hl">{end}</mark>.
                      </p>
                    ))}
                  </div>
                  <div className="ara-mintmark-hero__market-ad-top">
                    <img
                      className="ara-mintmark-hero__market-ad-logo"
                      src={assets.logo}
                      alt="Mintmark"
                      width={620}
                      height={140}
                    />
                  </div>
                  <p className="ara-mintmark-hero__market-ad-tagline">Every child should know what they own.</p>
                  <Link className="ara-mintmark-hero__market-ad-cta" href="/mission">
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}

              <div className="ara-mintmark-hero__market-toggle" role="tablist" aria-label="Snapshot / ad">
                <button
                  type="button"
                  className={`ara-mintmark-hero__market-tdot${mktView === 0 ? " is-on" : ""}`}
                  aria-label="Market snapshot"
                  aria-selected={mktView === 0}
                  onClick={() => setMktView(0)}
                />
                <button
                  type="button"
                  className={`ara-mintmark-hero__market-tdot${mktView === 1 ? " is-on" : ""}`}
                  aria-label="Trump Accounts ad"
                  aria-selected={mktView === 1}
                  onClick={() => setMktView(1)}
                />
                <button
                  type="button"
                  className={`ara-mintmark-hero__market-tdot${mktView === 2 ? " is-on" : ""}`}
                  aria-label="The assignment ad"
                  aria-selected={mktView === 2}
                  onClick={() => setMktView(2)}
                />
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </section>
  );
}
