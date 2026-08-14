"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { MissionFlow } from "./MissionFlow";

const CHAPTERS = [
  { id: "mark", label: "The mark" },
  { id: "gap", label: "The gap" },
  { id: "belief", label: "The belief" },
  { id: "method", label: "The method" },
  { id: "freedom", label: "The freedom" },
  { id: "invite", label: "The invitation" },
];

// masked, per-line rising reveal — <Lines> splits on \n
function Lines({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split("\n").map((ln, i) => (
        <span key={i} className={`mm-mf__line${className ? ` ${className}` : ""}`} style={{ ["--l" as string]: i }}>
          <span className="mm-mf__line-in">{ln}</span>
        </span>
      ))}
    </>
  );
}

export function MissionManifesto() {
  const [active, setActive] = useState(0);
  const secRefs = useRef<Array<HTMLElement | null>>([]);
  const [minted, setMinted] = useState(0);
  const countedRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.classList.add("is-in");
            const idx = Number(el.dataset.idx || 0);
            setActive(idx);
            if (el.dataset.id === "invite" && !countedRef.current) {
              countedRef.current = true;
              if (reduce) {
                setMinted(36);
              } else {
                const target = 36;
                const dur = 1500;
                const start = performance.now();
                const tick = (now: number) => {
                  const p = Math.min(1, (now - start) / dur);
                  const eased = 1 - Math.pow(1 - p, 3);
                  setMinted(Math.round(eased * target));
                  if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
              }
            }
          }
        });
      },
      { threshold: 0.4 },
    );

    secRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (i: number) => {
    secRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const magnet = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.28;
    el.style.setProperty("--tx", `${x}px`);
    el.style.setProperty("--ty", `${y}px`);
  };
  const demagnet = (e: MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--tx", "0px");
    e.currentTarget.style.setProperty("--ty", "0px");
  };

  const setRef = (i: number) => (el: HTMLElement | null) => {
    secRefs.current[i] = el;
  };

  return (
    <div className="mm-mf">
      {/* chapter progress rail */}
      <nav className="mm-mf__rail" aria-label="Mission chapters">
        <span className="mm-mf__rail-line" aria-hidden="true">
          <span className="mm-mf__rail-fill" style={{ ["--p" as string]: `${(active / (CHAPTERS.length - 1)) * 100}%` }} />
        </span>
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`mm-mf__tick${active === i ? " is-on" : ""}`}
            onClick={() => scrollTo(i)}
          >
            <i aria-hidden="true" />
            <span>{c.label}</span>
          </button>
        ))}
      </nav>

      {/* 0 — HERO */}
      <section ref={setRef(0)} data-idx={0} data-id="mark" className="mm-ch mm-ch--hero">
        <span className="mm-mf__grain" aria-hidden="true" />
        <div className="mm-ch__wrap">
          <span className="mm-mf__eyebrow">Our Mission</span>
          <span className="mm-mf__wordmark">MINTMARK</span>
          <h1 className="mm-mf__statement mm-mf__statement--hero">
            <Lines text={"The mark of\nthe real thing."} />
          </h1>
          <div className="mm-mf__coin" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="mm-mf__coin-svg">
              <defs>
                <linearGradient id="mfgold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff0b8" />
                  <stop offset="0.5" stopColor="#e0a526" />
                  <stop offset="1" stopColor="#a9781c" />
                </linearGradient>
              </defs>
              <circle className="mm-mf__coin-rim" cx="100" cy="100" r="92" pathLength={1} />
              <circle className="mm-mf__coin-rim2" cx="100" cy="100" r="80" pathLength={1} />
              <path id="mfArc" d="M100 100 m-64 0 a64 64 0 1 1 128 0" fill="none" />
              <text className="mm-mf__coin-legend">
                <textPath href="#mfArc" startOffset="50%">LIBERTY · UNDERSTANDING</textPath>
              </text>
              <path className="mm-mf__coin-m" d="M62 132 L82 72 L100 112 L118 72 L138 132" pathLength={1} />
            </svg>
            <span className="mm-mf__coin-sheen" />
          </div>
          <span className="mm-mf__scrollcue">
            <i />
          </span>
        </div>
      </section>

      {/* 1 — PROBLEM */}
      <section ref={setRef(1)} data-idx={1} data-id="gap" className="mm-ch mm-ch--gap">
        <div className="mm-ch__wrap">
          <span className="mm-mf__kicker">The gap</span>
          <h2 className="mm-mf__statement">
            <Lines text={"Money runs the world.\nNo one explains it\nto the kids in it."} />
          </h2>
          <p className="mm-mf__note mm-mf__reveal">
            Headlines report what moved. They never teach what it means — so ownership stays a
            mystery to the people who will inherit it.
          </p>
        </div>
      </section>

      {/* 2 — BELIEF */}
      <section ref={setRef(2)} data-idx={2} data-id="belief" className="mm-ch mm-ch--belief">
        <div className="mm-ch__wrap">
          <span className="mm-mf__kicker">The belief</span>
          <h2 className="mm-mf__statement mm-mf__statement--engrave">
            <Lines text={"Understanding is\nthe authenticating\nstamp."} />
          </h2>
          <span className="mm-mf__rule mm-mf__reveal" aria-hidden="true" />
          <p className="mm-mf__note mm-mf__reveal">
            A share is just paper until you know what stands behind it. Understanding is what makes
            ownership real.
          </p>
        </div>
      </section>

      {/* 3 — METHOD (interactive demos) */}
      <section ref={setRef(3)} data-idx={3} data-id="method" className="mm-ch mm-ch--method">
        <div className="mm-ch__wrap mm-ch__wrap--wide">
          <span className="mm-mf__kicker">The method</span>
          <h2 className="mm-mf__statement mm-mf__statement--sm">
            <Lines text={"History through the now.\nThe reader as analyst."} />
          </h2>
          <div className="mm-mf__reveal mm-mf__flowmount">
            <MissionFlow />
          </div>
        </div>
      </section>

      {/* 4 — FREEDOM / torch */}
      <section ref={setRef(4)} data-idx={4} data-id="freedom" className="mm-ch mm-ch--freedom">
        <span className="mm-mf__torch" aria-hidden="true">
          <span className="mm-mf__flame" />
          <span className="mm-mf__glow" />
        </span>
        <div className="mm-ch__wrap">
          <span className="mm-mf__kicker mm-mf__kicker--light">The freedom</span>
          <h2 className="mm-mf__statement mm-mf__statement--gold">
            <Lines text={"Money understood\nbecomes freedom."} />
          </h2>
          <p className="mm-mf__note mm-mf__note--light mm-mf__reveal">
            When a child can read the world&rsquo;s ledger, no one can write their future for them.
          </p>
        </div>
      </section>

      {/* 5 — INVITATION */}
      <section ref={setRef(5)} data-idx={5} data-id="invite" className="mm-ch mm-ch--invite">
        <div className="mm-ch__wrap">
          <span className="mm-mf__kicker">The invitation</span>
          <h2 className="mm-mf__statement mm-mf__statement--sm">
            <Lines text={"Join the mint."} />
          </h2>
          <div className="mm-mf__proof mm-mf__reveal">
            <span className="mm-mf__proof-num">{minted}</span>
            <span className="mm-mf__proof-label">concepts to mint · 6 marks</span>
          </div>
          <div className="mm-mf__slogan mm-mf__reveal">
            <span>Every day</span>
            <i aria-hidden="true" />
            <span>Every quarter</span>
            <i aria-hidden="true" />
            <span>Every child</span>
          </div>
          <div className="mm-mf__cta mm-mf__reveal">
            <Link
              className="mm-mf__btn mm-mf__btn--primary"
              href="/catalog"
              onMouseMove={magnet}
              onMouseLeave={demagnet}
            >
              <span>Browse the catalog</span>
            </Link>
            <Link
              className="mm-mf__btn mm-mf__btn--ghost"
              href="/mint"
              onMouseMove={magnet}
              onMouseLeave={demagnet}
            >
              <span>Enter the Mint</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
