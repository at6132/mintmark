import Link from "next/link";
import { missionContent } from "@/data/mission";
import { stripHtml } from "@/lib/format";

export const metadata = {
  title: "Mission",
};

export default function MissionPage() {
  const { settings, chapters } = missionContent;

  return (
    <section className="mission page-section">
      <div className="shell">
        <div className="mission__intro">
          <p className="eyebrow">{settings.eyebrow}</p>
          <h1>
            {settings.heading_primary}{" "}
            <span className="mission__accent">{settings.heading_accent}</span>
          </h1>
          <p className="lede">{stripHtml(settings.intro_text)}</p>
        </div>

        <div className="chapters">
          {chapters.map((ch) => (
            <article key={ch.id} className="chapter">
              <div>
                <h2>{ch.heading}</h2>
                <p>{stripHtml(ch.text)}</p>
              </div>
              {ch.show_graphic ? (
                <div className="chapter-graphic" aria-hidden>
                  <span>{String(ch.graphic_style || "story").toUpperCase()}</span>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mission-cta">
          <p className="eyebrow">{settings.cta_eyebrow}</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,40px)", margin: "10px 0" }}>
            {settings.cta_heading}
          </h2>
          <p style={{ color: "#c9d0dc", maxWidth: "48ch" }}>{settings.cta_text}</p>
          <Link className="btn btn-mint" href="/companies" style={{ marginTop: 18 }}>
            {settings.cta_button_label}
          </Link>
        </div>
      </div>
    </section>
  );
}
