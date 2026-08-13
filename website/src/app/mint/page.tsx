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
        <header className="mm-mint__head">
          <h1 className="mm-mint__title">The Mint</h1>
          <span className="mm-mint__subhead">The Curriculum</span>
          <img className="mm-mint__mark" src={assets.markTransparent} alt="Mintmark" width={200} height={200} />
        </header>

        <div className="mm-mint__navybox">
          <p>
            Six metals. Six levels. Thirty-six concepts — the curriculum behind every Mintmark company
            file, struck one mark at a time.
          </p>
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
