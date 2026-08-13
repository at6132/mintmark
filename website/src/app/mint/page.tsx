export const metadata = { title: "The Mint" };

const FORCES = [
  { key: "raise", label: "Raise", color: "#3a5be0", sym: "Ra" },
  { key: "build", label: "Build", color: "#176d5c", sym: "Bu" },
  { key: "sell", label: "Sell", color: "#e0a526", sym: "Se" },
  { key: "grow", label: "Grow", color: "#5a9e3b", sym: "Gr" },
  { key: "allocate", label: "Allocate", color: "#9a5ba6", sym: "Al" },
  { key: "defend", label: "Defend", color: "#c25b3f", sym: "De" },
];

const LEVELS = [
  { roman: "I", metal: "Copper" },
  { roman: "II", metal: "Nickel" },
  { roman: "III", metal: "Brass" },
  { roman: "IV", metal: "Bronze" },
  { roman: "V", metal: "Silver" },
  { roman: "VI", metal: "Platinum" },
];

export default function MintPage() {
  return (
    <section className="mm-mint">
      <div className="mm-mint__inner">
        <header className="mm-mint__masthead">
          <span className="mm-mint__eyebrow">The Mint · The Curriculum</span>
          <h1 className="mm-mint__title">Six marks. Thirty-six concepts.</h1>
          <p className="mm-mint__standfirst">
            Every Mintmark company file is built on one curriculum: six forces that move any business,
            each learned across six levels — from Copper on Day One to Platinum in the corner office.
            Read down a column to go deeper in one force; read across a row to see how one level plays out
            everywhere. Strike all six and the mark mints.
          </p>
        </header>

        <div className="mm-mint__table" role="table" aria-label="Curriculum periodic table">
          <div className="mm-mint__row mm-mint__row--head" role="row">
            <span className="mm-mint__corner" role="columnheader" />
            {FORCES.map((f) => (
              <span key={f.key} className="mm-mint__force" role="columnheader" style={{ ["--f" as string]: f.color }}>
                {f.label}
              </span>
            ))}
          </div>

          {LEVELS.map((lv, r) => (
            <div key={lv.roman} className="mm-mint__row" role="row">
              <span className="mm-mint__level" role="rowheader">
                <b>{lv.roman}</b>
                <small>{lv.metal}</small>
              </span>
              {FORCES.map((f, c) => {
                const n = r * FORCES.length + c + 1;
                return (
                  <span key={f.key} className="mm-mint__el" role="cell" style={{ ["--f" as string]: f.color }}>
                    <em className="mm-mint__el-n">{n}</em>
                    <b className="mm-mint__el-sym">{f.sym}</b>
                    <small className="mm-mint__el-lv">{lv.roman}</small>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mm-mint__legend">
          {FORCES.map((f) => (
            <span key={f.key}>
              <i style={{ background: f.color }} />
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
