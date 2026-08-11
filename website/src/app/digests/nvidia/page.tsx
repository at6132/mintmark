import Link from "next/link";
import { nvidiaContent } from "@/data/nvidia";

export const metadata = {
  title: "NVIDIA Digest",
};

export default function NvidiaDigestPage() {
  const main = nvidiaContent.main;
  const settings = main.settings;
  const blocks = main.blocks;

  return (
    <section className="page-section cream">
      <div className="shell article-layout">
        <div className="article-body">
          <p className="eyebrow">COMPANY DIGEST</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,6vw,64px)", margin: "8px 0" }}>
            NVIDIA: The Factory of Intelligence
          </h1>
          <p style={{ color: "var(--muted)", fontFamily: "var(--font-ui)", fontSize: 12, letterSpacing: "0.1em" }}>
            {settings.reading_time} · {settings.intro_note_label}
          </p>
          <p style={{ marginTop: 16 }}>{settings.intro_note}</p>

          {blocks.map((block) => {
            if (block.type === "pull_quote") {
              return (
                <blockquote key={block.id} className="pull-quote">
                  “{block.quote}”
                  <cite>{block.source}</cite>
                </blockquote>
              );
            }
            if (block.type === "key_point") {
              return (
                <div key={block.id} className={`key-point key-point--${block.style || "mint"}`}>
                  <span>{block.label}</span>
                  <h3>{block.heading}</h3>
                  <p>{block.text}</p>
                </div>
              );
            }
            return null;
          })}

          <div style={{ marginTop: 28 }}>
            <Link className="btn btn-secondary" href="/companies">
              More companies
            </Link>
          </div>
        </div>

        <aside className="company-card-rail">
          <p className="eyebrow">{settings.company_card_label}</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 34, margin: "8px 0" }}>
            {settings.company_name}
          </h2>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>
            {settings.company_card_note}
          </p>
          <p style={{ marginTop: 12, color: "var(--muted)" }}>{settings.company_summary}</p>
          <Link className="btn btn-mint" href="/shop" style={{ marginTop: 16, width: "100%" }}>
            VIEW DIGEST IN SHOP
          </Link>
        </aside>
      </div>
    </section>
  );
}
