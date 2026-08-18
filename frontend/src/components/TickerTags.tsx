import { parseTickers, sectorForTicker } from "@/data/companies";
import { SECTOR_TONE } from "@/lib/sectors";

/**
 * The tickers a piece of content is tagged to. A piece can carry several — the
 * field holds a comma-separated list — and each chip is coloured by that
 * company's sector, so the tag says which part of the market it belongs to.
 */
export function TickerTags({ tickers, className = "" }: { tickers?: string | null; className?: string }) {
  const list = parseTickers(tickers);
  if (!list.length) return null;
  return (
    <>
      {list.map((t) => (
        <b
          key={t}
          className={`mm-tick${className ? ` ${className}` : ""}`}
          style={{ ["--chip" as string]: SECTOR_TONE[sectorForTicker(t)] || "#646575" }}
        >
          {t}
        </b>
      ))}
    </>
  );
}
