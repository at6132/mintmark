from pathlib import Path

# Common mojibake when UTF-8 was decoded as windows-1252/latin-1
REPLACEMENTS = [
    ("Â·", "·"),
    ("â–²", "▲"),
    ("â–¼", "▼"),
    ("â€”", "—"),
    ("â€“", "–"),
    ("â€˜", "\u2018"),
    ("â€™", "\u2019"),
    ("â€œ", "\u201c"),
    ("â€\x9d", "\u201d"),
    ("â€¦", "…"),
    ("Ã—", "×"),
    ("Â ", " "),
    ("Ã©", "é"),
    ("Ã ", "à"),
]


def fix_text(text: str) -> str:
    for bad, good in REPLACEMENTS:
        text = text.replace(bad, good)
    return text


def main() -> None:
    roots = [
        Path(__file__).resolve().parents[2] / "frontend" / "src" / "data",
        Path(__file__).resolve().parents[2] / "frontend" / "src" / "components",
        Path(__file__).resolve().parents[2] / "frontend" / "src" / "app",
    ]
    for root in roots:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if p.suffix.lower() not in {".ts", ".tsx", ".js", ".jsx", ".json", ".css"}:
                continue
            try:
                orig = p.read_text(encoding="utf-8")
            except Exception:
                continue
            fixed = fix_text(orig)
            if fixed != orig:
                p.write_text(fixed, encoding="utf-8")
                print("fixed", p)


if __name__ == "__main__":
    main()
