# SOURCING — where each content type pulls from

Companion to `NEWSROOM.md`. That file says what to *render*; this one says where
the information comes from, before any mintmark treatment.

**This document covers information only. Visuals and pictures are a separate pass.**

---

## The rule that changes everything

Market headlines and short takes are **sentences we write**, not articles we
excerpt. A headline is one sentence front, one sentence back, max. A short take
is a header sentence plus a few sentences on the reverse.

So the pipeline does not need *prose* — it needs **facts and events**. That
inverts the usual source ranking twice over:

1. **Primary structured sources beat news outlets.** SEC filings and company
   press releases give a number and a date. A news article gives someone else's
   paragraph, which we cannot use anyway.
2. **Paywalls mostly stop mattering.** We are not quoting anyone. A paywall only
   hurts where the *fact itself* is behind it (analyst estimates, transcripts).

Rank by whether a source yields a **checkable number attached to an event**, not
by how good its writing is.

---

## Ranking rubric

Each source below is scored on five things:

| Factor | What it means |
|---|---|
| **Access** | free / free-with-key / paid, and the real rate limit |
| **Wall** | none / soft / hard — and whether the *fact* is behind it |
| **Shape** | XBRL or JSON (best) → RSS → HTML scrape (worst) |
| **Clock** | realtime / same-day / quarterly |
| **Reuse** | facts are free to restate; prose is not. Primary sources are safest |

A source is only worth wiring up if it scores well on **Shape** *and* **Reuse** —
a fast source we cannot legally or practically use is worth nothing.

---

## Dropped

**EODHD** — tested live and cut. The key authenticates but the News and Calendar
endpoints both return `401` (not entitled), and the account reports a
`dailyRateLimit` of **20**. Twenty calls a day cannot run a daily newsroom. Not
in any ranking below.

---

## 1. Market headlines — 8/day, one sentence each

Needs: something that *happened today*, with a number in it.

| # | Source | Access | Wall | Shape | Clock | Why it ranks here |
|---|---|---|---|---|---|---|
| 1 | **SEC EDGAR 8-K + full-text search** (`efts.sec.gov`) | free, no key, 10 req/s | none | JSON | minutes | The event *as filed*. Earnings, M&A, guidance, executive changes. Primary, so reuse is unambiguous |
| 2 | **Newswire RSS** — GlobeNewswire, PR Newswire, Business Wire | free RSS | none | RSS | minutes | The company's own words about its own event, usually before coverage |
| 3 | **FRED** (St. Louis Fed) | free key, generous | none | JSON | on release | Every macro print, clean and dated. The whole non-company half of the day |
| 4 | **Exchange calendars** — earnings, IPOs, splits, dividends | free | none | HTML/JSON | daily | Tells you what is *going* to happen, so the day can be planned not scraped |
| 5 | **Finnhub free tier** | free key, 60/min | none | JSON | realtime | Best free JSON company-news feed; good for discovery, never for wording |
| 6 | Reuters / AP / CNBC / MarketWatch RSS | free RSS | soft | RSS | minutes | **Discovery only.** Use to learn what matters today, then go get the fact from #1–#3 |

**Workflow:** pull #4 the night before to know the day's shape → watch #1 and #2
through the session for the actual filings → #3 for macro → #6 only to rank what
deserves a slot. Write the sentence from the filing, never from the article.

---

## 2. Short takes — 8/day, header sentence + a few on the back

Needs: **one verifiable fact**, with just enough context to land.

| # | Source | Access | Wall | Shape | Clock | Why it ranks here |
|---|---|---|---|---|---|---|
| 1 | **SEC XBRL CompanyFacts** (`data.sec.gov/api/xbrl/companyfacts`) | free, no key | none | XBRL/JSON | quarterly | Every number a company has ever filed, tagged. This is the single best short-take source that exists |
| 2 | **SEC XBRL Frames** | free, no key | none | JSON | quarterly | The same concept across *all* companies for one period — where comparisons come from ("X earns more from Y than Z does in total") |
| 3 | **10-K / 10-Q MD&A + Key Operating Metrics** via EDGAR full-text | free | none | HTML | quarterly | The operating numbers XBRL does not tag |
| 4 | **FRED** | free key | none | JSON | on release | Macro facts, same treatment |
| 5 | **Company IR fact sheets** | free | none | HTML | irregular | Fastest route to a clean headline number |
| 6 | Earnings call transcripts | mostly paid | **hard** | HTML | same-day | The fact *is* behind the wall. Low priority, high cost |

**This is the type that rewards structure most.** #1 and #2 are free, keyless,
comparable across companies, and need no interpretation — you are picking a
number, not reading an article.

---

## 3. Pitches — 4/day

