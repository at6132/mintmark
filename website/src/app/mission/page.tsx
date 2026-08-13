export const metadata = { title: "Mission" };

// Numbered 1 -> 2 -> 3. News before digest.
const PILLARS = [
  {
    n: "1",
    accent: "#3a5be0",
    title: "Financial news, published daily",
    body: "Mintmark doesn't tell you what happened. It teaches you what, how, and why — in a way anyone can understand.",
  },
  {
    n: "2",
    accent: "#e0a526",
    title: "Quarterly digests",
    body: "One company, one quarter, one digest. Your child can finally enjoy — and actually understand — what they own and how it works.",
  },
  {
    n: "3",
    accent: "#176d5c",
    title: "Mint your future",
    body: "Keep what you understand and build on it. Mintmark tracks micro-lessons across its curriculum, so you own what you know — and build a financial future you can compound.",
  },
];

export default function MissionPage() {
  return (
    <section className="mm-mission">
      <span className="mm-mission__sheen" aria-hidden="true" />
      <span className="mm-mission__orb mm-mission__orb--a" aria-hidden="true" />
      <span className="mm-mission__orb mm-mission__orb--b" aria-hidden="true" />

      <div className="mm-mission__inner">
        {/* one mission piece: wordmark + statement, merged */}
        <header className="mm-mission__masthead">
          <span className="mm-mission__wordmark">mintmark</span>
          <span className="mm-mission__eyebrow">Our mission</span>
          <h1 className="mm-mission__statement">
            Empower the next generation of capitalists &amp; stakeholders.
          </h1>
          <p className="mm-mission__sub">
            Complex business and finance, made digestible, understandable, and compounding.
          </p>
        </header>

        <div className="mm-mission__grid">
          {PILLARS.map((p) => (
            <article key={p.n} className="mm-mission__card" style={{ ["--acc" as string]: p.accent }}>
              <span className="mm-mission__card-glow" aria-hidden="true" />
              <span className="mm-mission__n">{p.n}</span>
              <h2 className="mm-mission__card-title">{p.title}</h2>
              <p className="mm-mission__card-body">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
