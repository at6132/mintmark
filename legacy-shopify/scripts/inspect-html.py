import re
import urllib.request

html = urllib.request.urlopen("https://mintmark-5.myshopify.com/", timeout=40).read().decode(
    "utf-8", "replace"
)
print("len", len(html))
print("cdn/shop/files count", html.count("/cdn/shop/files/"))
print("cdn.shopify.com count", html.count("cdn.shopify.com"))
# find any png urls
for pat in [
    r"https?://[^\"'\s]+?\.(?:png|jpe?g|webp)",
    r"//cdn\.shopify\.com[^\"'\s]+",
    r"/cdn/shop/files/[^\"'\s]+",
]:
    found = re.findall(pat, html)[:15]
    print("PAT", pat, "count", len(re.findall(pat, html)))
    for f in found[:8]:
        print(" ", f[:160])
