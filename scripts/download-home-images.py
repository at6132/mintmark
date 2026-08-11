"""Download all image assets from the live Mintmark Shopify store via browser-discovered URLs."""
from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "website" / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)

UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

# Home CDN mapping (confirmed live page)
HOME = {
    "logo.png": "https://mintmark-5.myshopify.com/cdn/shop/files/998e0312-86aa-4378-93dc-880407058e09.png",
    "hero-books.png": "https://mintmark-5.myshopify.com/cdn/shop/files/mintmark_icon_books_columns_v4.png",
    "nvda-lead.png": "https://mintmark-5.myshopify.com/cdn/shop/files/ca8c3145-6906-4671-80cd-6fcfa6d30978.png",
    "question-costco.png": "https://mintmark-5.myshopify.com/cdn/shop/files/3add82d2-d31f-49e7-a04c-eb2f19106ffa.png",
    "apple-feature.png": "https://mintmark-5.myshopify.com/cdn/shop/files/8c72f11b-3415-4cdb-ac0c-643eacf49247.png",
    "costco-feature.png": "https://mintmark-5.myshopify.com/cdn/shop/files/9e94f435-a031-4cf3-8052-21cae80091c4.png",
}


def download(url: str, dest: Path, force: bool = False) -> bool:
    if dest.exists() and dest.stat().st_size > 500 and not force:
        print(f"keep {dest.name} ({dest.stat().st_size})")
        return True
    try:
        req = urllib.request.Request(url.split("?")[0], headers=UA)
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
        dest.write_bytes(data)
        print(f"ok  {dest.name} {len(data)}")
        return True
    except Exception as e:
        print(f"fail {url}: {e}")
        return False


def main():
    for name, url in HOME.items():
        download(url, OUT / name, force=True)

    extra = json.loads((OUT / "extra-urls.json").read_text()) if (OUT / "extra-urls.json").exists() else []
    for i, url in enumerate(extra):
        name = re.sub(r"[^a-zA-Z0-9._-]+", "-", url.rstrip("/").split("/")[-1].split("?")[0])
        if not re.search(r"\.(png|jpe?g|webp|gif)$", name, re.I):
            name = f"extra-{i}.png"
        download(url, OUT / name)

    files = {
        p.name: p.stat().st_size
        for p in OUT.iterdir()
        if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    }
    (OUT / "manifest.json").write_text(json.dumps(files, indent=2), encoding="utf-8")
    print("done", len(files))


if __name__ == "__main__":
    main()
