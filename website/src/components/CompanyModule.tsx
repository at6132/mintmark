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
    ticker: "HERTZ",
    name: "Hertz",
    brand: "#ffd100",
    brandOn: "#161b2e",
    kicker: "LIVING COMPANY DNA",
    subtitle: "The Melting Machine",
    chart: "M4,44 C30,42 55,40 76,39 C96,38 112,58 132,76 C144,86 156,87 168,80 C182,72 192,46 206,32 C216,22 226,28 240,40 C260,57 280,62 304,66 C332,71 368,75 396,77",
    dots: [[132, 76], [206, 32], [304, 66]],
    chapterNum: "Chapter 2",
    chapterTitle: "The Stock That Refused to Die",
    marks: ["H", "B", "·", "·", "·", "·", "·", "·"],
    hereIndex: 0,
    struckCount: 2,
    price: "$24.99",
    art: (
      <g transform="translate(50,215)">
        <path d="M8,58 C8,44 20,40 34,38 L52,20 C56,15 62,12 70,12 L128,12 C138,12 146,16 152,24 L166,38 C184,40 196,46 196,58 L196,66 C196,70 193,72 189,72 L15,72 C11,72 8,70 8,66 Z" fill="#161b2e" />
        <path d="M62,22 L72,22 C74,22 76,23 76,26 L76,38 L54,38 Z" fill="#ffd100" />
        <path d="M84,22 L124,22 C130,22 134,25 138,30 L144,38 L84,38 Z" fill="#ffd100" />
        <circle cx="52" cy="72" r="16" fill="#161b2e" /><circle cx="52" cy="72" r="7" fill="#ffd100" />
        <circle cx="152" cy="72" r="16" fill="#161b2e" /><circle cx="152" cy="72" r="7" fill="#ffd100" />
        <ellipse cx="99" cy="112" rx="10" ry="3.5" fill="#161b2e" opacity="0.85" />
      </g>
    ),
  },
  {
    ticker: "NFLX",
    name: "Netflix",
    brand: "#d61a23",
    brandOn: "#f7f1e1",
    kicker: "LIVING COMPANY DNA",
    subtitle: "The Evening, Sold Twice",
    chart: "M4,70 C40,66 70,58 100,50 C140,40 170,44 200,36 C240,26 270,30 300,22 C330,14 366,12 396,8",
    dots: [[100, 50], [200, 36], [300, 22]],
    chapterNum: "Chapter 1",
    chapterTitle: "Who Is Still Watching",
    marks: ["N", "·", "·", "·", "·", "·", "·", "·"],
    hereIndex: 0,
    struckCount: 1,
    price: "$21.99",
    art: (
      <g transform="translate(150,150)">
        <circle r="88" fill="none" stroke="#f7f1e1" strokeWidth="3" />
        <circle r="74" fill="none" stroke="#f7f1e1" strokeWidth="2" />
        <circle r="16" fill="none" stroke="#f7f1e1" strokeWidth="3" />
        <g fill="none" stroke="#f7f1e1" strokeWidth="2.4">
          <circle cx="0" cy="-52" r="11" /><circle cx="0" cy="52" r="11" />
          <circle cx="-52" cy="0" r="11" /><circle cx="52" cy="0" r="11" />
          <circle cx="-37" cy="-37" r="11" /><circle cx="37" cy="-37" r="11" />
          <circle cx="-37" cy="37" r="11" /><circle cx="37" cy="37" r="11" />
        </g>
        <path d="M70,26 q40,30 20,80 q-14,40 20,64" fill="none" stroke="#f7f1e1" strokeWidth="3" />
        <circle r="8" fill="#e0a526" stroke="#f7f1e1" strokeWidth="3" />
      </g>
    ),
  },
  {
    ticker: "KO",
    name: "Coca-Cola",
    brand: "#c8102e",
    brandOn: "#f7f1e1",
    kicker: "LIVING COMPANY DNA",
    subtitle: "The Forever Habit",
    chart: "M4,60 C40,58 70,54 100,56 C140,58 170,48 200,50 C240,52 270,44 300,46 C330,48 366,42 396,44",
    dots: [[100, 56], [200, 50], [300, 46]],
    chapterNum: "Chapter 3",
    chapterTitle: "A Nickel, Held for a Century",
    marks: ["K", "O", "·", "·", "·", "·", "·", "·"],
    hereIndex: 1,
    struckCount: 2,
    price: "$26.99",
    art: (
      <g transform="translate(150,140)" fill="none" stroke="#f7f1e1" strokeWidth="3" strokeLinejoin="round">
        <path d="M-26,-96 L26,-96 L24,-80 L-24,-80 Z" fill="#f7f1e1" />
        <path d="M-24,-80 C-24,-58 -34,-52 -34,-24 L-34,86 C-34,102 -22,110 0,110 C22,110 34,102 34,86 L34,-24 C34,-52 24,-58 24,-80" />
        <path d="M-34,-6 C-16,-18 16,6 34,-6" />
        <path d="M-34,22 C-16,10 16,34 34,22" />
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
