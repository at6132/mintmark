"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { geoAlbersUsa, geoPath, geoOrthographic, geoGraticule10, geoDistance } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Feature, MultiLineString } from "geojson";
import statesTopoRaw from "us-atlas/states-10m.json";
import landTopoRaw from "world-atlas/land-50m.json";
import countriesTopoRaw from "world-atlas/countries-110m.json";
import { marketMapsContent } from "@/data/marketMaps";
import { appHref } from "@/lib/assets";
import { SECTOR_COLORS, SECTOR_HALO } from "@/lib/sectors";

/* eslint-disable @typescript-eslint/no-explicit-any */
const statesTopo = statesTopoRaw as any;
const landTopo = landTopoRaw as any;
const countriesTopo = countriesTopoRaw as any;

const W = 980;
const H = 600;
const PAD = 14;


// 7-bucket diverging ramp (change %) — vibrant reds & greens.
function bucket(pct: number | null): { bg: string; fg: string } {
  if (pct === null || Number.isNaN(pct)) return { bg: "#D8D2C4", fg: "#161B2E" };
  if (pct <= -3) return { bg: "#B01818", fg: "#FFFFFF" };
  if (pct <= -1) return { bg: "#E23B3B", fg: "#FFFFFF" };
  if (pct < 0) return { bg: "#F6A6A6", fg: "#161B2E" };
  if (pct === 0) return { bg: "#D8D2C4", fg: "#161B2E" };
  if (pct < 1) return { bg: "#8DE3AC", fg: "#0B3D24" };
  if (pct < 3) return { bg: "#1FBE57", fg: "#FFFFFF" };
  return { bg: "#0B9E45", fg: "#FFFFFF" };
}

const RAMP = [
  { bg: "#B01818", label: "≤−3" },
  { bg: "#E23B3B", label: "−3" },
  { bg: "#F6A6A6", label: "−1" },
  { bg: "#D8D2C4", label: "0" },
  { bg: "#8DE3AC", label: "+1" },
  { bg: "#1FBE57", label: "+3" },
  { bg: "#0B9E45", label: "≥+3" },
];

type Co = {
  ticker: string;
  name: string;
  sector: string;
  cap: number; // billions
  change: number | null;
  lon: number;
  lat: number;
  href: string;
};

const GLOBE_R = 250;

// region focus presets. Finer than continents so a deep zoom still frames the
// whole region instead of slicing it — rotation = [-lon, -lat] of the centre.
const REGIONS: Array<{ name: string; rot: [number, number]; zoom: number }> = [
  { name: "United States", rot: [98, -39], zoom: 4.2 },
  { name: "Canada", rot: [96, -58], zoom: 3.4 },
  { name: "Latin America", rot: [75, 12], zoom: 2.4 },
  { name: "W. Europe", rot: [-6, -48], zoom: 5.0 },
  { name: "N. Europe", rot: [-16, -60], zoom: 4.6 },
  { name: "E. Europe", rot: [-40, -50], zoom: 3.6 },
  { name: "Middle East", rot: [-45, -28], zoom: 4.4 },
  { name: "Africa", rot: [-20, -2], zoom: 2.6 },
  { name: "South Asia", rot: [-80, -22], zoom: 4.2 },
  { name: "East Asia", rot: [-115, -32], zoom: 3.6 },
  { name: "SE Asia", rot: [-110, -8], zoom: 4.0 },
  { name: "Oceania", rot: [-140, 25], zoom: 3.4 },
];

function fmtCap(b: number): string {
  return b >= 1000 ? `$${(b / 1000).toFixed(2)}T` : `$${Math.round(b)}B`;
}

type Tip = { x: number; y: number; co: Co } | null;

