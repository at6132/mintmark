import Link from "next/link";
import { appleContent } from "@/data/apple";
import { stripHtml } from "@/lib/format";

export const metadata = {
  title: "Apple Company File",
};

export default function AppleCompanyPage() {
  const hero = appleContent.apple_company_hero;
  const overview = appleContent.apple_company_overview;
  const stats = hero?.blocks?.filter((b) => b.type === "stat") || [];
  const modelSteps = overview?.blocks || [];

  return (
    <>
      <section className="module-hero">
        <div className="shell module-hero__grid">
          <div>
            <p className="eyebrow">{hero.settings.eyebrow}</p>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, letterSpacing: "0.12em", color: "var(--muted)" }}>
              {hero.settings.folio} · {hero.settings.ticker} · {hero.settings.sector} · {hero.settings.location}
            </div>
            <h1>{hero.settings.company_name}</h1>
            <p className="module-hero__subtitle">{hero.settings.subtitle}</p>
            <p className="lede">{stripHtml(hero.settings.summary)}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <a className="btn btn-primary" href={hero.settings.primary_button_link || "#overview"}>
                {hero.settings.primary_button_label}
              </a>
              <a className="btn btn-secondary" href={hero.settings.secondary_button_link || "#stories"}>
                {hero.settings.secondary_button_label}
              </a>
            </div>
            <div className="stats">
              {stats.map((s) => (
                <div key={s.id} className="stat">
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                  <small>{s.note}</small>
                </div>
              ))}
            </div>
          </div>
          <div className="digest-card">
            <p className="eyebrow">{hero.settings.digest_eyebrow}</p>
            <div
              style={{
                height: 180,
                borderRadius: 12,
                margin: "12px 0",
                background: "linear-gradient(145deg,#54545C,#1c1c22)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-display)",
                fontSize: 28,
              }}
            >
              APPLE
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: "0 0 8px" }}>
              {hero.settings.digest_title}
            </h3>
            <p style={{ fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: 20 }}>{hero.settings.digest_price}</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{hero.settings.digest_text}</p>
            <Link className="btn btn-mint" href="/shop" style={{ marginTop: 14, width: "100%" }}>
              {hero.settings.digest_button_label}
            </Link>
          </div>
        </div>
      </section>

      {overview ? (
        <section id="overview" className="page-section cream">
          <div className="shell">
            <p className="eyebrow">BUSINESS MODEL</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,5vw,48px)", margin: "8px 0 20px" }}>
              {overview.settings.heading || "How the machine works"}
            </h2>
            <div className="model-grid">
              {modelSteps.map((step) => (
                <article key={step.id} className={`model-card model-card--${step.style || "cream"}`}>
                  <span>{step.kicker}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {step.metric_value ? (
                    <div style={{ marginTop: 12, fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 800 }}>
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36 }}>Related reading</h2>
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
