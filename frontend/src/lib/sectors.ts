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