export function HomeMarketMaps() {
  const [mode, setMode] = useState<"heat" | "hq" | "globe">("heat");
  const [activeSector, setActiveSector] = useState<string>("all");
  const [tip, setTip] = useState<Tip>(null);
  const [openCluster, setOpenCluster] = useState<string | null>(null);
  // globe rotation [yaw, pitch]; dragged with the pointer. zoom via wheel.
  const [rot, setRot] = useState<[number, number]>([100, -40]);
  const [zoom, setZoom] = useState(1.7);
  const drag = useRef<{ x: number; y: number; r: [number, number]; moved: boolean; id: number; el: Element } | null>(null);
  // render the d3 SVG only after mount — the treemap/projection produce tiny
  // float differences between server and client that trip React hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastWheel = useRef(0);

  const onPointerDown = (e: ReactPointerEvent) => {
    if (mode !== "globe") return;
    // record the start but DON'T capture yet — capturing on down steals the
    // click from dots/clusters. We only capture once a real drag begins.
    drag.current = { x: e.clientX, y: e.clientY, r: rot, moved: false, id: e.pointerId, el: e.currentTarget as Element };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 5) return; // below threshold → still a click, let it pass
      d.moved = true;
      d.el.setPointerCapture?.(d.id);
    }
    const [r0, r1] = d.r;
    // the deeper the zoom, the finer the drag — otherwise a small hand movement
    // throws the globe across a hemisphere once you are inside a region
    const sens = 0.5 / Math.max(1, Math.pow(zoom, 0.85));
    setRot([r0 + dx * sens, Math.max(-85, Math.min(85, r1 - dy * sens))]);
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (d?.moved) d.el.releasePointerCapture?.(d.id);
    drag.current = null;
  };

  const companies: Co[] = useMemo(() => {
    const raw = marketMapsContent.companies as unknown as Array<Record<string, string>>;
    return raw
      .map((c) => ({
        ticker: String(c.ticker || "").toUpperCase(),
        name: String(c.company_name || c.ticker || ""),
        sector: String(c.sector || "Other"),
        cap: Number(c.market_cap || 0),
        change: c.daily_move == null || c.daily_move === "" ? null : Number(c.daily_move),
        lon: Number(c.longitude),
        lat: Number(c.latitude),
        href: appHref(String(c.module_link || "")) || "/companies",
      }))
      .filter((c) => c.ticker)
      .sort((a, b) => b.cap - a.cap);
  }, []);

  const sectors = useMemo(() => [...new Set(companies.map((c) => c.sector))], [companies]);
  const sectorOrder = useMemo(() => ["all", ...sectors], [sectors]);
  const activeColor = activeSector === "all" ? "#161B2E" : SECTOR_COLORS[activeSector] || "#646575";

  // smoothly tween the globe to a continent
  const animRef = useRef<number | null>(null);
  const focusContinent = (targetRot: [number, number], targetZoom: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const startRot = rot;
    const startZoom = zoom;
    const t0 = performance.now();
    const dur = 650;
    let dLon = targetRot[0] - startRot[0];
    while (dLon > 180) dLon -= 360;
    while (dLon < -180) dLon += 360;
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setRot([startRot[0] + dLon * e, startRot[1] + (targetRot[1] - startRot[1]) * e]);
      setZoom(startZoom + (targetZoom - startZoom) * e);
      if (p < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  };

  // a stable id for a cluster (its members), so "open" survives re-clustering on zoom
  const clusterSig = (members: Array<{ co: Co }>) => members.map((m) => m.co.ticker).sort().join(",");
  // click a cluster → auto-zoom to its location and fan the web open
  const openClusterFocus = (cl: { members: Array<{ co: Co }> }) => {
    const sig = clusterSig(cl.members);
    if (openCluster === sig) {
      setOpenCluster(null);
      return;
    }
    const lon = cl.members.reduce((s, m) => s + m.co.lon, 0) / cl.members.length;
    const lat = cl.members.reduce((s, m) => s + m.co.lat, 0) / cl.members.length;
    // dive deep into the cluster's web
    focusContinent([-lon, -lat], Math.min(16, Math.max(zoom * 1.9, 9)));
    setOpenCluster(sig);
  };

  // wheel: globe zooms, heat scrolls through sectors seamlessly.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (mode === "globe") {
        e.preventDefault();
        // finer wheel steps once you are zoomed in, so deep focus is controllable
        setZoom((z) => {
          const step = z > 4 ? 1.06 : z > 2 ? 1.1 : 1.16;
          return Math.max(0.7, Math.min(16, z * (e.deltaY < 0 ? step : 1 / step)));
        });
        return;
      }
      // heat map: let the page scroll normally — sectors change only via the buttons
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mode, mounted, sectorOrder]);

  // Shared Albers-USA projection + US outline (nation) + state borders.
  const geo = useMemo(() => {
    const nation = feature(statesTopo, statesTopo.objects.nation) as unknown as Feature;
    const proj = geoAlbersUsa().fitExtent(
      [
        [PAD, PAD],
        [W - PAD, H - PAD],
      ],
      nation as never,
    );
    const path = geoPath(proj);
    const usPath = path(nation as never) || "";
    const borders = mesh(statesTopo, statesTopo.objects.states, (a: unknown, b: unknown) => a !== b) as unknown as MultiLineString;
    const statePath = path(borders as never) || "";
    const bounds = path.bounds(nation as never); // [[x0,y0],[x1,y1]]
    return { proj, usPath, statePath, bounds };
  }, []);

  // HEAT — squarified treemap grouped by sector, laid into a clean rounded frame (Clear Street style).
  const HEAT_PAD = 16;
  const heat = useMemo(() => {
    const bw = W - HEAT_PAD * 2;
    const bh = H - HEAT_PAD * 2;
    const pool = activeSector === "all" ? companies : companies.filter((c) => c.sector === activeSector);
    const bySector = new Map<string, Co[]>();
    for (const c of pool) {
      if (c.cap <= 0) continue;
      if (!bySector.has(c.sector)) bySector.set(c.sector, []);
      bySector.get(c.sector)!.push(c);
    }
    const rootData = {
      name: "root",
      children: [...bySector.entries()].map(([sector, cos]) => ({
        name: sector,
        children: cos.map((co) => ({ name: co.ticker, co, cap: co.cap })),
      })),
    };
    const root = hierarchy(rootData as never)
      .sum((d) => (d as { cap?: number }).cap || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const layout = treemap();
    layout
      .tile(treemapSquarify.ratio(1))
      .size([bw, bh])
      .paddingOuter(activeSector === "all" ? 3 : 1)
      .paddingInner(2.5)
      .round(true);
    layout(root as never);

    return { root: root as never, ox: HEAT_PAD, oy: HEAT_PAD };
  }, [companies, activeSector]);

  const sectorNodes = (heat.root as { children?: unknown[] }).children || [];
  const leaves = (heat.root as { leaves: () => unknown[] }).leaves();

  // HQ — project HQs, greedily cluster nearby points.
  const hq = useMemo(() => {
    const pts = companies
      .map((c) => {
        const p = geo.proj([c.lon, c.lat]);
        return p ? { co: c, x: p[0], y: p[1] } : null;
      })
      .filter(Boolean) as Array<{ co: Co; x: number; y: number }>;
    const maxCap = Math.max(...companies.map((c) => c.cap), 1);
    const clusters: Array<{ x: number; y: number; members: typeof pts }> = [];
    const R = 22;
    for (const pt of pts) {
      const found = clusters.find((cl) => Math.hypot(cl.x - pt.x, cl.y - pt.y) < R);
      if (found) {
        found.members.push(pt);
        found.x = found.members.reduce((s, m) => s + m.x, 0) / found.members.length;
        found.y = found.members.reduce((s, m) => s + m.y, 0) / found.members.length;
      } else {
        clusters.push({ x: pt.x, y: pt.y, members: [pt] });
      }
    }
    return { clusters, maxCap };
  }, [companies, geo.proj]);

  // tamer dot sizing — concentration barely changes the size, stays legible at all zooms
  const dotR = (cap: number) => 6 + Math.sqrt(Math.max(cap, 0) / hq.maxCap) * 9;

  // GLOBE — the HQ map as a real 3D world: companies plotted at their true HQ, clustered.
  const globe = useMemo(() => {
    const proj = geoOrthographic()
      .rotate([rot[0], rot[1], 0])
      .scale(GLOBE_R * zoom)
      .translate([W / 2, H / 2])
      .clipAngle(90);
    const path = geoPath(proj);
    const spherePath = path({ type: "Sphere" } as never) || "";
    const gratPath = path(geoGraticule10() as never) || "";
    const landPath = path(feature(landTopo, landTopo.objects.land) as never) || "";
    const countryPath =
      path(mesh(countriesTopo, countriesTopo.objects.countries, (a: unknown, b: unknown) => a !== b) as never) || "";
    const statePath =
      path(mesh(statesTopo, statesTopo.objects.states, (a: unknown, b: unknown) => a !== b) as never) || "";
    const center: [number, number] = [-rot[0], -rot[1]];
    // project real HQs, keep only those on the visible (front) hemisphere
    const pts = companies
      .map((co) => {
        const visible = geoDistance([co.lon, co.lat] as never, center as never) < Math.PI / 2;
        const p = visible ? proj([co.lon, co.lat]) : null;
        return p ? { co, x: p[0], y: p[1] } : null;
      })
      .filter(Boolean) as Array<{ co: Co; x: number; y: number }>;
    // cluster dense areas (Silicon Valley / NYC)
    const clusters: Array<{ x: number; y: number; members: typeof pts }> = [];
    const R = 20;
    for (const pt of pts) {
      const f = clusters.find((c) => Math.hypot(c.x - pt.x, c.y - pt.y) < R);
      if (f) {
        f.members.push(pt);
        f.x = f.members.reduce((s, m) => s + m.x, 0) / f.members.length;
        f.y = f.members.reduce((s, m) => s + m.y, 0) / f.members.length;
      } else {
        clusters.push({ x: pt.x, y: pt.y, members: [pt] });
      }
    }
    return { spherePath, gratPath, landPath, countryPath, statePath, clusters };
  }, [rot, zoom, companies]);

  const showTip = (e: ReactMouseEvent, co: Co) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    setTip({ x: e.clientX - (rect?.left || 0), y: e.clientY - (rect?.top || 0), co });
  };

  return (
    <div className="mm-maps" data-map-mode={mode}>
      <div className="mm-maps__bar">
        <div className="mm-maps__toggle" role="tablist" aria-label="Map mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "heat"}
            className={`mm-maps__tab${mode === "heat" ? " is-on" : ""}`}
            onClick={() => setMode("heat")}
          >
            Heat map
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "globe"}
            className={`mm-maps__tab${mode === "globe" ? " is-on" : ""}`}
            onClick={() => {
              setMode("globe");
              setOpenCluster(null);
            }}
          >
            HQ Globe
          </button>
        </div>
      </div>

      <div
        className={`mm-maps__stage${mode === "heat" ? " mm-maps__stage--heat" : ""}`}
        style={mode === "heat" ? { borderColor: activeColor } : undefined}
      >
        {mounted ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={`mm-maps__svg${mode === "globe" ? " mm-maps__svg--grab" : ""}`}
          role="img"
          aria-label={mode === "heat" ? "Heat map of U.S. companies by sector" : mode === "hq" ? "Headquarters map of U.S. companies" : "Interactive globe of companies by sector"}
          onMouseLeave={() => setTip(null)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <defs>
            <clipPath id="mm-heat-clip">
              <rect x={8} y={8} width={W - 16} height={H - 16} rx={24} />
            </clipPath>
            {/* the sea */}
            <radialGradient id="mm-globe-grad" cx="36%" cy="30%" r="76%">
              <stop offset="0%" stopColor="#dff2ff" />
              <stop offset="45%" stopColor="#8ec6e8" />
              <stop offset="100%" stopColor="#2f6f9e" />
            </radialGradient>
            <clipPath id="mm-globe-clip">
              <rect x={8} y={8} width={W - 16} height={H - 16} rx={24} />
            </clipPath>
            <linearGradient id="mm-heat-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffdf6" />
              <stop offset="100%" stopColor="#f2f8f4" />
            </linearGradient>
          </defs>

          {mode === "heat" ? (
            <g>
              {/* clean rounded frame — border tints to the active sector */}
              <rect x={8} y={8} width={W - 16} height={H - 16} rx={24} fill="url(#mm-heat-grad)" stroke={activeColor} strokeWidth={2.5} style={{ transition: "stroke 0.3s ease" }} />
              <g clipPath="url(#mm-heat-clip)">
                <g transform={`translate(${heat.ox},${heat.oy})`}>
                  {/* dark grout so every cell reads with strong contrast */}
                  <rect x={-HEAT_PAD} y={-HEAT_PAD} width={W} height={H} fill="#12131f" />
                  {/* sector blocks — faint sector-tinted backing */}
                  {sectorNodes.map((s: unknown) => {
                    const n = s as { x0: number; y0: number; x1: number; y1: number; data: { name: string } };
                    const col = SECTOR_COLORS[n.data.name] || "#646575";
                    return (
                      <rect
                        key={`sec-bg-${n.data.name}`}
                        x={n.x0}
                        y={n.y0}
                        width={n.x1 - n.x0}
                        height={n.y1 - n.y0}
                        fill={col}
                        fillOpacity={0.1}
                      />
                    );
                  })}
                  {/* company cells */}
                  {leaves.map((l: unknown) => {
                    const n = l as { x0: number; y0: number; x1: number; y1: number; data: { co: Co } };
                    const co = n.data.co;
                    const w = n.x1 - n.x0;
                    const h = n.y1 - n.y0;
                    const b = bucket(co.change);
                    const sectorCol = SECTOR_COLORS[co.sector] || "#646575";
                    const showLabel = w > 40 && h > 26;
                    return (
                      <a key={co.ticker} href={co.href}>
                        <g
                          onMouseMove={(e) => showTip(e, co)}
                          onMouseEnter={(e) => showTip(e, co)}
                          className="mm-maps__cell"
                        >
                          {/* fill = today's move; every cell is ringed in its sector colour */}
                          <rect
                            x={n.x0 + 2.75}
                            y={n.y0 + 2.75}
                            width={Math.max(w - 5.5, 0)}
                            height={Math.max(h - 5.5, 0)}
                            rx={3}
                            fill={b.bg}
                            stroke={sectorCol}
                            strokeWidth={5}
                            strokeOpacity={1}
                            strokeDasharray={co.change === null ? "3 2" : undefined}
                          />
                          {showLabel ? (
                            <>
                              <text
                                x={n.x0 + w / 2}
                                y={n.y0 + h / 2 - 2}
                                textAnchor="middle"
                                className="mm-maps__cell-tk"
                                fill={b.fg}
                              >
                                {co.ticker}
                              </text>
                              <text
                                x={n.x0 + w / 2}
                                y={n.y0 + h / 2 + 12}
                                textAnchor="middle"
                                className="mm-maps__cell-ch"
                                fill={b.fg}
                              >
                                {co.change === null ? "—" : `${co.change > 0 ? "+" : ""}${co.change}%`}
                              </text>
                            </>
                          ) : null}
                        </g>
                      </a>
                    );
                  })}
                  {/* sector outlines on top — coloured by sector so each group is clear */}
                  {sectorNodes.map((s: unknown) => {
                    const n = s as { x0: number; y0: number; x1: number; y1: number; data: { name: string } };
                    const col = SECTOR_COLORS[n.data.name] || "#646575";
                    return (
                      <g key={`sec-ol-${n.data.name}`}>
                        {/* paper halo first, so the colour keyline reads on any cell fill */}
                        <rect
                          x={n.x0 + 1}
                          y={n.y0 + 1}
                          width={Math.max(n.x1 - n.x0 - 2, 0)}
                          height={Math.max(n.y1 - n.y0 - 2, 0)}
                          rx={6}
                          fill="none"
                          stroke={SECTOR_HALO}
                          strokeWidth={14}
                        />
                        <rect
                          x={n.x0 + 1}
                          y={n.y0 + 1}
                          width={Math.max(n.x1 - n.x0 - 2, 0)}
                          height={Math.max(n.y1 - n.y0 - 2, 0)}
                          rx={6}
                          fill="none"
                          stroke={col}
                          strokeWidth={8}
                        />
                      </g>
                    );
                  })}
                </g>
              </g>
              {/* sector labels floated where blocks are roomy */}
              <g transform={`translate(${heat.ox},${heat.oy})`}>
                {sectorNodes.map((s: unknown) => {
                  const n = s as { x0: number; y0: number; x1: number; y1: number; data: { name: string } };
                  const w = n.x1 - n.x0;
                  const h = n.y1 - n.y0;
                  if (w < 74 || h < 46) return null;
                  const col = SECTOR_COLORS[n.data.name] || "#FFFDF6";
                  const label = n.data.name.toUpperCase();
                  const tabW = Math.min(label.length * 7.2 + 16, w - 10);
                  return (
                    <g key={`lbl-${n.data.name}`}>
                      <rect
                        x={n.x0 + 5}
                        y={n.y0 + 4}
                        width={tabW}
                        height={17}
                        rx={4}
                        fill={col}
                      />
                      <text
                        x={n.x0 + 5 + tabW / 2}
                        y={n.y0 + 16}
                        textAnchor="middle"
                        className="mm-maps__sector-lbl"
                        fill="#161B2E"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          ) : mode === "hq" ? (
            <g>
              <path d={geo.usPath} fill="#F2EDE0" stroke="none" />
              <path d={geo.statePath} fill="none" stroke="#C9BEA8" strokeWidth={0.75} vectorEffect="non-scaling-stroke" />
              {/* clusters + dots */}
              {hq.clusters.map((cl, i) => {
                const summed = cl.members.reduce((s, m) => s + m.co.cap, 0);
                const isOpen = openCluster === clusterSig(cl.members);
                if (cl.members.length === 1) {
                  const m = cl.members[0];
                  return (
                    <a key={`dot-${i}`} href={m.co.href}>
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={dotR(m.co.cap)}
                        fill="#176D5C"
                        fillOpacity={0.82}
                        stroke="#FFFDF6"
                        strokeWidth={1.5}
                        className="mm-maps__dot"
                        onMouseMove={(e) => showTip(e, m.co)}
                        onMouseEnter={(e) => showTip(e, m.co)}
                      />
                    </a>
                  );
                }
                return (
                  <g key={`cl-${i}`}>
                    {isOpen
                      ? cl.members.map((m, j) => {
                          const ang = (j / cl.members.length) * Math.PI * 2 - Math.PI / 2;
                          const rad = 46;
                          const dx = cl.x + Math.cos(ang) * rad;
                          const dy = cl.y + Math.sin(ang) * rad;
                          return (
                            <g key={`leg-${j}`}>
                              <line x1={cl.x} y1={cl.y} x2={dx} y2={dy} stroke="#176D5C" strokeWidth={1} strokeOpacity={0.5} />
                              <a href={m.co.href}>
                                <circle
                                  cx={dx}
                                  cy={dy}
                                  r={Math.max(dotR(m.co.cap) * 0.8, 7)}
                                  fill="#176D5C"
                                  fillOpacity={0.9}
                                  stroke="#FFFDF6"
                                  strokeWidth={1.5}
                                  className="mm-maps__dot"
                                  onMouseMove={(e) => showTip(e, m.co)}
                                  onMouseEnter={(e) => showTip(e, m.co)}
                                />
                                <text x={dx} y={dy + 3} textAnchor="middle" className="mm-maps__dot-tk" fill="#FFFDF6">
                                  {m.co.ticker}
                                </text>
                              </a>
                            </g>
                          );
                        })
                      : null}
                    <circle
                      cx={cl.x}
                      cy={cl.y}
                      r={Math.max(Math.sqrt(summed / hq.maxCap) * 26, 14)}
                      fill="#176D5C"
                      fillOpacity={isOpen ? 0.5 : 0.85}
                      stroke="#FFFDF6"
                      strokeWidth={2}
                      className="mm-maps__cluster"
                      onClick={() => openClusterFocus(cl)}
                    />
                    <text
                      x={cl.x}
                      y={cl.y + 4}
                      textAnchor="middle"
                      className="mm-maps__cluster-n"
                      fill="#FFFDF6"
                      onClick={() => openClusterFocus(cl)}
                    >
                      {isOpen ? "×" : cl.members.length}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : (
            <g className="mm-globe">
              {/* the box around the globe gets its own colour + a clear frame */}
              <rect x={8} y={8} width={W - 16} height={H - 16} rx={24} fill="#F4EEDF" stroke="#161B2E" strokeWidth={2.5} />
              <g clipPath="url(#mm-globe-clip)">
                {/* the sea */}
                <circle cx={W / 2} cy={H / 2} r={GLOBE_R * zoom} fill="url(#mm-globe-grad)" stroke="#161B2E" strokeWidth={2.5} />
                <path d={globe.gratPath} fill="none" stroke="#ffffff" strokeOpacity={0.38} strokeWidth={0.7} />
                {/* the land — light mint, keylined in ink so every coast is clear */}
                <path d={globe.landPath} fill="#B4E7D0" stroke="#161B2E" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
                {/* country borders */}
                <path d={globe.countryPath} fill="none" stroke="#1d6b53" strokeWidth={0.9} strokeOpacity={0.9} vectorEffect="non-scaling-stroke" />
                {/* US state borders */}
                <path d={globe.statePath} fill="none" stroke="#3c8c72" strokeWidth={0.6} strokeOpacity={0.7} vectorEffect="non-scaling-stroke" />
              {/* HQ dots + clusters at true locations */}
              {globe.clusters.map((cl, i) => {
                const summed = cl.members.reduce((s, m) => s + m.co.cap, 0);
                const isOpen = openCluster === clusterSig(cl.members);
                if (cl.members.length === 1) {
                  const m = cl.members[0];
                  return (
                    <a key={`g-dot-${i}`} href={m.co.href}>
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={dotR(m.co.cap)}
                        fill={SECTOR_COLORS[m.co.sector] || "#176D5C"}
                        fillOpacity={0.95}
                        stroke="#FFFDF6"
                        strokeWidth={2}
                        className="mm-maps__dot"
                        onMouseMove={(e) => showTip(e, m.co)}
                        onMouseEnter={(e) => showTip(e, m.co)}
                      />
                    </a>
                  );
                }
                return (
                  <g key={`g-cl-${i}`}>
                    {isOpen
                      ? cl.members.map((m, j) => {
                          const ang = (j / cl.members.length) * Math.PI * 2 - Math.PI / 2;
                          const spread = 40 + cl.members.length * 3;
                          const dx = cl.x + Math.cos(ang) * spread;
                          const dy = cl.y + Math.sin(ang) * spread;
                          return (
                            <g key={`g-leg-${j}`}>
                              <line x1={cl.x} y1={cl.y} x2={dx} y2={dy} stroke="#176D5C" strokeWidth={1} strokeOpacity={0.5} />
                              <a href={m.co.href}>
                                <circle
                                  cx={dx}
                                  cy={dy}
                                  r={Math.max(dotR(m.co.cap), 9)}
                                  fill={SECTOR_COLORS[m.co.sector] || "#176D5C"}
                                  fillOpacity={0.95}
                                  stroke="#FFFDF6"
                                  strokeWidth={2}
                                  className="mm-maps__dot"
                                  onMouseMove={(e) => showTip(e, m.co)}
                                  onMouseEnter={(e) => showTip(e, m.co)}
                                />
                                <text x={dx} y={dy + 3} textAnchor="middle" className="mm-maps__dot-tk" fill="#FFFDF6">
                                  {m.co.ticker}
                                </text>
                              </a>
                            </g>
                          );
                        })
                      : null}
                    <circle
                      cx={cl.x}
                      cy={cl.y}
                      r={Math.max(13 + Math.sqrt(summed / hq.maxCap) * 10, 14)}
                      fill="#176D5C"
                      fillOpacity={isOpen ? 0.5 : 0.85}
                      stroke="#FFFDF6"
                      strokeWidth={2}
                      className="mm-maps__cluster"
                      onClick={() => openClusterFocus(cl)}
                    />
                    <text x={cl.x} y={cl.y + 4} textAnchor="middle" className="mm-maps__cluster-n" fill="#FFFDF6" onClick={() => openClusterFocus(cl)}>
                      {isOpen ? "×" : cl.members.length}
                    </text>
                  </g>
                );
              })}
              {/* rim highlight */}
              <circle cx={W / 2} cy={H / 2} r={GLOBE_R * zoom} fill="none" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={1} />
              </g>
            </g>
          )}
        </svg>
        ) : (
          <div className="mm-maps__loading" aria-hidden="true" />
        )}

        {tip ? (
          <div
            className="mm-maps__tip"
            style={{ left: Math.min(tip.x + 14, W - 150), top: tip.y + 14 }}
          >
            <div className="mm-maps__tip-head">
              <b>{tip.co.ticker}</b> <span>{tip.co.name}</span>
            </div>
            <div className="mm-maps__tip-sub">
              {tip.co.sector}
            </div>
            <div className="mm-maps__tip-row">
              <span>Market cap</span>
              <em>{fmtCap(tip.co.cap)}</em>
            </div>
            <div className="mm-maps__tip-row">
              <span>Today</span>
              <em style={{ color: bucket(tip.co.change).bg }}>
                {tip.co.change === null ? "no data" : `${tip.co.change > 0 ? "+" : ""}${tip.co.change}%`}
              </em>
            </div>
          </div>
        ) : null}
      </div>

      {mode === "heat" ? (
        <div className="mm-maps__secbar" role="tablist" aria-label="Filter by sector">
          <button
            type="button"
            className={`mm-maps__secchip${activeSector === "all" ? " is-on" : ""}`}
            onClick={() => setActiveSector("all")}
            style={{ ["--chip" as string]: "#161b2e" }}
          >
            All sectors
          </button>
          {[...new Set(companies.map((c) => c.sector))].map((s) => (
            <button
              key={s}
              type="button"
              className={`mm-maps__secchip${activeSector === s ? " is-on" : ""}`}
              onClick={() => setActiveSector(s)}
              style={{ ["--chip" as string]: SECTOR_COLORS[s] || "#646575" }}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {mode === "globe" ? (
        <div className="mm-maps__secbar" aria-label="Focus a region">
          <button
            type="button"
            className="mm-maps__secchip"
            onClick={() => focusContinent([95, -38], 1)}
            style={{ ["--chip" as string]: "#161b2e" }}
          >
            World
          </button>
          {REGIONS.map((c) => (
            <button
              key={c.name}
              type="button"
              className="mm-maps__secchip"
              onClick={() => focusContinent(c.rot, c.zoom)}
              style={{ ["--chip" as string]: "#176d5c" }}
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mm-maps__legend">
        {mode === "heat" ? (
          <>
            <div className="mm-maps__ramp">
              {RAMP.map((r) => (
                <span key={r.label}>
                  <i style={{ background: r.bg }} />
                  <small>{r.label}</small>
                </span>
              ))}
            </div>
            <div className="mm-maps__sectors">
              {[...new Set(companies.map((c) => c.sector))].map((s) => (
                <span key={s}>
                  <i style={{ background: SECTOR_COLORS[s] || "#646575" }} />
                  {s}
                </span>
              ))}
            </div>
          </>
        ) : mode === "hq" ? (
          <div className="mm-maps__hqhint">
            Dot size = market cap. Click a numbered cluster to fan out the companies there.
          </div>
        ) : (
          <div className="mm-maps__hqhint">
            Pick a region, or drag to spin · scroll to zoom · click a cluster to fan out its companies.
          </div>
        )}
      </div>
    </div>
  );
}
