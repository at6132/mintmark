import json
import re
from pathlib import Path


def load(p: str):
    t = Path(p).read_text(encoding="utf-8")
    t = re.sub(r"/\*.*?\*/", "", t, flags=re.S)
    return json.loads(t)


def blocks_settings(section):
    order = section.get("block_order") or list(section.get("blocks", {}).keys())
    out = []
    for bid in order:
        b = section["blocks"][bid]
        out.append({"id": bid, "type": b["type"], **b.get("settings", {})})
    return out


def fix_link(u: str):
    if not u:
        return ""
    u = u.replace("shopify://pages/", "/").replace("/pages/", "/")
    if u.startswith("/the-mint"):
        u = "/mint"
    if u.startswith("/catalog"):
        u = "/companies"
    return u


def strip_imgs(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if isinstance(v, str) and v.startswith("shopify://shop_images/"):
                continue  # hosted CDN assets not in the theme zip
            out[k] = strip_imgs(v)
        return out
    if isinstance(obj, list):
        return [strip_imgs(x) for x in obj]
    if isinstance(obj, str):
        if obj.startswith("shopify://") or obj.startswith("/pages/"):
            return fix_link(obj)
        return obj
    return obj


def write_ts(root: Path, name: str, var: str, data):
    path = root / f"{name}.ts"
    path.write_text(
        f"export const {var} = {json.dumps(data, indent=2, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    print("wrote", path)


def main():
    root = Path("website/src/data")
    root.mkdir(parents=True, exist_ok=True)
    Path("website/data").mkdir(parents=True, exist_ok=True)
    Path("website/public/graphics").mkdir(parents=True, exist_ok=True)

    idx = load("templates/index.json")
    hero = idx["sections"]["ara_mintmark_hero_PJWetF"]
    ed = idx["sections"]["ara_editorial_front_page_2026"]
    email = idx["sections"]["ara_inline_email_gT9Kfm"]
    home = strip_imgs(
        {
            "hero": {**hero["settings"], "blocks": blocks_settings(hero)},
            "editorial": {**ed["settings"], "blocks": blocks_settings(ed)},
            "email": email["settings"],
        }
    )

    bs = load("templates/page.bookshelf.json")
    cat = bs["sections"]["ara_bookshelf_catalog_section_YLPidY"]
    books = strip_imgs({"settings": cat["settings"], "books": blocks_settings(cat)})

    ms = load("templates/page.mission.json")
    mission = strip_imgs(
        {
            "settings": ms["sections"]["mission_story"]["settings"],
            "chapters": blocks_settings(ms["sections"]["mission_story"]),
        }
    )

    ct = load("templates/page.contact.json")
    contact = strip_imgs(
        {
            "settings": ct["sections"]["contact_editorial"]["settings"],
            "channels": blocks_settings(ct["sections"]["contact_editorial"]),
        }
    )

    mint = load("templates/page.mint.json")
    curriculum = strip_imgs(
        {
            "settings": mint["sections"]["mint_curriculum"]["settings"],
            "levels": blocks_settings(mint["sections"]["mint_curriculum"]),
        }
    )
    markets_raw = mint["sections"].get("market_maps")
    markets = strip_imgs(
        {
            "settings": markets_raw["settings"] if markets_raw else {},
            "companies": blocks_settings(markets_raw) if markets_raw else [],
        }
    )

    cg = load("templates/page.cataloge.json")
    grid = cg["sections"]["main"]
    catalog = strip_imgs({"settings": grid["settings"], "companies": blocks_settings(grid)})

    ap = load("templates/page.apple.json")
    apple_sections = {}
    for k, v in ap["sections"].items():
        apple_sections[k] = strip_imgs(
            {
                "type": v["type"],
                "settings": v.get("settings", {}),
                "blocks": blocks_settings(v) if v.get("blocks") else [],
            }
        )

    nv = load("templates/page.nvidia-digest.json")
    nvidia = strip_imgs(
        {
            k: {
                "type": v["type"],
                "settings": v.get("settings", {}),
                "blocks": blocks_settings(v) if v.get("blocks") else [],
            }
            for k, v in nv["sections"].items()
        }
    )

    hdr = load("sections/header-group.json")
    hsec = hdr["sections"]["ara_mintmark_header_HdqFgM"]
    tsec = hdr["sections"]["ara_mintmark_top_bar_49AABz"]
    ftr = load("sections/footer-group.json")["sections"]["ara_mintmark_footer_fMnYwH"]
    nav = []
    for b in blocks_settings(hsec):
        nav.append(
            {
                "title": b["title"],
                "subtitle": b.get("subtitle", ""),
                "href": fix_link(b.get("link", "")),
            }
        )
    # fix catalog route
    for n in nav:
        if n["title"] == "COMPANIES" and not n["href"]:
            n["href"] = "/companies"
        if n["href"] in ("/catalog", "/cataloge"):
            n["href"] = "/companies"

    site = strip_imgs(
        {
            "name": "Mintmark",
            "tagline": "Big Ideas for Small Readers",
            "topBar": tsec["settings"],
            "header": {**hsec["settings"], "nav": nav},
            "footer": ftr["settings"],
            "footerLinks": [
                {
                    "heading": "Explore",
                    "links": [
                        {"title": "Mission", "href": "/mission"},
                        {"title": "The Mint", "href": "/mint"},
                        {"title": "Bookshelf", "href": "/bookshelf"},
                        {"title": "Companies", "href": "/companies"},
                    ],
                },
                {
                    "heading": "Read",
                    "links": [
                        {"title": "Apple File", "href": "/companies/apple"},
                        {"title": "NVIDIA Digest", "href": "/digests/nvidia"},
                        {"title": "Shop Digests", "href": "/shop"},
                    ],
                },
                {
                    "heading": "Support",
                    "links": [
                        {"title": "Contact", "href": "/contact"},
                        {"title": "Cart", "href": "/cart"},
                    ],
                },
            ],
        }
    )

    products = []
    for b in books["books"]:
        if b.get("type") != "book":
            continue
        slug = re.sub(r"[^a-z0-9]+", "-", b["company_name"].lower()).strip("-")
        products.append(
            {
                "id": slug,
                "slug": slug,
                "company": b["company_name"],
                "title": b.get("digest_title") or f"The {b['company_name']} Digest",
                "price": 24.0,
                "currency": "USD",
                "status": b.get("status", "COMING SOON"),
                "sector": b.get("sector_label", ""),
                "ticker": b.get("ticker", ""),
                "summary": b.get("summary", ""),
                "volume": b.get("volume", ""),
                "color": b.get("color", "green"),
                "moduleLink": fix_link(b.get("module_link", "")),
                "headquarters": b.get("headquarters", ""),
                "spineHeight": b.get("spine_height", 400),
                "spineWidth": b.get("spine_width", 72),
            }
        )

    write_ts(root, "home", "homeContent", home)
    write_ts(root, "books", "bookshelfContent", books)
    write_ts(root, "mission", "missionContent", mission)
    write_ts(root, "contact", "contactContent", contact)
    write_ts(root, "mint", "mintContent", {"curriculum": curriculum, "markets": markets})
    write_ts(root, "catalog", "catalogContent", catalog)
    write_ts(root, "apple", "appleContent", apple_sections)
    write_ts(root, "nvidia", "nvidiaContent", nvidia)
    write_ts(root, "site", "siteContent", site)
    write_ts(root, "products", "products", products)

    Path("website/data/products.json").write_text(json.dumps(products, indent=2), encoding="utf-8")
    Path("website/data/subscribers.json").write_text("[]", encoding="utf-8")
    Path("website/data/messages.json").write_text("[]", encoding="utf-8")
    print("done")


if __name__ == "__main__":
    main()
