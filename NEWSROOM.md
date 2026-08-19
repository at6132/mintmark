# EXECUTE NEWSROOM — the graphical spec

What to render, where it goes, and which rules govern it. This file is the
contract: if a slot is not listed here, it does not exist on the page.

Content is **data only**. Nothing in `app/` or `components/` changes to publish
a day or add a company. Sourcing rules live elsewhere; this is the graphics.

---

## 1. Where content lives

| File | Holds |
|---|---|
| `frontend/src/data/home.ts` → `editorial.blocks` | the day's newsroom |
| `frontend/src/data/companies.ts` → `companies[]` | every company file |
| `frontend/src/data/marketMaps.ts` → `companies[]` | heat map + globe |
| `frontend/src/data/products.ts` | purchasable digests |
| `frontend/src/data/books.ts` | the bookshelf |
| `frontend/src/lib/sectors.ts` | the sector palette — **read only** |

`data/site.ts`, `data/mission.ts`, `data/contact.ts` and `data/mint.ts` are the
website's own words. They are not day content. Leave them alone.

---

## 2. The newsroom page — one block type per slot

Every block goes in `home.ts → editorial.blocks` and carries `id` + `type`.

| `type` | Renders as | Count | Required fields |
|---|---|---|---|
| `lead_story` | the featured plate, top left | **1** | `article_number`, `story_type`, `ticker`, `company`, `heading`, `description`, `link_label`, `link`, `accent_color` |
| `featured_story` | further slides in the same plate | 2–3 | `number`, `story_type`, `ticker`, `company`, `heading`, `summary`, `link_label`, `link`, `accent_color` |
| `market_news` | flip strips, right column | **8** | `ticker`, `heading`, `summary`, `link` |
| `quick_take` | Short Takes squares | **8** | `number`, `ticker`, `company`, `heading`, `summary`, `link` |
| `stock_report` | Company Pitches cards | **4** | `ticker`, `company`, `heading`, `summary`, `link_label`, `link` |
| `question` | the dark Company Question band | **1** | `label`, `heading`, `description`, `link_label`, `link` |
| `market_item` | hero ticker row | 8 | `label`, `value`, `change`, `direction` |

The featured plate is data-driven: it shows every `lead_story` and
`featured_story` in order, with arrows and dots appearing when there is more
than one. Add a block, get a slide.

### Fixed behaviour per slot — do not re-specify

- **Market news** flips on hover (`rotateY`, .5s). Summary on the back.
- **Market news** strips show the ticker only — no date.
- **Short takes** flip vertically (`rotateX`, .52s). **No price change, no price
  chart, no period** — the fact is the point. Foot reads `Short take`.
- **Company pitches** do not flip. `READ THE PITCH →` sits on the front.
- **Question** is static, dark, with the hover pulse.

---

## 3. Tagging — a piece can name several companies

Every `ticker` field holds a **comma-separated list**: `"EXCO, EXBK"`. Each
ticker renders as its own chip, coloured by **that company's sector**, so the
tag says which part of the market the piece belongs to before a word is read.

A ticker only resolves if a company with that ticker exists in
`data/companies.ts`; unknown tickers fall back to neutral grey. When a day
publishes, the piece is appended to the archive of **every** company it names.

---

## 4. The colour law

Colour carries meaning. It is never decorative.

**Section colourways** — each newsroom section owns a `--t1`/`--t2` pair, set on
the section container in `newsroom-trims.css`. The cards' rotating trim, the
divider diamonds and the section underline all read from it:

| Section | Pair |
|---|---|
| Featured | gold → amber (its own sliding plate trim + register marks) |
| Market news | `#5f86ee` → `#7fd9c4` |
| Short takes | `#2aa78f` → `#d9a531` |
| Pitches | `#8fdcc8` → `#cf7f86` |
| Market maps | `#2f7e8c` → `#8fdcc8` |
| Question | `#3a5be0` → `#e0a526` |

**Sector colours** come from `SECTOR_TONE` in `lib/sectors.ts` and mark
anything company-specific: card marker, catalog group rule, ticker chip, filter
chip, and the module's header **trim**. A company's `sector` must be an id in
that map.

Two things are deliberately exempt:
- the module **header background** — that is the company's own `accent_color`;
- the **digest cover** — a book keeps its own jacket.

---

## 5. The company module (quick-open)

Opens from a catalog card or a belt cover. Order is fixed:

1. **Header** — company `accent_color` background, sector-coloured 9px trim,
   name, ticker chip, business model + HQ chips.
2. **Profile** — HQ map pinned from `profile.lon/lat`, six-range **share price
   return** (returns only, no charts), then the profile rows.
3. **Digest** — one cover showing the **ticker**, the issue `<select>`, price,
   Add to cart, Add to Bookshelf.
4. **News from FIN** — the mixed feed (below).

### The feed — an archive, not a day

`companies[].feed` is everything the newsroom has **ever** tagged to that
company, newest first. Publishing a day **appends** its company-tagged blocks to
this array; it never replaces it. The module round-robins by `kind` at render
time so types alternate rather than clump, which means order only has to be
newest-first *within* each kind. Each piece renders in **the newsroom's own components** —
there is no second card style — packed into a dense two-track mosaic:

| `kind` | Component | Width |
|---|---|---|
| `news` | flip strip | full |
| `short` | flip square | half |
| `pitch` / `story` | static square | half; every 3rd full |
| `view` | question band | full |

Type scale, smallest first: **date 8px** → foot 9px → number 13px → headline
14.5px (17px on wide bands) → view 18px. Dates are always the smallest thing on
a card.

**Advertising rule** — `AD_EVERY = 8`, `AD_MIN_LEAD = 5`: at most one ad per 8
pieces, never before 5 have run. Do not hardcode ad positions.

---

## 6. Covers

One component, `DigestCover`, everywhere. Two gold bands, **one line**, raised
spine, ratio 120/162. Nothing else is printed on a cover — an issue's quarter is
screen furniture, captioned beside it.

- conveyor belt → the **company name**
- module + receipts → the **ticker** (the heading already names the company)

---

## 7. Adding things

**A company:** one object in `data/companies.ts`. It appears in the catalog, on
the belt, in search, and opens a full module. Add a matching entry to
`products.ts` and `books.ts` only when its digest is ready to sell.

**A newsroom day:** two steps, in order.
1. Replace `editorial.blocks` in `home.ts` per §2 — that is the front page, and
   it is the only thing that gets replaced.
2. **Append** every company-tagged piece from that day onto the matching
   company's `feed[]` in `companies.ts`. The front page turns over daily; the
   company archive only grows.

**A sector:** add it to both maps in `lib/sectors.ts`, and to `FILTERS` in
`app/companies/page.tsx`. Sectors with no companies render dimmed, not hidden —
the filter bar is the colour key.

---

## 8. Before calling it done

- [ ] every `sector` is a real id in `SECTOR_TONE`
- [ ] every tagged ticker resolves to a company in `companies.ts`
- [ ] exactly one `lead_story` and one `question`
- [ ] no text clipped or spilling its card
- [ ] short takes carry no price change, chart or period; strips carry no date
- [ ] ad count follows §4, not hand-placed
- [ ] `npx tsc --noEmit` clean
