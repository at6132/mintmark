"""Extract all shopify://shop_images/* from theme JSON templates and download them."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)
UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}
CDN = "https://mintmark-5.myshopify.com/cdn/shop/files/"

refs: set[str] = set()
for p in (ROOT / "templates").rglob("*.json"):
    text = p.read_text(encoding="utf-8", errors="replace")
    for m in re.findall(r"shopify://shop_images/([^\"'\\]+)", text):
        refs.add(m)
# also sections/config
for folder in ["sections", "config", "templates"]:
    d = ROOT / folder
    if not d.exists():
        continue
    for p in d.rglob("*"):
        if p.suffix.lower() not in {".json", ".liquid"}:
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        for m in re.findall(r"shopify://shop_images/([^\"'\\]+)", text):
            refs.add(m)

print("unique shop_images", len(refs))
for name in sorted(refs):
    print(" ", name)

( OUT / "shop-image-refs.json").write_text(json.dumps(sorted(refs), indent=2), encoding="utf-8")

ok = 0
for name in sorted(refs):
    dest = OUT / name
    # also create shortened aliases already used
    if dest.exists() and dest.stat().st_size > 500:
        print(f"keep {name} {dest.stat().st_size}")
        ok += 1
        continue
    url = CDN + name
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
        dest.write_bytes(data)
        print(f"ok   {name} {len(data)}")
        ok += 1
    except Exception as e:
        print(f"fail {name}: {e}")

print(f"downloaded/kept {ok}/{len(refs)}")
