import { assets } from "@/lib/assets";
import { MissionFlow } from "@/components/MissionFlow";

const WORDS: Array<{ t: string; em?: boolean }> = [
  { t: "Empower" },
  { t: "the" },
  { t: "next" },
  { t: "generation" },
  { t: "of" },
  { t: "capitalists", em: true },
  { t: "&" },
  { t: "stakeholders.", em: true },
];

export function MissionSlides() {
  return (
    <div className="mm-slides">
      {/* ===== LEAD — the mission, written in on a matte mint sheet ===== */}
      <section className="mm-slide mm-slide--lead">
        <span className="mm-slide__lead-aura" aria-hidden="true" />
        <div className="mm-sheet">
          <div className="mm-slide__lead">
            <img className="mm-lead__mark" src={assets.mintEmblem} alt="Mintmark" width={270} height={183} />
            <span className="mm-slide__kicker">Our Mission</span>
            <h1 className="mm-write mm-write--type mm-slide__lead-title">
              {(() => {
                let n = 0;
                return WORDS.map((w, wi) => (
                  <span key={wi} className={`mm-write__w${w.em ? " is-em" : ""}`}>
                    {Array.from(w.t).map((ch, ci) => (
                      <span key={ci} className="mm-type__c" style={{ ["--n" as string]: n++ }}>
                        {ch}
                      </span>
                    ))}
                  </span>
                ));
              })()}
            </h1>
          </div>
        </div>
      </section>

      {/* ===== the three boxes ===== */}
      <section className="mm-slide mm-mission-boxes">
        <div className="mm-boxes-inner">
          <span className="mm-slide__kicker">Every day · Every quarter · Every child</span>
          <MissionFlow />
        </div>
      </section>
    </div>
  );
}
