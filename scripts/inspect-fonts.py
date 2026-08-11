import urllib.request
import re

html = urllib.request.urlopen("https://mintmark-5.myshopify.com/", timeout=40).read().decode(
    "utf-8", "replace"
)
Path = __import__("pathlib").Path
Path("scripts/_shop-fonts-snippet.html").write_text(html[:50000], encoding="utf-8")
print("len", len(html))
for pat, label in [
    (r"--font-[a-z0-9\-]+", "vars"),
    (r"font-family:\s*[^;}{]+", "families"),
    (r"fonts\.shopifycdn\.com[^\"'\s]+", "shopifycdn"),
    (r"@font-face", "faces"),
    (r"Acme|Alegreya|Inter", "names"),
]:
    found = re.findall(pat, html, flags=re.I)
    print(label, len(found))
    for f in found[:15]:
        print(" ", f[:140])
