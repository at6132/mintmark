export const metadata = { title: "Mission" };

// A clean, on-brand template scaffold — placeholder copy ready to fill in.
const SECTIONS = [
  { kicker: "01 · Who we are", heading: "[ Company, in one line ]", lead: "[ A single sentence that says what Mintmark is and who it's for. ]" },
  { kicker: "02 · What we do", heading: "[ What we make ]", lead: "[ Two or three plain sentences describing the product and how it works. ]" },
  { kicker: "03 · Why it matters", heading: "[ The problem we solve ]", lead: "[ Say the gap in the world and why it's worth closing. ]" },
  { kicker: "04 · How we do it", heading: "[ Our approach ]", lead: "[ The method, the principles, the way we work. ]" },
  { kicker: "05 · Where we're going", heading: "[ The vision ]", lead: "[ Where this leads in five years. ]" },
];

export default function MissionPage() {
  return (
    <section className="mm-mission">
      <div className="mm-mission__inner">
        <header className="mm-mission__masthead">
          <span className="mm-mission__eyebrow">Mission</span>
          <h1 className="mm-mission__title">[ Our mission ]</h1>
          <p className="mm-mission__standfirst">
            [ One paragraph, plain words: the reason this company exists. Replace this text. ]
          </p>
        </header>

        <div className="mm-mission__body">
          {SECTIONS.map((s) => (
            <article key={s.kicker} className="mm-mission__block">
              <span className="mm-mission__kicker">{s.kicker}</span>
              <h2 className="mm-mission__heading">{s.heading}</h2>
              <p className="mm-mission__lead">{s.lead}</p>
              <p className="mm-mission__fill" data-placeholder="Body copy">
                [ Fill in the details here. This block is ready for your words — a paragraph or two,
                plain language, no jargon. ]
              </p>
            </article>
          ))}
        </div>

        <footer className="mm-mission__signoff">
          <span>Big ideas for small readers.</span>
          <em>mintmark</em>
        </footer>
      </div>
    </section>
  );
}
