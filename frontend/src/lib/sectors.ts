/**
 * One sector palette for the whole site.
 *
 * Six hues chosen to stay legible against the heat map's red and green cells —
 * blue, amber, magenta, violet, burnt orange, deep teal — all well outside the
 * red/green band, and each dark enough to double as text on cream. The heat map
 * keylines, the sector tabs, the legend and the catalog filter chips all read
 * from these same values.
 */
export const SECTOR_COLORS: Record<string, string> = {
  Technology: "#0B3FD8", // blue
  Financials: "#B26A00", // amber
  Healthcare: "#A3007A", // magenta
  Consumer: "#6A2BD9", // violet
  Energy: "#C2410C", // burnt orange
  Industrials: "#114B5F", // deep teal
};

/** The same values keyed by the catalog's sector ids, plus its extra categories. */
export const SECTOR_TONE: Record<string, string> = {
  all: "#161b2e",
  classics: "#7A5C1E",
  technology: SECTOR_COLORS.Technology,
  consumer: SECTOR_COLORS.Consumer,
  industrials: SECTOR_COLORS.Industrials,
  "food-beverage": "#B0004E",
  financials: SECTOR_COLORS.Financials,
  healthcare: SECTOR_COLORS.Healthcare,
  energy: SECTOR_COLORS.Energy,
  retail: "#0E7490",
  other: "#4A4A5A",
};

/** Paper the heat-map keylines are haloed against, so they read on any cell. */
export const SECTOR_HALO = "#FFFDF6";

/* ---------------------------------------------------------------------------
 * Laying sectors out so like colours sit apart
 * ------------------------------------------------------------------------ */

/** Hue angle (0–360) of a hex colour. Grey/black return 0. */
function hueOf(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let deg: number;
  if (max === r) deg = ((g - b) / d) % 6;
  else if (max === g) deg = (b - r) / d + 2;
  else deg = (r - g) / d + 4;
  return (deg * 60 + 360) % 360;
}

/** Shortest distance between two hue angles, 0–180. */
function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Order sector names so that neighbours are as far apart in hue as possible —
 * the treemap lays its groups out in child order, so this is what stops two
 * similar colours ending up side by side.
 *
 * Small sets are brute-forced (6 sectors = 720 permutations), maximising the
 * *smallest* gap between neighbours and using the total gap as a tiebreak.
 * Anything larger falls back to a greedy farthest-next walk.
 */
export function orderSectorsByContrast(names: string[]): string[] {
  if (names.length < 3) return names;
  const hues = new Map(names.map((n) => [n, hueOf(SECTOR_COLORS[n] || "#646575")]));
  const score = (order: string[]) => {
    let min = Infinity;
    let total = 0;
    for (let i = 1; i < order.length; i += 1) {
      const g = hueGap(hues.get(order[i - 1])!, hues.get(order[i])!);
      min = Math.min(min, g);
      total += g;
    }
    return { min, total };
  };

  if (names.length <= 8) {
    let best: string[] = names;
    let bestScore = score(names);
    const permute = (rest: string[], acc: string[]) => {
      if (!rest.length) {
        const s = score(acc);
        if (s.min > bestScore.min || (s.min === bestScore.min && s.total > bestScore.total)) {
          best = [...acc];
          bestScore = s;
        }
        return;
      }
      rest.forEach((n, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, n]));
    };
    permute(names, []);
    return best;
  }

  const remaining = [...names];
  const out = [remaining.shift()!];
  while (remaining.length) {
    const last = hues.get(out[out.length - 1])!;
    let far = 0;
    remaining.forEach((n, i) => {
      if (hueGap(last, hues.get(n)!) > hueGap(last, hues.get(remaining[far])!)) far = i;
    });
    out.push(remaining.splice(far, 1)[0]);
  }
  return out;
}
