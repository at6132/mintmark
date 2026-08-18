import type { ReactNode } from "react";

type Company = {
  ticker: string;
  name: string;
  brand: string;
  brandOn: string;
  kicker: string;
  subtitle: string;
  art: ReactNode;
  chart: string;
  dots: Array<[number, number]>;
  chapterNum: string;
  chapterTitle: string;
  marks: string[];
  hereIndex: number;
  struckCount: number;
  price: string;
};

const COMPANIES: Company[] = [
  {
    ticker: "EXCO",
    name: "Example Co",
    brand: "#54545c",
    brandOn: "#f7f1e1",
    kicker: "LIVING COMPANY DNA",
    subtitle: "One line on how it makes money",
    chart: "M4,60 C40,58 70,54 100,56 C140,58 170,48 200,50 C240,52 270,44 300,46 C330,48 366,42 396,44",
    dots: [[100, 56], [200, 50], [300, 46]],
    chapterNum: "Chapter 1",
    chapterTitle: "The chapter hook",
    marks: ["E", "·", "·", "·", "·", "·", "·", "·"],
    hereIndex: 0,
    struckCount: 1,
    price: "$24.00",
    art: (
      <g transform="translate(150,150)" fill="none" stroke="#f7f1e1" strokeWidth="3">
        <rect x="-60" y="-60" width="120" height="120" rx="12" />
        <path d="M-30,20 L-10,-10 L10,15 L30,-25" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  },
];

function ChartMelt({ c }: { c: Company }) {
  return (
    <div className="mmc__chart">
      <svg viewBox="0 0 400 96" aria-label={`${c.name} price line`}>
        <line className="mmc__grid-line" x1="0" y1="24" x2="400" y2="24" />
        <line className="mmc__grid-line" x1="0" y1="48" x2="400" y2="48" />
        <line className="mmc__grid-line" x1="0" y1="72" x2="400" y2="72" />
        <path className="mmc__price" d={c.chart} />
        {c.dots.map(([x, y], i) => (
          <circle key={i} className="mmc__dot" cx={x} cy={y} r="4.5" style={{ animationDelay: `${1 + i * 0.3}s` }} />
        ))}
      </svg>
    </div>
  );
}

export function CompanyModule({ c }: { c: Company }) {
  return (
    <article className="mmc" style={{ ["--brand" as string]: c.brand, ["--brand-on" as string]: c.brandOn }}>
      <div className="mmc__spine">
        <span className="mmc__spine-band" />
        <span className="mmc__spine-name">{c.ticker}</span>
        <span className="mmc__spine-band" />
      </div>

      <div className="mmc__cover">
        <svg viewBox="0 0 300 430" role="img" aria-label={`${c.name} — ${c.subtitle}`}>
          <rect width="300" height="430" fill={c.brand} />
          <rect width="10" height="430" fill="#161b2e" />
          <text x="155" y="46" textAnchor="middle" fontFamily="'Space Grotesk', sans-serif" fontWeight="600" fontSize="11" letterSpacing="4" fill={c.brandOn}>
            {c.kicker}
          </text>
          <text x="155" y="150" textAnchor="middle" fontFamily="'Fraunces', serif" fontWeight="700" fontStyle="italic" fontSize="60" fill={c.brandOn}>
            {c.name}
          </text>
          <rect x="60" y="166" width="190" height="7" rx="3.5" fill={c.brandOn} />
          {c.art}
          <rect x="40" y="304" width="220" height="3" rx="1.5" fill={c.brandOn} />
          <text x="155" y="345" textAnchor="middle" fontFamily="'Fraunces', serif" fontStyle="italic" fontSize="20" fill={c.brandOn}>
            {c.subtitle}
          </text>
          <g transform="translate(155,392)">
            <circle r="19" fill="none" stroke="#b67f14" strokeWidth="2" />
            <circle r="15" fill="#e0a526" stroke="#b67f14" strokeWidth="1" />
            <text y="5.5" textAnchor="middle" fontFamily="'Fraunces', serif" fontSize="16" fill="#161b2e">M</text>
          </g>
        </svg>
      </div>

      <ChartMelt c={c} />

      <div className="mmc__chapter">
        <span className="mmc__chapter-num">{c.chapterNum}</span>
        <span className="mmc__chapter-title">{c.chapterTitle}</span>
      </div>

      <div className="mmc__hall">
        <span className="mmc__hall-label">The Hall</span>
        {c.marks.map((m, i) => (
          <span
            key={i}
            className={`mmc__mark${i < c.struckCount ? " is-struck" : ""}${i === c.hereIndex ? " is-here" : ""}`}
          >
            {m}
          </span>
        ))}
        <span className="mmc__hall-spacer" />
        <span className="mmc__price-tag">{c.price}</span>
      </div>
    </article>
  );
}

export function CompanyModuleRow() {
  return (
    <div className="mmc-row">
      {COMPANIES.map((c) => (
        <CompanyModule key={c.ticker} c={c} />
      ))}
    </div>
  );
}
