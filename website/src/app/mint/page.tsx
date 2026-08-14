import { assets } from "@/lib/assets";

export const metadata = { title: "The Mint" };

const METALS = ["#c47a34", "#c9a24a", "#a06a34", "#4fa98f", "#c3c7d0", "#d8b23f"];

// classic periodic-table silhouette — empty squares, no labels
function buildCells() {
  const cells: Array<{ r: number; c: number; m: number }> = [];
  const add = (r: number, c: number) => cells.push({ r, c, m: (r + c) % METALS.length });
  add(1, 1);
  add(1, 18);
  for (const p of [2, 3]) {
    add(p, 1);
    add(p, 2);
    for (let g = 13; g <= 18; g++) add(p, g);
  }
  for (const p of [4, 5, 6, 7]) for (let g = 1; g <= 18; g++) add(p, g);
  for (const r of [9, 10]) for (let g = 3; g <= 17; g++) add(r, g);
  return cells;
}
const CELLS = buildCells();

export default function MintPage() {
  return (
    <section className="mm-mint">
      <span className="mm-mint__sheen" aria-hidden="true" />
      <span className="mm-mint__orb mm-mint__orb--a" aria-hidden="true" />
      <span className="mm-mint__orb mm-mint__orb--b" aria-hidden="true" />

      <div className="mm-mint__inner">
        <div className="mm-sheet mm-sheet--mint">
          <span className="mm-sheet__gloss" aria-hidden="true" />
          <span className="mm-sheet__pencil" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path d="M3 21l3.6-.8L20 6.8a2 2 0 0 0 0-2.8l-.9-.9a2 2 0 0 0-2.8 0L2.9 16.6 3 21z" fill="#f3c761" stroke="#8a6a1c" strokeWidth="1" strokeLinejoin="round" />
              <path d="M3 21l3.6-.8-2.8-2.8L3 21z" fill="#2a2a2a" />
            </svg>
          </span>
        <header className="mm-mint__head">
          <span className="mm-mint__subhead mm-write mm-write--sm">
            <span className="mm-write__w" style={{ ["--i" as string]: 0 }}>
              <span className="mm-write__in">Curriculum</span>
            </span>
          </span>
          <h1 className="mm-mint__title mm-write">
            <span className="mm-write__w" style={{ ["--i" as string]: 1 }}>
              <span className="mm-write__in">The</span>
            </span>
            <span className="mm-write__w is-em" style={{ ["--i" as string]: 2 }}>
              <span className="mm-write__in">Mint</span>
            </span>
            <span className="mm-write__cursor" aria-hidden="true" />
          </h1>
          <img className="mm-mint__mark" src={assets.mintEmblem} alt="Mintmark" width={270} height={183} />
        </header>

        {/* lessons — coming soon */}
        <div className="mm-mint__soon">
          <span className="mm-mint__soon-badge mm-write mm-write--sm">
            <span className="mm-mint__soon-dot" aria-hidden="true" />
            <span className="mm-write__w" style={{ ["--i" as string]: 4 }}>
              <span className="mm-write__in">coming soon</span>
            </span>
          </span>
        </div>
        </div>

        <div className="mm-mint__ptable" role="img" aria-label="Periodic table of the curriculum">
          {CELLS.map((cell, i) => (
            <span
              key={i}
              className="mm-mint__cell"
              style={{
                ["--r" as string]: cell.r,
                ["--c" as string]: cell.c,
                ["--co" as string]: METALS[cell.m],
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
