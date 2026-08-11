import json
import re
import urllib.request
from pathlib import Path

base = "https://mintmark-5.myshopify.com"
pages = [
    "/",
    "/pages/mission",
    "/pages/mint",
    "/pages/bookshelf",
    "/pages/catalog",
    "/pages/contact",
    "/pages/apple",
    "/pages/nvidia-digest",
]
out_dir = Path("website/public/images")
out_dir.mkdir(parents=True, exist_ok=True)
all_imgs = {}

pat = re.compile(
    r"(?:https?:)?//mintmark-5\.myshopify\.com/cdn/shop/files/([A-Za-z0-9._%-]+?\.(?:png|jpe?g|webp|gif|svg))",
    re.I,
)

for p in pages:
    url = base + p
    try:
        with urllib.request.urlopen(url, timeout=40) as r:
            html = r.read().decode("utf-8", "replace")
    except Exception as e:
        print("FAIL", p, e)
        continue
    found = set(pat.findall(html))
    print(p, "unique files", len(found))
    for name in found:
        all_imgs[name] = f"https://mintmark-5.myshopify.com/cdn/shop/files/{name}"

print("TOTAL", len(all_imgs))
for name, url in sorted(all_imgs.items()):
    dest = out_dir / name
    if dest.exists() and dest.stat().st_size > 1000:
        print("skip", name)
        continue
    try:
        req = urllib.request.Request(url + "?width=2000", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        dest.write_bytes(data)
        print("saved", name, len(data))
    except Exception as e:
        print("err", name, e)

(out_dir / "manifest.json").write_text(json.dumps(sorted(all_imgs.keys()), indent=2), encoding="utf-8")
print("done")
