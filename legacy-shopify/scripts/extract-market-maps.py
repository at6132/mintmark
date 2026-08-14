import json
import re
from pathlib import Path

THEME = Path(__file__).resolve().parents[1]
FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
raw = (THEME / "templates" / "page.mint.json").read_text(encoding="utf-8")
# strip leading block comment
raw = re.sub(r"/\*.*?\*/", "", raw, count=1, flags=re.S).strip()
data = json.loads(raw)
mm = data["sections"]["market_maps"]
companies = []
for bid in mm["block_order"]:
    s = mm["blocks"][bid]["settings"]
    companies.append({"id": bid, **s})
out = {"settings": mm["settings"], "companies": companies}
path = FRONTEND / "src" / "data" / "marketMaps.ts"
path.write_text(
    "export const marketMapsContent = "
    + json.dumps(out, indent=2, ensure_ascii=False)
    + " as const;\n",
    encoding="utf-8",
)
print("wrote", path, len(companies))
