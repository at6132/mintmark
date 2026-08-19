import type { CSSProperties } from "react";

/**
 * The one digest cover on the site — conveyor belt, quick-open module, and the
 * module's past-issue grid. Deliberately minimal: two gold bands and a single
 * line. What that line says depends on what is already on screen beside it —
 * the belt shows the company name, the module shows the ticker because its
 * heading already names the company. Nothing else is printed on a cover; the
 * issue's quarter is screen furniture, labelled next to it.
 */
export function DigestCover({
  label,
  accent = "#176d5c",
  size = "md",
  className = "",
}: {
  label: string;
  accent?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={`mm-cover mm-cover--${size}${className ? ` ${className}` : ""}`}
      style={{ ["--co" as string]: accent } as CSSProperties}
    >
      <span className="mm-cover__band" aria-hidden="true" />
      <span className="mm-cover__mark">{label}</span>
      <span className="mm-cover__band mm-cover__band--lo" aria-hidden="true" />
    </span>
  );
}
