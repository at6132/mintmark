"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { homeContent } from "@/data/home";
import { stripHtml } from "@/lib/format";

export function HomeHero() {
  const hero = homeContent.hero;
  const news = hero.blocks.filter((b) => b.type === "market_news");
  const items = hero.blocks.filter((b) => b.type === "market_item");
  const [dateLabel, setDateLabel] = useState("");
  const [flipIndex, setFlipIndex] = useState(0);

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const id = window.setInterval(() => {
      setFlipIndex((i) => (i + 1) % news.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [news.length]);

  const headingHtml = useMemo(() => {
    const safe = hero.heading
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>")
      .replace(/\bread\b/i, "<mark>read</mark>");
    return safe;
  }, [hero.heading]);

  return (
    <section className="hero">
      <div className="hero__media" aria-hidden>
        <div className="hero__columns" />
        <div className="hero__books">
          {["APPLE", "COSTCO", "NVIDIA", "AMAZON", "NIKE"].map((label) => (
            <div key={label} className="hero-book">
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero__paper-lines" aria-hidden />
      <div className="hero__overlay" aria-hidden />

      <div className="hero__inner">
        <div>
          <div className="hero__meta">
            <p className="hero__eyebrow">{hero.eyebrow}</p>
            <span className="hero__folio">{hero.folio_text}</span>
          </div>
          <h1 className="hero__heading" dangerouslySetInnerHTML={{ __html: headingHtml }} />
          <div className="hero__description">
            <p>{stripHtml(hero.description)}</p>
          </div>
          <div className="hero__buttons">
            <Link className="btn btn-primary" href={hero.primary_button_link || "/bookshelf"}>
              {hero.primary_button_label}
            </Link>
            <Link className="btn btn-secondary" href={hero.secondary_button_link || "/mint"}>
              {hero.secondary_button_label}
            </Link>
          </div>
          <span className="hero__bottom-note">{hero.bottom_note}</span>
        </div>

        {hero.show_market_snapshot ? (
          <aside className="hero__market" aria-label="Market snapshot">
            <div className="hero__market-head">
              <div>
                <span>{hero.market_heading}</span>
                <small>{dateLabel}</small>
              </div>
              <span className="hero__market-badge">{hero.market_badge}</span>
            </div>

            <div className="hero__market-news">
              {news.map((block, i) => (
                <div
                  key={block.id}
                  className={`market-news-strip${i === flipIndex ? " is-flipped" : ""}`}
                >
                  <div className="market-news-strip__inner">
                    <div className="market-news-strip__face">
                      <strong>{block.market_name}</strong>
                      <p>{block.headline}</p>
                    </div>
                    <div className="market-news-strip__face market-news-strip__back">
                      <strong>{block.market_name}</strong>
                      <span>{block.market_value}</span>
                      <em className={block.direction === "up" ? "change-up" : "change-down"}>
                        {block.direction === "up" ? "▲" : "▼"} {block.change}
                      </em>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hero__market-list">
              {items.map((block) => (
                <div key={block.id} className="market-item">
                  <div>
                    <strong>{block.market_name}</strong>
                    <span>{block.market_value}</span>
                  </div>
                  <em className={block.direction === "up" ? "change-up" : "change-down"}>
                    {block.direction === "up" ? "▲" : "▼"} {block.change}
                  </em>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
