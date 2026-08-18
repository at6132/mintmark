import { assets } from "@/lib/assets";
import { MissionFlow } from "@/components/MissionFlow";

const WORDS: Array<{ t: string; em?: boolean }> = [
  { t: "Introducing" },
  { t: "Mintmark", em: true },
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
            <p className="mm-lead__intro">
              A finance education media platform{" "}
              <span className="mm-lead__gold">empowering</span> the next generation of{" "}
              <span className="mm-lead__mint">capitalists</span>.
            </p>
            <p className="mm-lead__statement">
              We <em className="mm-lead__mint">believe</em> every{" "}
              <em className="mm-lead__gold">American child</em> should{" "}
              <em className="mm-lead__mintlite">participate</em> in the{" "}
              <em className="mm-lead__gold">American Dream</em>.{" "}
              <em className="mm-lead__mintlite">Markets</em> are a place where you can{" "}
              <em className="mm-lead__mintlite">individually</em> choose to{" "}
              <em className="mm-lead__mint">believe</em> in a{" "}
              <em className="mm-lead__mintlite">collective</em> idea. Before{" "}
              <em className="mm-lead__mint">belief</em> comes{" "}
              <em className="mm-lead__gold">explanation</em>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== three vertical slides — one per pillar ===== */}
      <MissionFlow />
    </div>
  );
}
