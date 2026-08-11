import Link from "next/link";
import { appleContent } from "@/data/apple";
import { assets } from "@/lib/assets";
import { stripHtml } from "@/lib/format";

export const metadata = {
  title: "Apple Company File",
};

export default function AppleCompanyPage() {
  const hero = appleContent.apple_company_hero;
  const overview = appleContent.apple_company_overview;
  const stats = hero?.blocks?.filter((b) => b.type === "stat") || [];
  const modelSteps = overview?.blocks || [];
  const s = hero.settings;

  const style = {
    ["--ara-company-bg" as string]: s.background_color || "#F5EFE1",
    ["--ara-company-paper" as string]: s.paper_color || "#F3ECDC",
    ["--ara-company-text" as string]: s.text_color || "#161B2E",
    ["--ara-company-muted" as string]: s.muted_text_color || "#646575",
    ["--ara-company-mint" as string]: s.mint_color || "#A6DECB",
    ["--ara-company-gold" as string]: s.gold_color || "#E0A526",
    ["--ara-company-blue" as string]: s.blue_color || "#274B44",
    ["--ara-company-blue-deep" as string]: s.blue_deep_color || "#161B2E",
    ["--ara-company-border" as string]: s.border_color || "#C9BEA8",
    ["--ara-company-max" as string]: s.max_width || "1600px",
    ["--ara-company-top" as string]: `${s.padding_top || 80}px`,
    ["--ara-company-bottom" as string]: `${s.padding_bottom || 80}px`,
    ["--ara-company-title-desktop" as string]: `${s.desktop_title_size || 82}px`,
    ["--ara-company-subtitle-desktop" as string]: `${s.desktop_subtitle_size || 40}px`,
    ["--ara-company-body-desktop" as string]: `${s.desktop_body_size || 16}px`,
    ["--ara-company-label-desktop" as string]: `${s.desktop_label_size || 9}px`,
    ["--ara-company-stat-desktop" as string]: `${s.desktop_stat_size || 24}px`,
    ["--ara-company-digest-title-desktop" as string]: `${s.desktop_digest_title_size || 31}px`,
    ["--ara-company-title-mobile" as string]: `${s.mobile_title_size || 52}px`,
    ["--ara-company-subtitle-mobile" as string]: `${s.mobile_subtitle_size || 32}px`,
    ["--ara-company-body-mobile" as string]: `${s.mobile_body_size || 15}px`,
    ["--ara-company-label-mobile" as string]: `${s.mobile_label_size || 9}px`,
    ["--ara-company-stat-mobile" as string]: `${s.mobile_stat_size || 22}px`,
    ["--ara-company-digest-title-mobile" as string]: `${s.mobile_digest_title_size || 27}px`,
  };

  return (
    <>
      <section className="ara-company-hero" style={style}>
        <div className="ara-company-hero__lines" aria-hidden="true" />
        <div className="ara-company-hero__inner">
          <div className="ara-company-hero__brand-masthead">
            <img
              className="ara-company-hero__brand-wordmark"
              src={assets.wordmarkInk}
              alt="Mintmark"
              width={488}
              height={88}
            />
            <span>MINTMARK · COMPANY FILE</span>
            <img
              className="ara-company-hero__brand-mark"
              src={assets.markApp}
              alt=""
              width={285}
              height={285}
            />
          </div>

          <div className="ara-company-hero__frame">
            <div className="ara-company-hero__panel">
              <div className="ara-company-hero__content">
                <div className="ara-company-hero__topline">
                  {s.eyebrow ? <span className="ara-company-hero__eyebrow">{s.eyebrow}</span> : null}
                  {s.folio ? <span className="ara-company-hero__folio">{s.folio}</span> : null}
                </div>

                <div className="ara-company-hero__identity">
                  <div className="ara-company-hero__logo-wrap">
                    <img
                      className="ara-company-hero__logo"
                      src={assets.appleLogo}
                      alt="Apple"
                      width={120}
                      height={120}
                    />
                  </div>
                  <div>
                    <h1 className="ara-company-hero__title">{s.company_name}</h1>
                    <div className="ara-company-hero__identity-meta">
                      {s.ticker ? <span>{s.ticker}</span> : null}
                      {s.sector ? <span>{s.sector}</span> : null}
                      {s.location ? <span>{s.location}</span> : null}
                    </div>
                  </div>
                </div>

                {s.subtitle ? <h2 className="ara-company-hero__subtitle">{s.subtitle}</h2> : null}
                {s.summary ? (
                  <div className="ara-company-hero__summary">
                    <p>{stripHtml(s.summary)}</p>
                  </div>
                ) : null}

                {stats.length > 0 ? (
                  <div className="ara-company-hero__stats">
                    {stats.map((stat) => (
                      <div key={stat.id} className="ara-company-hero__stat">
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                        {stat.note ? <small>{stat.note}</small> : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="ara-company-hero__buttons">
                  {s.primary_button_label ? (
                    <a className="ara-company-hero__button ara-company-hero__button--primary" href="#overview">
                      {s.primary_button_label}
                    </a>
                  ) : null}
                  {s.secondary_button_label ? (
                    <a className="ara-company-hero__button ara-company-hero__button--secondary" href="#stories">
                      {s.secondary_button_label}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="ara-company-hero__visual-column">
                <div className="ara-company-hero__visual-frame">
                  <img
                    className="ara-company-hero__image"
                    src={assets.appleHero}
                    alt=""
                    width={1400}
                    height={1000}
                  />
                  {s.image_label ? (
                    <span className="ara-company-hero__image-label">{s.image_label}</span>
                  ) : null}
                </div>

                <aside className="ara-company-hero__digest">
                  <div className="ara-company-hero__digest-top">
                    <span>{s.digest_eyebrow}</span>
                    <small>PRINT</small>
                  </div>
                  <div className="ara-company-hero__digest-body">
                    <div className="ara-company-hero__digest-cover">
                      <img src={assets.appleDigestCover} alt="" width={400} height={520} />
                    </div>
                    <div>
                      <h3>{s.digest_title}</h3>
                      <p className="ara-company-hero__digest-price">{s.digest_price}</p>
                      <p>{s.digest_text}</p>
                      <Link className="ara-company-hero__digest-link" href="/shop">
                        {s.digest_button_label}
                      </Link>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      {overview ? (
        <section id="overview" className="page-section cream">
          <div className="shell">
            <p className="eyebrow">BUSINESS MODEL</p>
            <h2 style={{ fontFamily: "var(--font-heading-family)", fontSize: "clamp(32px,5vw,48px)", margin: "8px 0 20px" }}>
              {overview.settings.heading || "How the machine works"}
            </h2>
            <div className="model-grid">
              {modelSteps.map((step) => (
                <article key={step.id} className={`model-card model-card--${step.style || "cream"}`}>
                  <span>{step.kicker}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {step.metric_value ? (
                    <div style={{ marginTop: 12, fontFamily: "var(--font-body-family)", fontSize: 11, fontWeight: 800 }}>
                      {step.metric_label}: {step.metric_value}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="stories" className="page-section">
        <div className="shell">
          <p className="eyebrow">CONTINUE</p>
          <h2 style={{ fontFamily: "var(--font-heading-family)", fontSize: 36 }}>Related reading</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn btn-primary" href="/digests/nvidia">
              NVIDIA Digest
            </Link>
            <Link className="btn btn-secondary" href="/bookshelf">
              Back to Bookshelf
            </Link>
            <Link className="btn btn-secondary" href="/mint">
              The Mint curriculum
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
