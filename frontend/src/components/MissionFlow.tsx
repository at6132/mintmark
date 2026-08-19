import type { ReactNode } from "react";

type Kind = "news" | "digest" | "mint";

const STEPS: Array<{
  key: Kind;
  idx: string;
  tag: string;
  title: string;
  line: ReactNode;
  body: ReactNode;
  tone: "navy" | "mint";
}> = [
  {
    key: "news",
    idx: "01",
    tag: "Every day",
    title: "Financial news",
    line: (
      <>
        <em className="mm-lead__mint">Explained</em> — not just{" "}
        <em className="mm-lead__gold">reported</em>.
      </>
    ),
    body: (
      <>
        Curated <em className="mm-lead__mint">financial</em> content with embedded lessons, taught with{" "}
        <em className="mm-lead__gold">radical clarity</em>. Follow along at{" "}
        <em className="mm-lead__gold">FIN.</em> by mintmark.
      </>
    ),
    tone: "mint",
  },
  {
    key: "digest",
    idx: "02",
    tag: "Every quarter",
    title: "Quarterly digests",
    line: (
      <>
        Don’t just own your favorite companies —{" "}
        <em className="mm-lead__mint">own the way they work</em>.
      </>
    ),
    body: (
      <>
        Every quarter, your <em className="mm-lead__gold">favorite</em> becomes a story — the whole
        business taken apart and rebuilt in plain language,{" "}
        <em className="mm-lead__mint">delivered like mail</em> to your door.
      </>
    ),
    tone: "navy",
  },
  {
    key: "mint",
    idx: "03",
    tag: "Every child",
    title: "Mint your future",
    line: (
      <>
        <em className="mm-lead__gold">Compound</em> your{" "}
        <em className="mm-lead__mint">financial knowledge</em>.
      </>
    ),
    body: (
      <>
        Mintmark content contains the <em className="mm-lead__mint">building blocks</em> of{" "}
        <em className="mm-lead__gold">financial literacy</em> — to power your child’s{" "}
        <em className="mm-lead__mintlite">future</em>.
      </>
    ),
    tone: "mint",
  },
];

/* ---- real public companies, brand-ish accents ---- */
const CO = {
  AAPL: "#8a8f98", NVDA: "#76B900", MSFT: "#2D9CDB", AMZN: "#FF9900", KO: "#E51D2A",
  COST: "#2f7bc0", DIS: "#2D55C7", MCD: "#DA291C", NKE: "#1a2338", SBUX: "#00A862",
  V: "#3b41a8", MA: "#EB001B", JPM: "#3f6ea8", GOOGL: "#4285F4", META: "#2B6DE9",
  WMT: "#2f8fe0", TGT: "#E23A3A", PEP: "#1666c4", F: "#2f66b8", DE: "#4a9e3a",
} as const;
type Tk = keyof typeof CO;
const NAME: Record<Tk, string> = {
  AAPL: "Apple", NVDA: "NVIDIA", MSFT: "Microsoft", AMZN: "Amazon", KO: "Coca-Cola",
  COST: "Costco", DIS: "Disney", MCD: "McDonald's", NKE: "Nike", SBUX: "Starbucks",
  V: "Visa", MA: "Mastercard", JPM: "JPMorgan", GOOGL: "Google", META: "Meta",
  WMT: "Walmart", TGT: "Target", PEP: "Pepsi", F: "Ford", DE: "Deere",
};

/* ===== NEWS — homepage-newsroom look: columns of live headline cards drifting ===== */
const NEWS: Array<{ tk: Tk; up: boolean; h: string }> = [
  { tk: "NVDA", up: true, h: "AI demand surges" },
  { tk: "AAPL", up: true, h: "Services hit record" },
  { tk: "MSFT", up: true, h: "Cloud accelerates" },
  { tk: "KO", up: false, h: "Volumes dip" },
  { tk: "AMZN", up: true, h: "Retail media climbs" },
  { tk: "COST", up: true, h: "Membership renews" },
  { tk: "DIS", up: true, h: "Parks rebound" },
  { tk: "MCD", up: false, h: "Traffic cools" },
  { tk: "SBUX", up: false, h: "Same-store soft" },
  { tk: "JPM", up: true, h: "Net interest up" },
  { tk: "V", up: true, h: "Payment volume grows" },
  { tk: "NKE", up: false, h: "Inventory clears" },
];

