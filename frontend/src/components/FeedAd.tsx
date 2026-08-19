"use client";

import Link from "next/link";
import { assets } from "@/lib/assets";

const AD_METALS = ["#7fd9c4", "#e0a526", "#3a5be0", "#4fa98f", "#c9a24a", "#82ddc7"];
const AD_PT_SYM: Record<string, string> = { "0-0": "H", "8-0": "He", "0-3": "Au", "3-4": "Ag", "6-4": "Cu" };

/** The periodic table from the homepage's right-landing ad. */
export function AdPeriodicTable() {
  const rows = [
    [0, 8],
    [0, 1, 4, 5, 6, 7, 8],
    [0, 1, 4, 5, 6, 7, 8],
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  ];
  const CW = 15;
  const GAP = 2.6;
  const cells: Array<{ c: number; r: number }> = [];
  rows.forEach((cols, r) => cols.forEach((c) => cells.push({ c, r })));
  const w = 9 * (CW + GAP);
  const h = 5 * (CW + GAP);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" aria-hidden="true">
      {cells.map((cell, i) => {
        const x = cell.c * (CW + GAP);
        const y = cell.r * (CW + GAP);
        const co = AD_METALS[(cell.c + cell.r) % AD_METALS.length];
        const key = `${cell.c}-${cell.r}`;
        return (
          <g key={i}>
            <rect x={x} y={y} width={CW} height={CW} rx="2" fill={co} fillOpacity="0.85" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
            {AD_PT_SYM[key] ? (
              <text x={x + CW / 2} y={y + CW / 2 + 3} textAnchor="middle" fontFamily="var(--font-space-grotesk), sans-serif" fontWeight="800" fontSize="8" fill="#0c1020">
                {AD_PT_SYM[key]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** The current house ad — the same creative that runs on the homepage. */
export function FeedAd() {
  return (
    <aside className="mm-feedad" aria-label="Mintmark advertisement">
      <span className="mm-feedad__flag">Advertisement</span>
      <div className="mm-feedad__body">
        <div className="mm-feedad__copy">
          <span className="mm-feedad__eyebrow">The mintmark method</span>
          <h4 className="mm-feedad__headline">
            The <em>building blocks</em> of financial literacy.
          </h4>
          <p className="mm-feedad__text">
            Mintmark content contains the building blocks of financial literacy — to power your
            child&rsquo;s future.
          </p>
          <img className="mm-feedad__logo" src={assets.logo} alt="Mintmark" width={620} height={140} />
          <Link className="mm-feedad__cta" href="/mission">
            Learn more <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="mm-feedad__table">
          <AdPeriodicTable />
        </div>
      </div>
    </aside>
  );
}
