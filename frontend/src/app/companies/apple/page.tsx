"use client";

import Link from "next/link";
import { useState } from "react";
import { appleContent } from "@/data/apple";
import { stripHtml } from "@/lib/format";
import { useCart } from "@/lib/cart";

type Block = Record<string, string>;

// Apple-specific leadership + HQ (catalog is focused on Apple)
const LEADERSHIP = { ceo: "Tim Cook", hq: "Apple Park · Cupertino, USA", founded: "1976 · California", city: "Cupertino, California" };

function HqMap() {
  return (
    <svg viewBox="0 0 340 240" width="100%" height="100%" className="cm-hq__svg">
      <defs>
        <radialGradient id="cmMapBg" cx="30%" cy="20%" r="90%">
          <stop offset="0" stopColor="#efe7d3" />
          <stop offset="1" stopColor="#e3d8bf" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="340" height="240" rx="16" fill="url(#cmMapBg)" />
      {/* graticule */}
      {[40, 80, 120, 160, 200].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="340" y2={y} stroke="#c9bea8" strokeOpacity="0.7" strokeWidth="1" />
      ))}
      {[50, 100, 150, 200, 250, 300].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="240" stroke="#c9bea8" strokeOpacity="0.7" strokeWidth="1" />
      ))}
      {/* abstract west-coast landmass — site map land tone */}
      <path
        d="M40 60 C70 55 96 74 110 96 C120 112 108 138 120 158 C132 178 120 206 96 214 L40 214 Z"
        fill="#e7dcc6" stroke="#b7ab90" strokeOpacity="0.9" strokeWidth="1.2"
      />
      {/* the HQ pin */}
      <g className="cm-hq__pin" transform="translate(96 150)">
        <circle className="cm-hq__pin-halo" r="22" fill="#e0a526" fillOpacity="0.28" />
        <path d="M0 -22 C11 -22 18 -14 18 -5 C18 6 4 14 0 22 C-4 14 -18 6 -18 -5 C-18 -14 -11 -22 0 -22 Z" fill="#e0a526" stroke="#161b2e" strokeWidth="1.4" />
        <circle cy="-5" r="5" fill="#fffdf6" />
      </g>
      <text x="118" y="150" className="cm-hq__pin-label" fill="#161b2e">Cupertino</text>
    </svg>
  );
}

