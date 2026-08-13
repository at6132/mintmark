"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { homeContent } from "@/data/home";
import { appHref, assets } from "@/lib/assets";
import { stripHtml } from "@/lib/format";
import { HomeMarketMaps } from "@/components/HomeMarketMaps";

type Block = Record<string, string>;

export function HomeNewsroom() {
  const ed = homeContent.editorial as Record<string, unknown>;
  const blocks = (homeContent.editorial.blocks || []) as unknown as Block[];
  const marketNews = blocks.filter((b) => b.type === "market_news");
  const lead = blocks.find((b) => b.type === "lead_story");
  const featured = blocks.filter((b) => b.type === "featured_story");
  const question = blocks.find((b) => b.type === "question");
  const quads = blocks.filter((b) => b.type === "quick_take");
  const reports = blocks.filter((b) => b.type === "stock_report");

  const [dateLabel, setDateLabel] = useState("");
  const rootRef = useRef<HTMLElement | null>(null);

  // Featured carousel: the lead pitch + the featured stories, shuffled through.
  const featImg = (s: Block) => {
    const t = `${s.company || ""} ${s.ticker || ""} ${s.heading || ""}`;
    return /apple/i.test(t) ? assets.appleFeature : /costco/i.test(t) ? assets.costcoFeature : assets.nvdaLead;
  };
  const featSlides = useMemo(() => {
    const slides: Array<Record<string, string>> = [];
    if (lead)
      slides.push({
        key: "lead",
        story_type: lead.story_type || "",
        company: lead.company || "",
        ticker: lead.ticker || "",
        heading: lead.heading || "",
        body: lead.description || "",
        link: lead.link || "",
        link_label: lead.link_label || "READ THE PITCH",
        module_link: lead.company_module_link || "",
        module_label: lead.company_module_label || "OPEN COMPANY FILE",
        accent: lead.accent_color || "#176d5c",
        image: featImg(lead),
      });
    featured.forEach((f, i) =>
      slides.push({
        key: `f${i}`,
        story_type: f.story_type || "",
        company: f.company || "",
        ticker: f.ticker || "",
        heading: f.heading || "",
        body: f.summary || "",
        link: f.link || "",
        link_label: f.link_label || "READ",
        module_link: f.company_module_link || "",
        module_label: f.company_module_label || "COMPANY FILE",
        accent: f.accent_color || "#176d5c",
        image: featImg(f),
      }),
    );
    return slides;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, featured]);
  const [featIdx, setFeatIdx] = useState(0);
  useEffect(() => {
    if (featSlides.length < 2) return;
    const iv = window.setInterval(() => setFeatIdx((i) => (i + 1) % featSlides.length), 5200);
    return () => window.clearInterval(iv);
  }, [featSlides.length]);

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  // Shopify polish kit: staggered scroll reveal on cards + sections
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("is-animate");

    const sel =
      ".ara-editorial-front-page__lead, .ara-nr-strip, .ara-editorial-front-page__question," +
      ".ara-nr-sq, .ara-editorial-front-page__featured-story, .ara-nr-map__chip," +
      ".ara-editorial-front-page__section-heading";
    const targets = Array.from(root.querySelectorAll<HTMLElement>(sel));
    targets.forEach((el) => el.classList.add("ara-nr-reveal"));

    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    [".ara-nr-strip", ".ara-nr-band3 .ara-nr-sq", ".ara-nr-map__chip", ".ara-editorial-front-page__featured-story"].forEach(
      (g) => {
        Array.from(root.querySelectorAll<HTMLElement>(g)).forEach((el, i) => {
          el.style.transitionDelay = `${(i % 6) * 70}ms`;
          el.setAttribute("data-rd", String((i % 6) * 70));
        });
      },
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          el.style.transitionDelay = `${el.getAttribute("data-rd") || 0}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const style = {
    ["--ara-news-bg" as string]: String(ed.background_color || "#f2f8f6"),
    ["--ara-news-paper" as string]: String(ed.paper_color || "#f7fcfa"),
    ["--ara-news-text" as string]: String(ed.text_color || "#161b2e"),
    ["--ara-news-muted" as string]: String(ed.muted_text_color || "#646575"),
    ["--ara-news-mint" as string]: String(ed.mint_color || "#176d5c"),
    ["--ara-news-gold" as string]: String(ed.gold_color || "#e0a526"),
    ["--ara-news-blue" as string]: String(ed.blue_color || "#3a5be0"),
    ["--ara-news-border" as string]: String(ed.border_color || "#c9bea8"),
    ["--ara-news-line" as string]: String(ed.line_color || "#1fa88f"),
    ["--ara-news-rise" as string]: String(ed.rise_color || "#00c805"),
    ["--ara-news-fall" as string]: String(ed.fall_color || "#c93a32"),
    ["--ara-news-max" as string]: String(ed.max_width || "1700px"),
    ["--ara-news-top" as string]: `${ed.padding_top || 70}px`,
    ["--ara-news-bottom" as string]: `${ed.padding_bottom || 45}px`,
    ["--ara-news-lead-title" as string]: `${ed.desktop_main_title_size || 60}px`,
    ["--ara-news-feature-title" as string]: `${ed.desktop_side_title_size || 27}px`,
    ["--ara-news-row-title" as string]: `${ed.desktop_row_title_size || 26}px`,
    ["--ara-news-body" as string]: `${ed.desktop_body_size || 14}px`,
    ["--ara-news-label" as string]: `${ed.desktop_label_size || 10}px`,
    ["--ara-news-mobile-lead-title" as string]: `${ed.mobile_main_title_size || 44}px`,
    ["--ara-news-mobile-feature-title" as string]: `${ed.mobile_side_title_size || 26}px`,
    ["--ara-news-mobile-row-title" as string]: `${ed.mobile_row_title_size || 23}px`,
    ["--ara-news-mobile-body" as string]: `${ed.mobile_body_size || 14}px`,
    ["--ara-news-mobile-label" as string]: `${ed.mobile_label_size || 10}px`,
  };

  const tickerItems = [
    ...(lead
      ? [{ key: "lead", ticker: "LEAD", heading: lead.heading, link: lead.link }]
      : []),
    ...marketNews.map((m) => ({
      key: m.id,
      ticker: m.ticker,
      heading: m.heading,
      link: m.link,
    })),
  ];
  const tickerLoop = [...tickerItems, ...tickerItems];

  return (
    <section ref={rootRef} id="newsroom" className="ara-editorial-front-page" style={style}>
      <div className="ara-editorial-front-page__inner">
        <header className="ara-editorial-front-page__masthead">
          <div className="ara-editorial-front-page__edition">
            <span>{String(ed.edition_label || "MINTMARK DAILY")}</span>
            <span>{dateLabel}</span>
            <span>{String(ed.edition_note || "")}</span>
          </div>
          <div className="ara-editorial-front-page__title-row">
            <div>
              {ed.eyebrow ? <p className="ara-editorial-front-page__eyebrow">{String(ed.eyebrow)}</p> : null}
              {ed.heading ? <h2>{String(ed.heading)}</h2> : null}
            </div>
            {ed.header_note ? (
              <p className="ara-editorial-front-page__intro">{String(ed.header_note)}</p>
            ) : null}
          </div>
        </header>

        {ed.show_ticker !== false ? (
          <div
            className="ara-nr-ticker"
            style={{ ["--ara-ticker-speed" as string]: `${ed.ticker_speed || 45}s` }}
            role="marquee"
            aria-label="Latest headlines"
          >
            <div className="ara-nr-ticker__label">
              <span className="ara-nr-ticker__dot" aria-hidden="true" />
              {String(ed.ticker_label || "LATEST")}
            </div>
            <div className="ara-nr-ticker__win">
              <div className="ara-nr-ticker__track">
                <div className="ara-nr-ticker__set">
                  {tickerLoop.map((item, i) => (
                    <a
                      key={`${item.key}-${i}`}
                      className="ara-nr-ticker__item"
                      href={appHref(item.link) || "#"}
                    >
                      {item.ticker ? <b>{item.ticker}</b> : null}
                      <span>{item.heading}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <section className="ara-nr-band1">
          {featSlides.length ? (() => {
            const s = featSlides[Math.min(featIdx, featSlides.length - 1)];
            const href = appHref(s.link) || "/digests/nvidia";
            return (
              <article
                className="ara-editorial-front-page__lead ara-nr-hero ara-nr-feat"
                style={{ ["--ara-story-accent" as string]: s.accent || "#176d5c" }}
              >
                <a className="ara-editorial-front-page__lead-media" href={href}>
                  <picture>
                    <img
                      key={s.key}
                      className="ara-editorial-front-page__lead-image ara-nr-feat__img"
                      src={s.image}
                      alt={s.heading || s.company || "Featured"}
                      width={1200}
                      height={900}
                    />
                  </picture>
                  <span className="ara-editorial-front-page__lead-label">FEATURED</span>
                </a>

                <div className="ara-editorial-front-page__lead-copy">
                  <div className="ara-editorial-front-page__meta">
                    {s.story_type ? <span>{s.story_type}</span> : null}
                    {s.company ? <span>{s.company}</span> : null}
                    {s.ticker ? <span>{s.ticker}</span> : null}
                  </div>
                  {s.heading ? (
                    <h3 key={s.key} className="ara-nr-feat__heading">
                      <Link href={href}>{s.heading}</Link>
                    </h3>
                  ) : null}
                  {s.body ? <p className="ara-nr-feat__body">{stripHtml(s.body)}</p> : null}
                  <div className="ara-editorial-front-page__lead-links">
                    <Link href={href}>
                      {s.link_label || "READ"} <span aria-hidden="true">→</span>
                    </Link>
                    {s.module_link ? (
                      <Link href={appHref(s.module_link) || "/companies"}>{s.module_label}</Link>
                    ) : null}
                  </div>
                  {featSlides.length > 1 ? (
                    <div className="ara-nr-feat__dots" role="tablist" aria-label="Featured stories">
                      {featSlides.map((sl, i) => (
                        <button
                          key={sl.key}
                          type="button"
                          className={`ara-nr-feat__dot${i === featIdx ? " is-on" : ""}`}
                          aria-label={`Featured ${i + 1}`}
                          aria-selected={i === featIdx}
                          onClick={() => setFeatIdx(i)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })() : null}

          <div className="ara-nr-strips" style={{ ["--sec" as string]: "#176d5c" }}>
            <div className="ara-editorial-front-page__section-heading">
              <div>
                <h3>{String(ed.market_heading || "Market News")}</h3>
                <span>{String(ed.market_note || "LIVE")}</span>
              </div>
              <i />
            </div>
            {marketNews.slice(0, Number(ed.market_strip_count) || 8).map((m) => (
              <div key={m.id} className="ara-nr-flip ara-nr-strip">
                <div className="ara-nr-flip__inner">
                  <div className="ara-nr-flip__face ara-nr-flip__front">
                    <div className="ara-nr-strip__tick">
                      <b>{m.ticker}</b>
                      <small>{m.time_label}</small>
                    </div>
                    <h4>{m.heading}</h4>
                  </div>
                  <div className="ara-nr-flip__face ara-nr-flip__back">
                    <div className="ara-nr-strip__tick">
                      <b>{m.ticker}</b>
                    </div>
                    <p>{m.summary || "Tap to read the full story."}</p>
                    <a
                      className="ara-nr-strip__go"
                      href={appHref(m.link) || "#"}
                    >
                      Read <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ara-nr-band3">
          <div className="ara-nr-col ara-nr-col--short" style={{ ["--sec" as string]: "#c15a3c" }}>
            <div className="ara-editorial-front-page__section-heading">
              <div>
                <h3>{String(ed.quick_heading || "Short Takes")}</h3>
                <span>{String(ed.quick_note || "MARKET SNAPSHOTS")}</span>
              </div>
              <i />
            </div>
            <div className="ara-nr-sqgrid">
              {quads.slice(0, 8).map((q) => (
                <div key={q.id} className="ara-nr-flip ara-nr-sq">
                  <div className="ara-nr-flip__inner">
                    <div className="ara-nr-flip__face ara-nr-flip__front">
                      <div className="ara-nr-sq__num">
                        <span>{q.number}</span>
                        {q.ticker ? <b>{q.ticker}</b> : null}
                      </div>
                      {q.heading ? <h4>{q.heading}</h4> : null}
                      <div className="ara-nr-sq__foot">
                        {q.change ? (
                          <span className={`ara-nr-sq__chg ara-nr-sq__chg--${q.direction || "up"}`}>
                            {q.change}
                          </span>
                        ) : (
                          <span />
                        )}
                        {q.period ? <span>{q.period}</span> : <span />}
                      </div>
                    </div>
                    <div className="ara-nr-flip__face ara-nr-flip__back">
                      {q.summary ? <p>{q.summary}</p> : null}
                      <a className="ara-nr-sq__go" href={appHref(q.link) || "#"}>
                        Read <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ara-nr-col ara-nr-col--pitch" style={{ ["--sec" as string]: "#c0881e" }}>
            <div className="ara-editorial-front-page__section-heading">
              <div>
                <h3>{String(ed.reports_heading || "Company Pitches")}</h3>
                <span>{String(ed.reports_note || "IDEAS TO EXPLORE")}</span>
              </div>
              <i />
            </div>
            <div className="ara-nr-sqgrid">
              {reports.slice(0, 4).map((r, i) => (
                <div key={r.id} className="ara-nr-flip ara-nr-sq ara-nr-sq--pitch">
                  <div className="ara-nr-flip__inner">
                    <div className="ara-nr-flip__face ara-nr-flip__front">
                      <div className="ara-nr-sq__num">
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        {r.ticker ? <b>{r.ticker}</b> : null}
                      </div>
                      {r.heading ? <h4>{r.heading}</h4> : null}
                      <div className="ara-nr-sq__foot">
                        <span>Pitch</span>
                        <span>Tap</span>
                      </div>
                    </div>
                    <div className="ara-nr-flip__face ara-nr-flip__back">
                      {r.summary ? <p>{r.summary}</p> : null}
                      <a className="ara-nr-sq__go" href={appHref(r.link) || "#"}>
                        Read the pitch <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ara-nr-col ara-nr-col--heat" style={{ ["--sec" as string]: "#2f7e8c" }}>
            <div className="ara-editorial-front-page__section-heading">
              <div>
                <h3>{String(ed.heat_heading || "Market Maps")}</h3>
              </div>
              <i />
            </div>
            <HomeMarketMaps />
          </div>

          {question ? (
            <div className="ara-nr-col ara-nr-col--question">
              <article
                className="ara-editorial-front-page__question"
                style={{
                  ["--ara-question-bg" as string]: question.background_color || "#161b2e",
                  ["--ara-question-text" as string]: question.text_color || "#f2f8f6",
                  ["--ara-question-ratio" as string]: question.image_ratio || "16 / 10",
                }}
              >
                <div className="ara-editorial-front-page__question-copy">
                  <div className="ara-editorial-front-page__question-label">
                    <span>{question.label}</span>
                    <i />
                  </div>
                  <h3>{question.heading}</h3>
                  <p>{question.description}</p>
                  <Link
                    className="ara-editorial-front-page__question-link"
                    href={appHref(question.link) || "/bookshelf"}
                  >
                    {question.link_label || "EXPLORE THE QUESTION"} <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <a
                  className="ara-editorial-front-page__question-media"
                  href={appHref(question.link) || "/bookshelf"}
                  aria-label={question.link_label || "Explore the question"}
                >
                  <img
                    className="ara-editorial-front-page__question-image"
                    src={assets.questionCostco}
                    alt=""
                    width={1400}
                    height={1000}
                  />
                </a>
              </article>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
