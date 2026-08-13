export const metadata = { title: "Mission" };

// Box 1 is THE mission. 2 -> 3 -> 4 are how we deliver it, in sequence.
const MISSION = {
  n: "01",
  accent: "#176d5c",
  kicker: "Our mission",
  title: "Empower the next generation of capitalists and stakeholders",
  body: "Complex business and finance, made digestible, understandable, and compounding.",
};

const PILLARS = [
  {
    n: "02",
    accent: "#3a5be0",
    kicker: "The feed",
    title: "Financial news, published daily",
    body: "Mintmark doesn't tell you what happened. It teaches you what, how, and why — in a way anyone can understand.",
  },
  {
    n: "03",
    accent: "#e0a526",
    kicker: "The digest",
    title: "Quarterly digests",
    body: "One company, one quarter, one digest. Your child can finally enjoy — and actually understand — what they own and how it works.",
  },
  {
    n: "04",
    accent: "#161b2e",
    kicker: "The compounding",
    title: "Mint your future",
    body: "Keep what you understand and build on it. Mintmark tracks micro-lessons across its proprietary curriculum, so you own what you know — and build a financial future you can compound.",
  },
];

export default function MissionPage() {
  return (
    <section className="mm-mission">
      <span className="mm-mission__sheen" aria-hidden="true" />
      <span className="mm-mission__orb mm-mission__orb--a" aria-hidden="true" />
      <span className="mm-mission__orb mm-mission__orb--b" aria-hidden="true" />

      <div className="mm-mission__inner">
        <header className="mm-mission__masthead">
          <span className="mm-mission__wordmark">mintmark</span>
          <span className="mm-mission__eyebrow">Big ideas for small readers</span>
          <h1 className="mm-mission__title">
            We <em>mint</em> the next generation of capitalists &amp; stakeholders.
          </h1>
        </header>

        {/* 01 — THE mission (full width, distinct) */}
        <article
          className="mm-mission__hero"
          style={{ ["--acc" as string]: MISSION.accent, animationDelay: "0ms" }}
        >
          <span className="mm-mission__card-glow" aria-hidden="true" />
          <div className="mm-mission__card-top">
            <span className="mm-mission__n">{MISSION.n}</span>
            <span className="mm-mission__badge">The mission</span>
          </div>
          <h2 className="mm-mission__hero-title">{MISSION.title}</h2>
          <p className="mm-mission__hero-body">{MISSION.body}</p>
        </article>

        <div className="mm-mission__flow" aria-hidden="true">
          <span>How we deliver it</span>
          <i />
          <b>02</b>
          <i />
          <b>03</b>
          <i />
          <b>04</b>
        </div>

        {/* 02 -> 03 -> 04 — the pillars, in sequence */}
        <div className="mm-mission__grid">
          {PILLARS.map((p, i) => (
            <article
              key={p.n}
              className="mm-mission__card"
              style={{ ["--acc" as string]: p.accent, animationDelay: `${120 + i * 110}ms` }}
            >
              <span className="mm-mission__card-glow" aria-hidden="true" />
              <div className="mm-mission__card-top">
                <span className="mm-mission__n">{p.n}</span>
                <span className="mm-mission__kicker">{p.kicker}</span>
              </div>
              <h2 className="mm-mission__card-title">{p.title}</h2>
              <p className="mm-mission__card-body">{p.body}</p>
              {i < PILLARS.length - 1 ? <span className="mm-mission__arrow" aria-hidden="true">→</span> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
