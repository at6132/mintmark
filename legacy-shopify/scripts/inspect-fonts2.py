import re
from pathlib import Path
import urllib.request

html = urllib.request.urlopen("https://mintmark-5.myshopify.com/", timeout=40).read().decode(
    "utf-8", "replace"
)

# dump all style tags content snippets with fonts
styles = re.findall(r"<style[^>]*>(.*?)</style>", html, flags=re.S | re.I)
print("style blocks", len(styles))
for i, s in enumerate(styles):
    if "font" in s.lower() or "alegreya" in s.lower() or "acme" in s.lower() or "font-face" in s.lower():
        Path(__file__).resolve().parent.joinpath(f"_style_{i}.css").write_text(s, encoding="utf-8")
        print("wrote _style_%d.css len" % i, len(s))
        # print first font-related lines
        for line in s.splitlines():
            if re.search(r"font|Acme|Alegreya|Inter", line, re.I):
                print(" ", line.strip()[:160])

# Also check if --font-heading-family single exists as assignment
for m in re.finditer(r"--font-[a-z]+-family\s*:", html):
    print("ASSIGN", html[m.start() : m.start() + 80].replace("\n", " "))
for m in re.finditer(r"--font-[a-z]+--family\s*:", html):
    print("ASSIGN2", html[m.start() : m.start() + 100].replace("\n", " "))
