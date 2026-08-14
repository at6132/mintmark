"use client";

import { useEffect, useRef } from "react";

// canal centerline — mouth -> canal -> stomach entrance (squares fall along this)
const CANAL = "M118,64 C120,150 88,206 118,292 C146,376 88,452 118,536 C132,576 138,584 150,600";

export function MissionCanal() {
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    const stage = stageRef.current;
    if (!sec || !stage) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = sec.getBoundingClientRect();
        const total = sec.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        const s = Math.min(0.98, (window.innerHeight * 0.9) / 820);
        stage.style.setProperty("--p", p.toFixed(3));
        stage.style.setProperty("--s", s.toFixed(3));
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
    <section ref={secRef} className="mm-canal-sec">
      <div ref={stageRef} className="mm-canal-stage" style={{ ["--p" as string]: 0 }}>
        <div className="mm-canal-art">
          <div className="mm-canal-inner" style={{ ["--canal" as string]: `path("${CANAL}")` }}>
          <svg className="mm-canal-svg" viewBox="0 0 300 820" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {/* soft tube body, drawn on scroll */}
            <path
              className="mm-canal-tube"
              d={CANAL}
              pathLength={1}
            />
            <path className="mm-canal-tube-lumen" d={CANAL} pathLength={1} />

            {/* mouth */}
            <g className="mm-canal-mouth">
              <ellipse cx="118" cy="52" rx="40" ry="16" />
              <path className="mm-canal-lip" d="M82,52 Q118,40 154,52" />
              <path className="mm-canal-lip" d="M82,52 Q118,66 154,52" />
            </g>

            {/* stomach */}
            <g className="mm-canal-stomach">
              <path
                className="mm-canal-belly"
                d="M150,600 C96,596 70,628 74,668 C78,712 120,736 160,724 C202,712 214,664 196,632 C186,614 172,602 150,600 Z"
              />
              <path className="mm-canal-belly-line" d="M96,636 Q140,624 188,650" />
              <path className="mm-canal-belly-line" d="M92,664 Q140,656 190,678" />
            </g>

            {/* pocket */}
            <g className="mm-canal-pocket">
              <path
                className="mm-canal-pouch"
                d="M74,748 Q74,700 118,700 Q162,700 162,748 Q162,792 118,796 Q74,792 74,748 Z"
              />
              <path className="mm-canal-pouch-lip" d="M74,748 Q118,732 162,748" />
            </g>
          </svg>

          {/* raw dark news squares falling down the canal */}
          <div className="mm-canal-fall" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="mm-canal-sq" style={{ ["--delay" as string]: `${(i * 6) / 7}s` }} />
            ))}
          </div>

          {/* stomach churn — a few squares turning, one going gold */}
          <div className="mm-canal-churn" aria-hidden="true">
            <span className="mm-canal-churn-sq" style={{ ["--a" as string]: "0deg" }} />
            <span className="mm-canal-churn-sq" style={{ ["--a" as string]: "120deg" }} />
            <span className="mm-canal-churn-sq mm-canal-churn-sq--gold" style={{ ["--a" as string]: "240deg" }} />
          </div>

          {/* gold coins dropping into the pocket */}
          <div className="mm-canal-coins" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="mm-canal-coin" style={{ ["--delay" as string]: `${(i * 5) / 5}s` }} />
            ))}
          </div>

          {/* the kept stack — revealed by scroll */}
          <div className="mm-canal-stack" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="mm-canal-stackcoin" style={{ ["--t" as string]: (0.66 + i * 0.045).toFixed(3), ["--i" as string]: i }} />
            ))}
          </div>
          </div>
        </div>

        <div className="mm-canal-copy">
          <span className="mm-slide__kicker">Point 01 · Every day</span>
          <h2 className="mm-canal-title">
            News in,
            <br />
            <em>understanding</em> out.
          </h2>
          <p className="mm-canal-line">Kept.</p>
          <span className="mm-canal-legend">
            <b className="mm-canal-legend__raw" /> raw news
            <b className="mm-canal-legend__gold" /> understanding
          </span>
          <span className="mm-slide__index mm-slide__index--light" aria-hidden="true">01 <i /> 03</span>
        </div>
      </div>
    </section>
  );
}