export default function AppleCompanyPage() {
  const hero = appleContent.apple_company_hero;
  const overview = appleContent.apple_company_overview;
  const stories = appleContent.apple_company_stories;
  const h = hero.settings as unknown as Record<string, string>;
  const o = overview.settings as unknown as Record<string, string>;
  const stats = (hero.blocks as unknown as Block[]).filter((b) => b.type === "stat");
  const steps = (overview.blocks as unknown as Block[]).filter((b) => b.type === "model_step");
  const storyList = (stories?.blocks as unknown as Block[])?.filter((b) => b.type === "story") || [];

  // organize tagged stories by content (category) — newsroom style
  const storyGroups = Object.values(
    storyList.reduce((acc, st) => {
      const cat = (st.category || "Stories").toUpperCase();
      (acc[cat] = acc[cat] || { cat, items: [] as Block[] }).items.push(st);
      return acc;
    }, {} as Record<string, { cat: string; items: Block[] }>),
  );

  const facts = [
    { label: o.fact_one_label, value: o.fact_one_value, note: o.fact_one_note },
    { label: o.fact_two_label, value: o.fact_two_value, note: o.fact_two_note },
    { label: o.fact_three_label, value: o.fact_three_value, note: o.fact_three_note },
    { label: o.fact_four_label, value: o.fact_four_value, note: o.fact_four_note },
  ];

  const price = Number(String(h.digest_price || "").replace(/[^0-9.]/g, "")) || 24;
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const onAdd = () => {
    addItem({ id: "digest-apple", title: h.digest_title || "The Apple Digest", price, company: "Apple" });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <main className="cm">
      {/* ===== hero ===== */}
      <section className="cm-hero">
        <span className="cm-hero__trim" aria-hidden="true" />
        <div className="cm-hero__inner">
          <span className="cm-kicker">Mintmark · Profile</span>
          <div className="cm-hero__title-row">
            <h1 className="cm-hero__name">{h.company_name}</h1>
            <span className="cm-hero__tk">{h.ticker}</span>
          </div>
          <p className="cm-hero__subtitle">{h.subtitle}</p>
          <div className="cm-hero__meta">
            {h.sector ? <span>{h.sector}</span> : null}
            {h.location ? <span>{h.location}</span> : null}
          </div>
          {h.summary ? <p className="cm-hero__summary">{stripHtml(h.summary)}</p> : null}
          <div className="cm-hero__cta">
            <a className="cm-btn cm-btn--gold" href="#cm-digest">Get the digest · ${price}</a>
            <a className="cm-btn cm-btn--ghost" href="#cm-stories">Read the stories</a>
          </div>
          <div className="cm-stats">
            {stats.map((s, i) => (
              <div className="cm-stat" key={i}>
                <span className="cm-stat__label">{s.label}</span>
                <strong className="cm-stat__value">{s.value}</strong>
                {s.note ? <span className="cm-stat__note">{s.note}</span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== what it does ===== */}
      <section className="cm-sec cm-sec--light">
        <div className="cm-sec__inner">
          <span className="cm-kicker cm-kicker--dark">{o.eyebrow || "What it does"}</span>
          <h2 className="cm-h2">What {h.company_name} actually does.</h2>
          {o.overview_text ? <p className="cm-lede">{stripHtml(o.overview_text)}</p> : null}
          <div className="cm-facts">
            {facts.map((f, i) => (
              <div className="cm-fact" key={i}>
                <span className="cm-fact__label">{f.label}</span>
                <strong className="cm-fact__value">{f.value}</strong>
                <span className="cm-fact__note">{f.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== headquarters & leadership ===== */}
      <section className="cm-sec cm-sec--light">
        <div className="cm-sec__inner cm-hq">
          <div className="cm-hq__map">
            <HqMap />
          </div>
          <div className="cm-hq__info">
            <span className="cm-kicker cm-kicker--dark">Headquarters &amp; leadership</span>
            <h2 className="cm-h2">{LEADERSHIP.city}.</h2>
            <div className="cm-hq__rows">
              <div className="cm-hq__row">
                <span>Headquarters</span>
                <strong>{LEADERSHIP.hq}</strong>
              </div>
              <div className="cm-hq__row">
                <span>Chief executive</span>
                <strong>{LEADERSHIP.ceo}</strong>
              </div>
              <div className="cm-hq__row">
                <span>Founded</span>
                <strong>{LEADERSHIP.founded}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== how the business works ===== */}
      <section className="cm-sec cm-sec--navy">
        <span className="cm-hero__trim" aria-hidden="true" />
        <div className="cm-sec__inner">
          <span className="cm-kicker">{o.model_note || "The value loop"}</span>
          <h2 className="cm-h2 cm-h2--mint">How the business works.</h2>
          <div className="cm-flow">
            {steps.map((s, i) => (
              <div className="cm-step" key={i}>
                <span className="cm-step__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="cm-step__kicker">{s.kicker}</span>
                <strong className="cm-step__title">{s.title}</strong>
                <p className="cm-step__text">{s.text}</p>
                {s.metric_value ? (
                  <span className="cm-step__metric">
                    <i>{s.metric_label}</i> {s.metric_value}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {o.model_summary ? <p className="cm-flow__summary">{o.model_summary}</p> : null}
        </div>
      </section>

      {/* ===== the digest — add to cart ===== */}
      <section className="cm-sec cm-sec--light" id="cm-digest">
        <div className="cm-sec__inner cm-digest">
          <div className="cm-digest__cover" aria-hidden="true">
            <span className="cm-digest__cover-tag">{h.digest_eyebrow || "The physical digest"}</span>
            <span className="cm-digest__cover-name">{h.company_name}</span>
            <span className="cm-digest__cover-foot">Mintmark</span>
          </div>
          <div className="cm-digest__body">
            <span className="cm-kicker cm-kicker--dark">{h.digest_eyebrow || "The physical digest"}</span>
            <h2 className="cm-h2">{h.digest_title}</h2>
            <p className="cm-lede">{h.digest_text}</p>
            <div className="cm-digest__buy">
              <span className="cm-digest__price">${price}</span>
              <button type="button" className="cm-btn cm-btn--gold" onClick={onAdd}>
                {added ? "Added to cart ✓" : "Add to cart"}
              </button>
              <Link className="cm-btn cm-btn--ghost cm-btn--ghost-dark" href="/cart">
                View cart
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== stories — every tagged story, organized by content ===== */}
      <section className="cm-sec cm-sec--light" id="cm-stories">
        <div className="cm-sec__inner">
          <span className="cm-kicker cm-kicker--dark">Stories</span>
          <h2 className="cm-h2">The {h.company_name} stories.</h2>
          <p className="cm-lede">Every story tagged to {h.company_name}, organized by what it covers.</p>

          {storyGroups.map((g) => (
            <div className="cm-storygroup" key={g.cat}>
              <div className="cm-storygroup__head">
                <strong>{g.cat}</strong>
                <small>
                  {String(g.items.length).padStart(2, "0")} · tagged
                </small>
              </div>
              <div className="cm-stories">
                {g.items.map((st, i) => (
                  <article className="cm-story" key={i}>
                    <span className="cm-story__cat">{st.category}</span>
                    <strong className="cm-story__title">{st.custom_title}</strong>
                    <p className="cm-story__excerpt">{st.custom_excerpt}</p>
                    <span className="cm-story__date">{st.custom_date}</span>
                  </article>
                ))}
              </div>
            </div>
          ))}

          <div className="cm-stories__actions">
            <Link className="cm-btn cm-btn--ghost cm-btn--ghost-dark" href="/mint">
              See all tagged stories →
            </Link>
            <a className="cm-btn cm-btn--gold" href="#cm-digest">
              Add the digest to cart
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
