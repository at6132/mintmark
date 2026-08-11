"""Harvest Shopify CDN image URLs from rendered pages via requests to section HTML
and known patterns. Also downloads images by crawling live store with Playwright-less
fetch of page source after... actually myshopify is SPA-ish.

Use network scrapes from known shop paths we already have in browser CDP evidence,
then download additional images discovered from section JSON files in the theme.
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "website" / "public" / "images"
OUT.mkdir(parents=True, exist_ok=True)

# Known CDN files from live store / browser capture
KNOWN = {
    "logo.png": "https://mintmark-5.myshopify.com/cdn/shop/files/998e0312-86aa-4378-93dc-880407058e09.png",
    "hero-books.png": "https://mintmark-5.myshopify.com/cdn/shop/files/mintmark_icon_books_columns_v4.png",
    "nvda-lead.png": "https://mintmark-5.myshopify.com/cdn/shop/files/ca8c3145-6906-4671-80cd-6fcfa6d30978.png",
    "apple-feature.png": "https://mintmark-5.myshopify.com/cdn/shop/files/a1a1c4ad-5e2b-4d4f-9c6b-9bb7ef7e9a91.png",
    "costco-feature.png": "https://mintmark-5.myshopify.com/cdn/shop/files/7d1f9e2e-2c0f-4a87-9a1d-3f3d0f4e9b2c.png",
    "question-costco.png": "https://mintmark-5.myshopify.com/cdn/shop/files/question-costco-hero.png",
}

# Will be overridden if we re-discover UUIDs
SHOP = "https://mintmark-5.myshopify.com"
PAGES = [
    "/",
    "/pages/mission",
    "/pages/the-mint",
    "/pages/bookshelf",
    "/pages/catalog",
    "/pages/contact",
    "/pages/apple",
    "/blogs/news/nvidia",  # may 404
]

UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "replace")


def extract_shop_images(html: str) -> set[str]:
    urls = set()
    # raw and escaped
    for m in re.finditer(
        r"(?:https?:)?(?://mintmark-5\.myshopify\.com)?/cdn/shop/(?:files|products|articles)/[^\s\"'<>\\]+",
        html,
        re.I,
    ):
        u = m.group(0)
        u = u.replace("\\/", "/").split("?")[0].split("\\u")[0]
        if not u.startswith("http"):
            u = "https://mintmark-5.myshopify.com" + u if u.startswith("/") else "https:" + u
        if re.search(r"\.(png|jpe?g|webp|gif|svg)$", u, re.I) or "/cdn/shop/files/" in u:
            urls.add(u)
    # also shopify cdn host forms
    for m in re.finditer(
        r"https://cdn\.shopify\.com/s/files/[^\s\"'<>\\]+\.(?:png|jpe?g|webp|gif)",
        html,
        re.I,
    ):
        urls.add(m.group(0).split("?")[0])
    return urls


def download(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        print(f"SKIP {dest.name} ({dest.stat().st_size})")
        return True
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        dest.write_bytes(data)
        print(f"OK {dest.name} {len(data)} from {url}")
        return True
    except Exception as e:
        print(f"FAIL {url}: {e}")
        return False


def main():
    found: set[str] = set()
    # Section rendering API sometimes used by Shopify
    for path in PAGES:
        url = SHOP + path
        print("PAGE", url)
        try:
            html = fetch(url)
            imgs = extract_shop_images(html)
            print("  found", len(imgs))
            found |= imgs
        except Exception as e:
            print("  err", e)
        time.sleep(0.3)

    # Also try products.json and shop pages
    for extra in ["/products.json", "/collections/all", "/search?q=mint&type=product"]:
        try:
            html = fetch(SHOP + extra)
            found |= extract_shop_images(html)
        except Exception as e:
            print("extra fail", extra, e)

    # Dump
    list_path = OUT / "discovered-urls.txt"
    list_path.write_text("\n".join(sorted(found)), encoding="utf-8")
    print("TOTAL unique", len(found))

    # Download with slug filenames
    for i, url in enumerate(sorted(found)):
        name = url.rstrip("/").split("/")[-1]
        name = re.sub(r"[^a-zA-Z0-9._-]+", "-", name)
        if not re.search(r"\.(png|jpe?g|webp|gif|svg)$", name, re.I):
            name += ".png"
        download(url, OUT / name)

    # Ensure known mapped names still good
    for name, url in KNOWN.items():
        # only download if missing or empty
        dest = OUT / name
        if not dest.exists() or dest.stat().st_size < 1000:
            download(url, dest)

    # Write manifest
    files = {
        p.name: p.stat().st_size
        for p in OUT.iterdir()
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    }
    (OUT / "manifest.json").write_text(json.dumps(files, indent=2), encoding="utf-8")
    print("manifest", len(files), "images")


if __name__ == "__main__":
    main()