| # | Source | Access | Wall | Shape | Clock |
|---|---|---|---|---|---|
| 1 | **[Yellowbrick](https://www.joinyellowbrick.com/)** | free tier = 3 pitches/day; premium = all 30+ | soft | web + daily email | daily |
| 2 | Value Investors Club | free on delay | soft | HTML | delayed |
| 3 | SumZero / Seeking Alpha Pro | paid | hard | HTML | daily |

**Yellowbrick alone is enough, with one caveat.** It aggregates 30+ pitches a day
from fund letters, analyst reports, blogs and X, and tracks each pitch's return.
That is more than four a day by a wide margin — but **the free tier caps at 3/day
and we need 4**. Premium is the one subscription this pipeline actually requires.

---

## 4. Featured stories — 3/day, the long pieces

Needs: a real business story with a mechanism worth explaining.

| # | Source | Role |
|---|---|---|
| 1 | **SEC 8-K + newswire release** | the event itself — what happened, filed |
| 2 | **The company's own 10-K** | the mechanism — how the business actually works |
| 3 | **FRED / BLS / Census** | the macro backdrop when the story is not company-specific |
| 4 | Reuters / AP / CNBC / FT RSS | discovery and salience ranking only |

Same discipline: outlets tell you *what to write about*, filings tell you *what
is true*.

---

## 5. Company question — 1/day

This one does **not** need a daily feed, and trying to give it one is a mistake.
The question is evergreen; only its *timing* is topical.

**Workflow instead of a source list:**
1. Keep a standing bank of business questions, each tied to a company and a
   mechanism ("why can nobody beat this on price?").
2. Each day, rank the bank against the day's headlines — a question about
   margins surfaces the week that company reports margins.
3. Answer it from the company's **10-K risk factors and MD&A**, where the company
   explains its own economics in its own words, plus the curriculum in
   `data/mint.ts`.

Sources: SEC EDGAR (primary), plus general web search for the surrounding
argument. No subscription required.

---

## 6. KPI point-outs — the new type

> *"Amazon fulfils X of Y per Z"* + a visual.

**Naming.** My pick: **Yardstick** — a number that gives you a sense of scale,
and a word that already means "the thing you measure against". Alternatives if
you want a different register: **Figure**, **Scale**, **Counter**, **At This Size**.
I will use `yardstick` as the block type until you say otherwise.

Needs: one operating number, physical enough to picture.

| # | Source | Access | Wall | Shape | Clock | Why |
|---|---|---|---|---|---|---|
| 1 | **10-K "Key Operating Metrics" / MD&A** via EDGAR full-text | free | none | HTML | quarterly | Packages, stores, members, seats, riders — the numbers that are *operations*, not accounting |
| 2 | **Corporate fact sheets / IR "at a glance"** | free | none | HTML | irregular | Companies publish these *specifically* to be quoted at scale |
| 3 | **Annual report / shareholder letter** | free | none | PDF | yearly | Where the striking numbers get said out loud |
| 4 | **Sustainability / ESG reports** | free | none | PDF | yearly | Underrated: carries volume, footprint, fleet and energy figures nothing else reports |
| 5 | **SEC XBRL CompanyFacts** | free, no key | none | JSON | quarterly | Only for the financial subset — most true KPIs are not XBRL-tagged |

**Be honest about the difficulty: this is the hardest type to automate.** Unlike
short takes, these numbers are *prose-embedded and untagged* — "we fulfilled 5.9
billion packages" sits in a sentence, not a field. It needs full-text search plus
extraction, and every number wants a second source before it ships. Budget for a
human check on this type longer than on the others.

---

## 7. Market items — the 8 index chips

| # | Source | Access | Notes |
|---|---|---|---|
| 1 | **Stooq** CSV | free, no key | Indices and majors, no signup. Best effort/return here |
| 2 | **Finnhub** | free key, 60/min | Cleanest free JSON quotes |
| 3 | **FRED** | free key | Rates, yields, spreads |
| 4 | **Twelve Data** | free key, 800/day | Widest global coverage on a free tier |
| 5 | Alpha Vantage | free key, **25/day** | Too small for a daily run; fallback only |
| — | Yahoo Finance endpoints | unofficial | Works, breaks, and is against their terms. Do not build on it |

---

## 8. Company file data — profiles, returns, sectors

For `data/companies.ts` and the heat map.

| Field | Source |
|---|---|
| CEO, founded, HQ, description | 10-K cover + Item 1, SEC EDGAR submissions API |
| Sector | assign by hand to a `SECTOR_TONE` id — do not trust a vendor's taxonomy |
| Returns (1W…ALL) | Stooq or Finnhub |
| Market cap for heat sizing | SEC XBRL shares outstanding × price |
| Lon/lat for the globe | HQ address from the 10-K cover, geocoded once |

---

## What this costs

| | |
|---|---|
| **Free, no key** | SEC EDGAR (all of it), Stooq, newswire RSS, outlet RSS |
| **Free, key** | FRED, Finnhub, Twelve Data |
| **Paid — the only one needed** | Yellowbrick Premium, because the free tier's 3 pitches/day is one short of the 4 the page wants |

Everything except pitches runs on free primary sources. That is a direct
consequence of writing our own sentences instead of syndicating anyone else's.

---

## Open questions for you

1. **Yardstick** — good name, or one of the alternatives?
2. **Yellowbrick Premium** — shall I plan around the paid tier, or design the
   page to run on 3 pitches a day?
3. **Freshness** — is market news intraday, or one pull at the close?
