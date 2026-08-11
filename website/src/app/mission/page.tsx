import Link from "next/link";
import { missionContent } from "@/data/mission";
import { assets } from "@/lib/assets";
import { stripHtml } from "@/lib/format";

export const metadata = {
  title: "Mission",
};

type Chapter = {
  id: string;
  heading?: string;
  text?: string;
  highlight?: string;
  show_graphic?: boolean;
  graphic_style?: string;
};

export default function MissionPage() {
  const settings = missionContent.settings as Record<string, unknown>;
  const chapters = missionContent.chapters as Chapter[];

  const style = {
    ["--ara-mission-bg" as string]: String(settings.background_color || "#F5EFE1"),
    ["--ara-mission-paper" as string]: String(settings.paper_color || "#F3ECDC"),
    ["--ara-mission-ink" as string]: String(settings.text_color || "#161B2E"),
    ["--ara-mission-muted" as string]: String(settings.muted_text_color || "#646575"),
    ["--ara-mission-mint" as string]: String(settings.mint_color || "#A6DECB"),
    ["--ara-mission-gold" as string]: String(settings.gold_color || "#E0A526"),
    ["--ara-mission-navy" as string]: String(settings.navy_color || "#161B2E"),
    ["--ara-mission-border" as string]: String(settings.border_color || "#C9BEA8"),
    ["--ara-mission-line" as string]: String(settings.line_color || "#A6DECB"),
    ["--ara-mission-max" as string]: String(settings.max_width || "1500px"),
    ["--ara-mission-reading" as string]: String(settings.reading_width || "980px"),
    ["--ara-mission-top" as string]: `${settings.padding_top || 75}px`,
    ["--ara-mission-bottom" as string]: `${settings.padding_bottom || 100}px`,
    ["--ara-mission-heading-desktop" as string]: `${settings.desktop_heading_size || 72}px`,
    ["--ara-mission-body-desktop" as string]: `${settings.desktop_body_size || 18}px`,
    ["--ara-mission-chapter-desktop" as string]: `${settings.desktop_chapter_size || 32}px`,
    ["--ara-mission-label-desktop" as string]: `${settings.desktop_label_size || 10}px`,
    ["--ara-mission-heading-mobile" as string]: `${settings.mobile_heading_size || 42}px`,
    ["--ara-mission-body-mobile" as string]: `${settings.mobile_body_size || 16}px`,
    ["--ara-mission-chapter-mobile" as string]: `${settings.mobile_chapter_size || 26}px`,
    ["--ara-mission-label-mobile" as string]: `${settings.mobile_label_size || 9}px`,
  };

  return (
    <section className="ara-mission-story ara-mission" style={style}>
      <div className="ara-mission__rules" aria-hidden="true" />
      <div className="ara-mission__inner">
        <div className="ara-mission__masthead">
          <img src={assets.wordmarkMint} alt="Mintmark" width={488} height={88} />
          <div>
            <span>MISSION</span>
            <small>WHY MINTMARK EXISTS</small>
          </div>
          <img src={assets.mintEmblem} alt="" width={270} height={183} />
        </div>

        <header className="ara-mission__hero">
          <div className="ara-mission__hero-copy">
            <div className="ara-mission__folio">
              <span>MINTMARK · MISSION</span>
              <span>ONE COMPANY AT A TIME</span>
            </div>
            {settings.eyebrow ? <p className="ara-mission__eyebrow">{String(settings.eyebrow)}</p> : null}
            <h1>
              {settings.heading_primary ? <span>{String(settings.heading_primary)}</span> : null}{" "}
              {settings.heading_accent ? <em>{String(settings.heading_accent)}</em> : null}
            </h1>
            {settings.intro_text ? (
              <div className="ara-mission__intro">
                <p>{stripHtml(String(settings.intro_text))}</p>
              </div>
            ) : null}
            <div className="ara-mission__hero-rule" aria-hidden="true">
              <i />
              <span />
            </div>
          </div>

          <div className="ara-mission__hero-graphic">
            <div className="ara-mission__graphic-frame">
              <div className="ara-mission__graphic-head">
                <span>THE MINTMARK</span>
                <small>AUTHENTICATING UNDERSTANDING</small>
              </div>
              <img
                src={assets.markTransparent}
                className="ara-mission__hero-mark"
                alt="Mintmark M mark"
                width={250}
                height={251}
              />
              <img
                src={assets.mintEmblem}
                className="ara-mission__hero-building"
                alt="The Mint emblem"
                width={270}
                height={183}
              />
              <div className="ara-mission__graphic-caption">
                REAL COMPANY STORIES · CLEAR FINANCIAL UNDERSTANDING
              </div>
            </div>
          </div>
        </header>

        <div className="ara-mission__chapters">
          {chapters.map((ch, index) => (
            <article key={ch.id} className="ara-mission__chapter">
              <div className="ara-mission__chapter-copy">
                <div className="ara-mission__chapter-meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>MISSION FILE</small>
                </div>
                {ch.heading ? <h2>{ch.heading}</h2> : null}
                {ch.text ? (
                  <div className="ara-mission__chapter-text">
                    <p>{stripHtml(ch.text)}</p>
                  </div>
                ) : null}
                {ch.highlight ? <p className="ara-mission__chapter-highlight">{ch.highlight}</p> : null}
              </div>

              {ch.show_graphic !== false ? (
                <div className={`ara-mission__chapter-art ara-mission__chapter-art--${ch.graphic_style || "books"}`}>
                  {ch.graphic_style === "progression" ? (
                    <div className="ara-mission__art-composition ara-mission__art-composition--coin">
                      <div className="ara-mission__art-kicker">THE COIN SYSTEM</div>
                      <div className="ara-mission__coin-layout">
                        <div className="ara-mission__coin-levels ara-mission__coin-levels--left" aria-hidden="true">
                          <span>COPPER</span>
                          <span>BRONZE</span>
                          <span>SILVER</span>
                        </div>
                        <div className="ara-mission__coin-object">
                          <img src={assets.companyCoinNvda} alt="Mintmark company coin sample" width={802} height={741} />
                        </div>
                        <div className="ara-mission__coin-levels ara-mission__coin-levels--right" aria-hidden="true">
                          <span>GOLD</span>
                          <span>AGED</span>
                          <span>PATINA</span>
                        </div>
                      </div>
                      <div className="ara-mission__art-footer">
                        <span>LEARN</span>
                        <i />
                        <span>UNDERSTAND</span>
                        <i />
                        <span>STRIKE</span>
                      </div>
                    </div>
                  ) : ch.graphic_style === "building" ? (
                    <div className="ara-mission__art-composition ara-mission__art-composition--mint">
                      <div className="ara-mission__art-kicker">THE MINT · CURRICULUM</div>
                      <div className="ara-mission__mint-object">
                        <span className="ara-mission__mint-rule ara-mission__mint-rule--one" aria-hidden="true" />
                        <span className="ara-mission__mint-rule ara-mission__mint-rule--two" aria-hidden="true" />
                        <img src={assets.mintEmblem} alt="The Mint emblem" width={270} height={183} />
                      </div>
                      <div className="ara-mission__art-footer">
                        <span>COMPANIES</span>
                        <i />
                        <span>MONEY</span>
                        <i />
                        <span>MARKETS</span>
                      </div>
                    </div>
                  ) : ch.graphic_style === "audience" ? (
                    <div className="ara-mission__art-composition ara-mission__art-composition--audience">
                      <div className="ara-mission__art-kicker">BUILT FOR CURIOUS READERS</div>
                      <div className="ara-mission__audience-main">
                        <div className="ara-mission__audience-mark">
                          <img src={assets.markTransparent} alt="Mintmark M mark" width={250} height={251} />
                        </div>
                        <div className="ara-mission__audience-age">
                          <strong>10+</strong>
                          <span>READERS</span>
                        </div>
                      </div>
                      <div className="ara-mission__audience-wordmark">
                        <span />
                        <img src={assets.wordmarkMint} alt="Mintmark" width={488} height={88} />
                        <span />
                      </div>
                      <div className="ara-mission__art-footer">
                        <span>REAL STORIES</span>
                        <i />
                        <span>CLEAR THINKING</span>
                      </div>
                    </div>
                  ) : (
                    <div className="ara-mission__art-composition ara-mission__art-composition--bookplate">
                      <div className="ara-mission__art-kicker">MINTMARK · COMPANY BOOKS</div>
                      <div className="ara-mission__bookplate-object">
                        <span className="ara-mission__bookplate-spine" aria-hidden="true" />
                        <img src={assets.bookplate} alt="Mintmark bookplate" width={535} height={325} />
                      </div>
                      <div className="ara-mission__art-footer">
                        <span>ONE REAL COMPANY</span>
                        <i />
                        <span>ONE VOLUME</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <section className="ara-mission__cta">
          <div className="ara-mission__cta-copy">
            {settings.cta_eyebrow ? <span>{String(settings.cta_eyebrow)}</span> : null}
            {settings.cta_heading ? <h2>{String(settings.cta_heading)}</h2> : null}
            {settings.cta_text ? <p>{String(settings.cta_text)}</p> : null}
          </div>
          <div className="ara-mission__cta-side">
            <img src={assets.wordmarkMint} alt="Mintmark" width={488} height={88} />
            {settings.cta_button_label ? (
              <Link href="/companies">
                {String(settings.cta_button_label)} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
