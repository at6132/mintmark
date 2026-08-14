"""Normalize extracted section CSS into scoped root classes."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "frontend" / "src" / "styles" / "shopify"

FIXES = {
    "mint-heatmap.css": ".ara-mint-heatmap",
    "mint-hq-map.css": ".ara-mint-hq-map",
}


def scope_css(text: str, root: str) -> str:
    # If already has root class at start as selector, skip
    if re.search(rf"^\s*\{re.escape(root)}\s*\{{", text, re.M):
        return text

    # Join bare `{` or `* {` roots with explicit class
    # Root block: leading optional space + `{` at start of CSS after whitespace
    text = re.sub(
        r"(?m)^\s*\{\s*$",
        f"  {root} {{",
        text,
        count=1,
    )
    text = text.replace("\n  * {", f"\n  {root} * {{", 1)

    # Nested selectors that already start with .ara- get root parent if not already
    def prefix(m: re.Match[str]) -> str:
        sel = m.group(1)
        if root in sel:
            return m.group(0)
        # only rewrite top-level selectors that start with .ara-
        parts = [p.strip() for p in sel.split(",")]
        out = []
        for p in parts:
            if p.startswith(root) or p.startswith(f"{root} "):
                out.append(p)
            elif p.startswith(".ara-") or p.startswith("#"):
                out.append(f"{root} {p}")
            else:
                out.append(p)
        return ",\n  ".join(out) + " {"

    # carefully only on lines that look like selector lines ending with {
    # too risky for full rewrite — manual approach for bare root only
    return text


def main() -> None:
    for name, root in FIXES.items():
        path = ROOT / name
        text = path.read_text(encoding="utf-8")
        fixed = scope_css(text, root)
        path.write_text(fixed, encoding="utf-8")
        print("updated", name)
        print(path.read_text(encoding="utf-8").splitlines()[:8])


if __name__ == "__main__":
    main()
