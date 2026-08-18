// Shared colour taxonomy — one source of truth for sector + size colours
// so the heat map, conveyor, modules and tags all read consistently.

export const SECTOR_COLORS: Record<string, string> = {
  Technology: "#1fa88f",
  Financials: "#e0a526",
  Healthcare: "#9a5ba6",
  Consumer: "#7a9e5b",
  Energy: "#c25b3f",
  Industrials: "#4c6b8a",
  Classics: "#3a5be0",
};

export function sectorColor(sector?: string): string {
  if (!sector) return "#646575";
  const key = sector.trim();
  return (
    SECTOR_COLORS[key] ||
    SECTOR_COLORS[key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()] ||
    "#646575"
  );
}

// size tiers, largest → smallest, each with its own colour
export const SIZE_TIERS: Array<{ key: string; label: string; color: string; note: string }> = [
  { key: "hyperscaler", label: "Hyperscaler", color: "#161b2e", note: "$1T+ — the giants that run the internet" },
  { key: "mega", label: "Mega cap", color: "#22389a", note: "$200B+ — household-name leaders" },
  { key: "large", label: "Large cap", color: "#3a5be0", note: "$10B–$200B — established companies" },
  { key: "mid", label: "Mid cap", color: "#1fa88f", note: "$2B–$10B — growing businesses" },
  { key: "small", label: "Small cap", color: "#7a9e5b", note: "$300M–$2B — smaller, riskier" },
  { key: "micro", label: "Micro cap", color: "#e0a526", note: "$50M–$300M — tiny and volatile" },
  { key: "nano", label: "Nano cap", color: "#c25b3f", note: "under $50M — the smallest listed" },
];

export const SIZE_COLOR: Record<string, string> = SIZE_TIERS.reduce((acc, t) => {
  acc[t.label.toUpperCase()] = t.color;
  acc[t.key] = t.color;
  return acc;
}, {} as Record<string, string>);

export function sizeColor(label?: string): string {
  if (!label) return "#646575";
  return SIZE_COLOR[label.toUpperCase()] || SIZE_COLOR[label.toLowerCase()] || "#646575";
}

// market cap (in $B) → tier label
export function sizeTierForCap(capB: number): { label: string; color: string } {
  if (capB >= 1000) return { label: "Hyperscaler", color: "#161b2e" };
  if (capB >= 200) return { label: "Mega cap", color: "#22389a" };
  if (capB >= 10) return { label: "Large cap", color: "#3a5be0" };
  if (capB >= 2) return { label: "Mid cap", color: "#1fa88f" };
  if (capB >= 0.3) return { label: "Small cap", color: "#7a9e5b" };
  if (capB >= 0.05) return { label: "Micro cap", color: "#e0a526" };
  return { label: "Nano cap", color: "#c25b3f" };
}
