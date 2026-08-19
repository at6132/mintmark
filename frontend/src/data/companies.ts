/**
 * ============================================================================
 * COMPANY FILE — the one shape a company takes anywhere on the site.
 * ============================================================================
 *
 * Everything the catalog, the conveyor belt and the quick-open module render
 * comes from this array. Adding a company is adding one object here; nothing in
 * `app/` or `components/` needs to change.
 *
 * `sector` MUST be one of the ids in `lib/sectors.ts` (SECTOR_TONE). That id is
 * what colours the card marker, the group rule, the ticker chip, the filter
 * chip and the module's header trim — colour carries meaning, so a wrong id is
 * a wrong signal, not just a wrong swatch.
 *
 * The company below is a PLACEHOLDER. It exists to document the shape and to
 * keep the shell rendering. Replace it; do not build on top of it.
 */

export type CompanyFeedKind = "news" | "short" | "pitch" | "story" | "view";

/** One piece of company-tagged content in the module's feed. */
export type CompanyFeedItem = {
  kind: CompanyFeedKind;
  /** the small label above the headline — "Market news", "Short take", "Pitch" */
  tag: string;
  /** the smallest type on the card: a time ("TODAY", "1W") or a date */
  meta: string;
  title: string;
  /** the reverse / body copy. A "view" carries none — its title is the quote. */
  body: string;
  cta: string;
  link: string;
};

export type CompanyRecord = {
  id: string;
  /** must match an id in SECTOR_TONE — this drives every marking on the site */
  sector: string;
  sector_label: string;
  company_name: string;
  ticker: string;
  headquarters: string;
  business_model: string;
  keywords: string;
  /** the company's own jacket colour — the digest cover and module header only */
  accent_color: string;
  direction: "up" | "down" | "flat";
  sparkline_style: string;
  change: string;
  period: string;
  status: string;
  popup_tagline: string;
  popup_chapter: string;

  profile: {
    description: string;
    size: string;
    /** the readable sector name shown in the profile rows */
    sector: string;
    country: string;
    state: string;
    city: string;
    ceo: string;
    founded: string;
    /** used to pin the HQ on the module's map */
    lon: number;
    lat: number;
  };

  /** the six ranges in the module's Share price return block */
  returns: Array<{ range: string; chg: string; up: boolean }>;

  /** issues available for this company, newest first — drives the issue menu */
  digests: Array<{ q: string; year: string }>;

  /**
   * The company's ARCHIVE — every piece the newsroom has ever tagged to it,
   * newest first. This accumulates: when a day publishes, its company-tagged
   * blocks are appended here, they do not replace what is already in the list.
   * The module interleaves by kind at render time, so order in this array only
   * needs to be newest-first within each kind.
   */
  feed: CompanyFeedItem[];
};