function NewsCard({ n }: { n: { tk: Tk; up: boolean; h: string } }) {
  return (
    <span className="mm-newscard">
      <span className="mm-newscard__top">
        <b className="mm-newscard__tk" style={{ ["--co" as string]: CO[n.tk] }}>{n.tk}</b>
        <i className={`mm-newscard__ar ${n.up ? "is-up" : "is-dn"}`}>{n.up ? "▲" : "▼"}</i>
      </span>
      <span className="mm-newscard__h">{n.h}</span>
      <span className="mm-newscard__l mm-newscard__l--1" />
      <span className="mm-newscard__l mm-newscard__l--2" />
      <span className="mm-newscard__bars">
        {[62, 84, 48, 92, 70].map((h, i) => (
          <i key={i} style={{ ["--h" as string]: `${h}%` }} />
        ))}
      </span>
    </span>
  );
}

function NewsBg() {
  const cols = [
    [NEWS[0], NEWS[4], NEWS[8]],
    [NEWS[1], NEWS[5], NEWS[9]],
    [NEWS[2], NEWS[6], NEWS[10]],
    [NEWS[3], NEWS[7], NEWS[11]],
  ];
  return (
    <div className="mm-vslide__bg mm-vslide__bg--news" aria-hidden="true">
      {cols.map((cards, ci) => (
        <div
          key={ci}
          className={`mm-newscol ${ci % 2 ? "mm-newscol--dn" : "mm-newscol--up"}`}
          style={{ ["--sp" as string]: `${34 + ci * 8}s` }}
        >
          {[...cards, ...cards].map((n, i) => (
            <NewsCard key={i} n={n} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ===== DIGEST — conveyor belt of real-company digest covers, rows sliding both ways ===== */
const BELT_ROWS: Tk[][] = [
  ["AAPL", "NVDA", "MSFT", "AMZN", "KO", "COST", "DIS"],
  ["MCD", "NKE", "SBUX", "V", "MA", "JPM", "GOOGL"],
  ["META", "WMT", "TGT", "PEP", "F", "DE", "KO"],
  ["AMZN", "GOOGL", "NVDA", "SBUX", "MA", "DIS", "MSFT"],
];

function BeltCover({ tk }: { tk: Tk }) {
  return (
    <span className="mm-belt-cover" style={{ ["--co" as string]: CO[tk] }}>
      <span className="mm-belt-cover__q">Q3 DIGEST</span>
      <b className="mm-belt-cover__tk">{tk}</b>
      <span className="mm-belt-cover__nm">{NAME[tk]}</span>
      <span className="mm-belt-cover__band" />
    </span>
  );
}

function BeltBg() {
  return (
    <div className="mm-vslide__bg mm-vslide__bg--belt" aria-hidden="true">
      {BELT_ROWS.map((row, ri) => (
        <div
          key={ri}
          className={`mm-beltrow ${ri % 2 ? "mm-beltrow--r" : "mm-beltrow--l"}`}
          style={{ ["--sp" as string]: `${46 + ri * 9}s` }}
        >
          {[...row, ...row].map((tk, i) => (
            <BeltCover key={i} tk={tk} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ===== MINT — periodic metal squares raining down ===== */
const METALS = ["#c47a34", "#c9a24a", "#a06a34", "#4fa98f", "#c3c7d0", "#d8b23f"];
const RAIN_SYMS = ["Au", "Ag", "Cu", "Zn", "Sn", "", "Ra", "", "Ni", "", "Pt", ""];

function RainBg() {
  const squares = Array.from({ length: 15 }, (_, i) => ({
    x: (i * 79 + 6) % 100,
    dur: 7 + (i % 6) * 1.3,
    delay: (i * 1.7) % 9,
    co: METALS[i % METALS.length],
    sym: RAIN_SYMS[i % RAIN_SYMS.length],
    sz: 34 + (i % 4) * 7,
  }));
  // the drift settles into a dune of tiles along the bottom — like sand
  const PILE = 26;
  const pile = Array.from({ length: PILE }, (_, i) => ({
    x: (i / PILE) * 100,
    co: METALS[(i * 3) % METALS.length],
    rot: ((i * 47) % 22) - 11,
    lift: (i % 3) * 9 + (i % 2) * 5,
    sz: 30 + (i % 4) * 7,
    sym: (i % 4 === 0) ? RAIN_SYMS[(i * 2) % RAIN_SYMS.length] : "",
  }));
  return (
    <div className="mm-vslide__bg mm-vslide__bg--rain" aria-hidden="true">
      {squares.map((s, i) => (
        <span
          key={i}
          className="mm-rain-sq"
          style={{
            ["--x" as string]: s.x,
            ["--dur" as string]: s.dur,
            ["--delay" as string]: s.delay,
            ["--co" as string]: s.co,
            ["--sz" as string]: `${s.sz}px`,
          }}
        >
          {s.sym ? <b>{s.sym}</b> : null}
        </span>
      ))}
      <span className="mm-rain-ground" />
      <div className="mm-rain-pile">
        {pile.map((p, i) => (
          <span
            key={i}
            className="mm-pile-sq"
            style={{
              ["--x" as string]: p.x,
              ["--co" as string]: p.co,
              ["--rot" as string]: p.rot,
              ["--lift" as string]: p.lift,
              ["--sz" as string]: `${p.sz}px`,
            }}
          >
            {p.sym ? <b>{p.sym}</b> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ===== a ball spun from words — "read to learn · learn to read" ===== */
function WordBall() {
  return (
    <div className="mm-feat mm-feat--ball" aria-hidden="true">
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <defs>
          <path id="mmBallOuter" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
          <path id="mmBallInner" d="M100,100 m-54,0 a54,54 0 1,0 108,0 a54,54 0 1,0 -108,0" />
        </defs>
        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(130,221,199,0.22)" strokeWidth="1" />
        <circle cx="100" cy="100" r="63" fill="none" stroke="rgba(224,178,62,0.22)" strokeWidth="1" />
        <g className="mm-ball-spin">
          <text className="mm-ball-txt mm-ball-txt--o">
            <textPath href="#mmBallOuter" startOffset="0">
              READ TO LEARN&nbsp;·&nbsp;READ TO LEARN&nbsp;·&nbsp;READ TO LEARN&nbsp;·&nbsp;
            </textPath>
          </text>
        </g>
        <g className="mm-ball-spin mm-ball-spin--rev">
          <text className="mm-ball-txt mm-ball-txt--i">
            <textPath href="#mmBallInner" startOffset="0">
              LEARN TO READ&nbsp;·&nbsp;LEARN TO READ&nbsp;·&nbsp;LEARN TO READ&nbsp;·&nbsp;
            </textPath>
          </text>
        </g>
        <circle cx="100" cy="100" r="31" fill="rgba(130,221,199,0.12)" stroke="#82ddc7" strokeWidth="1.5" />
        <text x="100" y="105" textAnchor="middle" className="mm-ball-core">READ</text>
      </svg>
    </div>
  );
}

/* ===== a mailbox with a quarterly digest package dropping in ===== */
function Mailbox() {
  return (
    <div className="mm-feat mm-feat--mail" aria-hidden="true">
      <svg viewBox="0 0 200 196" width="100%" height="100%">
        <defs>
          <linearGradient id="mmMailBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b3b74" />
            <stop offset="1" stopColor="#141e40" />
          </linearGradient>
        </defs>

        {/* soft ground shadow */}
        <ellipse cx="100" cy="189" rx="52" ry="5" fill="#0c1020" opacity="0.22" />

        {/* falling digest package */}
        <g className="mm-mail-pkg">
          <rect x="82" y="2" width="36" height="27" rx="3.5" fill="#82ddc7" stroke="#0c1020" strokeWidth="1.6" />
          <rect x="82" y="12" width="36" height="6" fill="#e7b23e" />
          <rect x="87" y="6" width="12" height="3" rx="1.5" fill="#0c1020" opacity="0.45" />
          <text x="100" y="27" textAnchor="middle" className="mm-mail-q">Q3</text>
        </g>

        {/* post */}
        <rect x="92" y="138" width="16" height="50" rx="3" fill="#182444" />
        <rect x="92" y="138" width="5" height="50" fill="#2b3b74" />

        {/* arched mailbox body */}
        <path d="M50 140 L50 96 A45 45 0 0 1 140 96 L140 140 Z" fill="url(#mmMailBody)" stroke="#82ddc7" strokeWidth="2.4" strokeLinejoin="round" />
        {/* rounded top highlight */}
        <path d="M55 96 A40 40 0 0 1 135 96" fill="none" stroke="#9fe8d5" strokeWidth="1.4" opacity="0.55" />
        {/* inner door panel */}
        <path d="M62 140 L62 102 A33 33 0 0 1 128 102 L128 140 Z" fill="#0f1a38" stroke="#3a5be0" strokeWidth="1.6" strokeLinejoin="round" opacity="0.92" />
        {/* letter slot */}
        <rect x="80" y="99" width="30" height="7" rx="3.5" fill="#060b1c" stroke="#82ddc7" strokeWidth="1.2" />
        {/* door knob */}
        <circle cx="95" cy="124" r="3.2" fill="#e7b23e" />

        {/* signal flag (raises when the digest lands) */}
        <g className="mm-mail-flag">
          <rect x="139" y="72" width="4" height="40" rx="2" fill="#c98f2a" />
          <path d="M143 73 h20 l-5 7 l5 7 h-20 z" fill="#e7b23e" stroke="#0c1020" strokeWidth="0.8" />
        </g>

        {/* grass line */}
        <path d="M58 188 q42 -10 84 0" stroke="#4fa98f" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ===== the periodic table — compound your knowledge ===== */
function PeriodicTable() {
  const rows = [
    [0, 8],
    [0, 1, 4, 5, 6, 7, 8],
    [0, 1, 4, 5, 6, 7, 8],
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  ];
  const SYM: Record<string, string> = { "0-0": "H", "8-0": "He", "0-3": "Au", "3-4": "Ag", "6-4": "Cu" };
  const CW = 15;
  const GAP = 2.6;
  const cells: Array<{ c: number; r: number }> = [];
  rows.forEach((cols, r) => cols.forEach((c) => cells.push({ c, r })));
  const w = 9 * (CW + GAP);
  const h = 5 * (CW + GAP);
  return (
    <div className="mm-feat mm-feat--ptable" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        {cells.map((cell, i) => {
          const x = cell.c * (CW + GAP);
          const y = cell.r * (CW + GAP);
          const co = METALS[(cell.c + cell.r) % METALS.length];
          const key = `${cell.c}-${cell.r}`;
          return (
            <g key={i} className="mm-pt-cell" style={{ ["--i" as string]: i }}>
              <rect x={x} y={y} width={CW} height={CW} rx="2" fill={co} fillOpacity="0.85" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6" />
              {SYM[key] ? (
                <text x={x + CW / 2} y={y + CW / 2 + 3} textAnchor="middle" className="mm-pt-sym">{SYM[key]}</text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MissionFlow() {
  return (
    <div className="mm-vdeck">
      {STEPS.map((s) => (
        <section key={s.key} className={`mm-vslide is-${s.tone} mm-vslide--${s.key}`}>
          {s.key === "news" ? <NewsBg /> : s.key === "digest" ? <BeltBg /> : <RainBg />}
          <div className="mm-vslide__inner">
            <div className="mm-vslide__card">
              {s.key === "news" ? <WordBall /> : s.key === "digest" ? <Mailbox /> : <PeriodicTable />}
              <h2 className="mm-vslide__title mm-write">{s.title}</h2>
              <span className="mm-vslide__kicker">
                <b>{s.idx}</b> — {s.tag}
              </span>
              <p className="mm-vslide__line">{s.line}</p>
              <p className="mm-vslide__body">{s.body}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
