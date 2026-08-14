"use client";

import { useEffect, useRef } from "react";

const STAGES: Array<{ key: string; label: string; upTo: number }> = [
  { key: "mouth", label: "Mouth", upTo: 0.26 },
  { key: "eso", label: "Esophagus", upTo: 0.5 },
  { key: "stomach", label: "Stomach", upTo: 0.76 },
  { key: "grow", label: "Growing", upTo: 1.01 },
];

export function MissionCamera() {
  const secRef = useRef<HTMLElement>(null);
  const camRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    const cam = camRef.current;
    if (!sec || !cam) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = sec.getBoundingClientRect();
        const total = sec.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        cam.style.setProperty("--p", p.toFixed(4));
        const st = STAGES.find((s) => p < s.upTo) || STAGES[STAGES.length - 1];
        if (cam.dataset.stage !== st.key) cam.dataset.stage = st.key;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={secRef} className="mm-cam-sec" aria-label="How Mintmark works — a journey through the system">
      {/* shared sketch filter */}
      <svg className="mm-cam-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id="mm-cam-sketch" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="6" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div ref={camRef} className="mm-cam" data-stage="mouth" style={{ ["--p" as string]: 0 }}>
        <div className="mm-cam__world">
          {/* ── Zone 1 · the sandwich, cut once, eaten ── */}
          <div className="mm-cam__zone mm-cam__zone--mouth">
            <div className="mm-cam__scene">
              <svg viewBox="0 0 320 320" className="mm-cam__svg" aria-hidden="true">
                {/* knife */}
                <g className="mm-cam-knife">
                  <path d="M60,20 L60,150" />
                  <path d="M52,20 L68,20 L64,54 L56,54 Z" />
                </g>
                {/* sandwich */}
                <g className="mm-cam-sandwich">
                  <path className="mm-cam-bread" d="M40,150 Q160,96 280,150 L280,158 Q160,120 40,158 Z" />
                  <path className="mm-cam-fill" d="M44,166 Q160,140 276,166 Q160,196 44,166 Z" />
                  <path className="mm-cam-lettuce" d="M46,168 q16,-12 30,0 q16,12 30,0 q16,-12 30,0 q16,12 30,0 q16,-12 30,0 q16,12 30,0" />
                  <path className="mm-cam-bread" d="M44,196 Q160,176 276,196 L276,214 Q160,238 44,214 Z" />
                  <path className="mm-cam-cut" d="M160,120 L160,236" />
                </g>
                <path className="mm-cam-chomp" d="M232,150 a26,26 0 1 1 -8,-20" />
              </svg>
              <span className="mm-cam-tag mm-cam-tag--info">one story</span>
            </div>
          </div>

          {/* ── Zone 2 · down the esophagus ── */}
          <div className="mm-cam__zone mm-cam__zone--eso">
            <div className="mm-cam__scene">
              <svg viewBox="0 0 320 460" className="mm-cam__svg" aria-hidden="true">
                <path className="mm-cam-tube" d="M120,-10 C118,120 200,230 140,470" />
                <path className="mm-cam-tube-in" d="M120,-10 C118,120 200,230 140,470" />
                <g className="mm-cam-rings">
                  {[40, 130, 220, 310, 400].map((y) => (
                    <path key={y} className="mm-cam-ring" d={`M96,${y} q40,26 80,0`} />
                  ))}
                </g>
              </svg>
              <span className="mm-cam-bolus" />
            </div>
          </div>

          {/* ── Zone 3 · the stomach — into four quarters, then nutrients ── */}
          <div className="mm-cam__zone mm-cam__zone--stomach">
            <div className="mm-cam__scene">
              <svg viewBox="0 0 340 360" className="mm-cam__svg" aria-hidden="true">
                <path
                  className="mm-cam-belly"
                  d="M150,54 C96,60 60,116 76,178 C64,212 72,262 116,300 C166,344 246,338 272,282 C298,226 276,176 250,154 C262,114 244,66 196,58 C182,54 166,52 150,54 Z"
                />
                <path className="mm-cam-belly-fold" d="M96,150 Q170,132 246,166" />
                <path className="mm-cam-belly-fold" d="M92,200 Q170,186 252,214" />
              </svg>
              <div className="mm-cam-quarters">
                {["Q1", "Q2", "Q3", "Q4"].map((q, i) => (
                  <span key={q} className="mm-cam-quarter" style={{ ["--a" as string]: `${i * 90}deg` }}>
                    {q}
                  </span>
                ))}
              </div>
              <div className="mm-cam-nutrients">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="mm-cam-nutri" style={{ ["--i" as string]: i, ["--delay" as string]: `${i * 0.4}s` }} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Zone 4 · the child grows ── */}
          <div className="mm-cam__zone mm-cam__zone--grow">
            <div className="mm-cam__scene">
              <div className="mm-cam-nutrients mm-cam-nutrients--rise">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="mm-cam-nutri" style={{ ["--i" as string]: i, ["--delay" as string]: `${i * 0.35}s`, ["--rx" as string]: `${(i - 5) * 22}px` }} />
                ))}
              </div>
              <svg viewBox="0 0 320 380" className="mm-cam__svg mm-cam__child" aria-hidden="true">
                <g className="mm-cam-kid">
                  <circle cx="160" cy="96" r="30" />
                  <path d="M160,126 L160,250 M160,150 L118,196 M160,150 L202,196 M160,250 L132,330 M160,250 L188,330" />
                </g>
                {[330, 270, 210, 150, 90].map((y, i) => (
                  <g key={y} className="mm-cam-tick" style={{ ["--k" as string]: i }}>
                    <path d={`M266,${y} L286,${y}`} />
                  </g>
                ))}
                <path className="mm-cam-ruler" d="M286,340 L286,70" />
              </svg>
            </div>
          </div>
        </div>

        {/* HUD — you are here + progress */}
        <div className="mm-cam__hud" aria-hidden="true">
          <span className="mm-cam__here-label">you are here</span>
          <div className="mm-cam__here">
            {STAGES.map((s) => (
              <b key={s.key} className={`mm-cam__here-${s.key}`}>
                {s.label}
              </b>
            ))}
          </div>
          <div className="mm-cam__depth">
            <i />
          </div>
        </div>

        <div className="mm-cam__caption" aria-hidden="true">
          <span className="mm-cam__cap-mouth">News — cut once, made edible.</span>
          <span className="mm-cam__cap-eso">Swallowed. Travelling in.</span>
          <span className="mm-cam__cap-stomach">Digested into quarters, then nutrients.</span>
          <span className="mm-cam__cap-grow">Nutrients compound. The child grows.</span>
        </div>
      </div>
    </section>
  );
}