export const companies: CompanyRecord[] = [
  {
    id: "example-co",
    sector: "technology",
    sector_label: "TECHNOLOGY",
    company_name: "Example Co",
    ticker: "EXCO",
    headquarters: "CUPERTINO · USA",
    business_model: "BUSINESS MODEL",
    keywords: "placeholder example replace me",
    accent_color: "#54545C",
    direction: "up",
    sparkline_style: "wave-up",
    change: "▲ 0.0%",
    period: "1Y",
    status: "AVAILABLE",
    popup_tagline: "",
    popup_chapter: "One line on how this company actually makes money",

    profile: {
      description:
        "One paragraph, in plain language, on what this company sells and why anyone pays for it. Written so a ten-year-old follows it and an adult doesn't feel talked down to.",
      size: "LARGE CAP",
      sector: "Technology",
      country: "United States",
      state: "California",
      city: "Cupertino",
      ceo: "Chief Executive",
      founded: "0000",
      lon: -122.0322,
      lat: 37.323,
    },

    returns: [
      { range: "1W", chg: "+0.0%", up: true },
      { range: "1M", chg: "+0.0%", up: true },
      { range: "YTD", chg: "+0.0%", up: true },
      { range: "1Y", chg: "+0.0%", up: true },
      { range: "3Y", chg: "+0.0%", up: true },
      { range: "ALL", chg: "+0.0%", up: true },
    ],

    digests: [{ q: "Q1", year: "2026" }],

    feed: [
      { kind: "news", tag: "Market news", meta: "TODAY",
        title: "A headline about something that happened (1)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "TODAY",
        title: "A headline about something that happened (2)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "1W",
        title: "A headline about something that happened (3)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "1W",
        title: "A headline about something that happened (4)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1W",
        title: "One fact about this company, in one line (1)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1W",
        title: "One fact about this company, in one line (2)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1M",
        title: "One fact about this company, in one line (3)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1M",
        title: "One fact about this company, in one line (4)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "pitch", tag: "Pitch", meta: "EXCO",
        title: "The argument for owning this company (1)",
        body: "The bull case in plain language, with the risk named honestly.",
        cta: "Read the pitch", link: "" },
      { kind: "pitch", tag: "Pitch", meta: "EXCO",
        title: "The argument for owning this company (2)",
        body: "The bull case in plain language, with the risk named honestly.",
        cta: "Read the pitch", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "JANUARY 24, 2026",
        title: "The long piece on how this company works (1)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "JANUARY 11, 2026",
        title: "The long piece on how this company works (2)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "DECEMBER 14, 2025",
        title: "The long piece on how this company works (3)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "view", tag: "The Mintmark view", meta: "",
        title: "One sentence worth remembering about this company.",
        body: "", cta: "Explore the curriculum", link: "/mint" },
    ],
  },
  {
    id: "example-bank",
    sector: "financials",
    sector_label: "FINANCIALS",
    company_name: "Example Bank",
    ticker: "EXBK",
    headquarters: "NEW YORK · USA",
    business_model: "BUSINESS MODEL",
    keywords: "placeholder example replace me",
    accent_color: "#2B3A67",
    direction: "up",
    sparkline_style: "wave-up",
    change: "▲ 0.0%",
    period: "1Y",
    status: "AVAILABLE",
    popup_tagline: "",
    popup_chapter: "One line on how this company actually makes money",

    profile: {
      description:
        "One paragraph, in plain language, on what this company sells and why anyone pays for it. Written so a ten-year-old follows it and an adult doesn't feel talked down to.",
      size: "LARGE CAP",
      sector: "Financials",
      country: "United States",
      state: "New York",
      city: "New York",
      ceo: "Chief Executive",
      founded: "0000",
      lon: -74.006,
      lat: 40.7128,
    },

    returns: [
      { range: "1W", chg: "+0.0%", up: true },
      { range: "1M", chg: "+0.0%", up: true },
      { range: "YTD", chg: "+0.0%", up: true },
      { range: "1Y", chg: "+0.0%", up: true },
      { range: "3Y", chg: "+0.0%", up: true },
      { range: "ALL", chg: "+0.0%", up: true },
    ],

    digests: [{ q: "Q1", year: "2026" }],

    feed: [
      { kind: "news", tag: "Market news", meta: "TODAY",
        title: "A headline about something that happened (1)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "TODAY",
        title: "A headline about something that happened (2)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "1W",
        title: "A headline about something that happened (3)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "1W",
        title: "A headline about something that happened (4)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1W",
        title: "One fact about this company, in one line (1)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1W",
        title: "One fact about this company, in one line (2)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1M",
        title: "One fact about this company, in one line (3)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1M",
        title: "One fact about this company, in one line (4)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "pitch", tag: "Pitch", meta: "EXBK",
        title: "The argument for owning this company (1)",
        body: "The bull case in plain language, with the risk named honestly.",
        cta: "Read the pitch", link: "" },
      { kind: "pitch", tag: "Pitch", meta: "EXBK",
        title: "The argument for owning this company (2)",
        body: "The bull case in plain language, with the risk named honestly.",
        cta: "Read the pitch", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "JANUARY 24, 2026",
        title: "The long piece on how this company works (1)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "JANUARY 11, 2026",
        title: "The long piece on how this company works (2)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "DECEMBER 14, 2025",
        title: "The long piece on how this company works (3)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "view", tag: "The Mintmark view", meta: "",
        title: "One sentence worth remembering about this company.",
        body: "", cta: "Explore the curriculum", link: "/mint" },
    ],
  },
  {
    id: "example-health",
    sector: "healthcare",
    sector_label: "HEALTHCARE",
    company_name: "Example Health",
    ticker: "EXMD",
    headquarters: "CHICAGO · USA",
    business_model: "BUSINESS MODEL",
    keywords: "placeholder example replace me",
    accent_color: "#4A3B57",
    direction: "up",
    sparkline_style: "wave-up",
    change: "▲ 0.0%",
    period: "1Y",
    status: "AVAILABLE",
    popup_tagline: "",
    popup_chapter: "One line on how this company actually makes money",

    profile: {
      description:
        "One paragraph, in plain language, on what this company sells and why anyone pays for it. Written so a ten-year-old follows it and an adult doesn't feel talked down to.",
      size: "LARGE CAP",
      sector: "Healthcare",
      country: "United States",
      state: "Illinois",
      city: "Chicago",
      ceo: "Chief Executive",
      founded: "0000",
      lon: -87.6298,
      lat: 41.8781,
    },

    returns: [
      { range: "1W", chg: "+0.0%", up: true },
      { range: "1M", chg: "+0.0%", up: true },
      { range: "YTD", chg: "+0.0%", up: true },
      { range: "1Y", chg: "+0.0%", up: true },
      { range: "3Y", chg: "+0.0%", up: true },
      { range: "ALL", chg: "+0.0%", up: true },
    ],

    digests: [{ q: "Q1", year: "2026" }],

    feed: [
      { kind: "news", tag: "Market news", meta: "TODAY",
        title: "A headline about something that happened (1)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "TODAY",
        title: "A headline about something that happened (2)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "1W",
        title: "A headline about something that happened (3)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "news", tag: "Market news", meta: "1W",
        title: "A headline about something that happened (4)",
        body: "One or two sentences explaining what happened and why it matters.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1W",
        title: "One fact about this company, in one line (1)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1W",
        title: "One fact about this company, in one line (2)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1M",
        title: "One fact about this company, in one line (3)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "short", tag: "Short take", meta: "1M",
        title: "One fact about this company, in one line (4)",
        body: "The single sentence that makes the fact land.",
        cta: "Read", link: "" },
      { kind: "pitch", tag: "Pitch", meta: "EXMD",
        title: "The argument for owning this company (1)",
        body: "The bull case in plain language, with the risk named honestly.",
        cta: "Read the pitch", link: "" },
      { kind: "pitch", tag: "Pitch", meta: "EXMD",
        title: "The argument for owning this company (2)",
        body: "The bull case in plain language, with the risk named honestly.",
        cta: "Read the pitch", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "JANUARY 24, 2026",
        title: "The long piece on how this company works (1)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "JANUARY 11, 2026",
        title: "The long piece on how this company works (2)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "story", tag: "COVER STORY", meta: "DECEMBER 14, 2025",
        title: "The long piece on how this company works (3)",
        body: "The paragraph that gets someone to open it.",
        cta: "Read the story", link: "" },
      { kind: "view", tag: "The Mintmark view", meta: "",
        title: "One sentence worth remembering about this company.",
        body: "", cta: "Explore the curriculum", link: "/mint" },
    ],
  }
];

/** Colourway per feed kind — mirrors the homepage newsroom's section colours. */
export const FEED_TRIMS: Record<CompanyFeedKind, { t1: string; t2: string }> = {
  news: { t1: "#5f86ee", t2: "#7fd9c4" },
  short: { t1: "#2aa78f", t2: "#d9a531" },
  pitch: { t1: "#8fdcc8", t2: "#cf7f86" },
  story: { t1: "#e0a526", t2: "#eec06a" },
  view: { t1: "#3a5be0", t2: "#e0a526" },
};

/**
 * A piece of content can be tagged to more than one company. Tag fields hold a
 * comma-separated list of tickers ("EXCO, EXBK"); these helpers turn that into
 * the companies it belongs to, and into the sector colour each ticker wears.
 */
export function parseTickers(raw?: string | null): string[] {
  return (raw || "")
    .split(/[,/]/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
}

export function companyByTicker(ticker: string): CompanyRecord | undefined {
  const t = ticker.trim().toUpperCase();
  return companies.find((c) => c.ticker.toUpperCase() === t);
}

/** The sector id a ticker belongs to — the key into SECTOR_TONE. */
export function sectorForTicker(ticker: string): string {
  return companyByTicker(ticker)?.sector || "other";
}
