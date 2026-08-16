import { pathToFileURL } from "node:url";
import { db } from "./index.js";
import { products } from "./schema.js";

/** Lulu sandbox sample files so print jobs can be submitted before real digest PDFs exist. */
const SAMPLE_INTERIOR =
  "https://www.dropbox.com/s/r20orb8umqjzav9/lulu_trade_interior_template-32.pdf?dl=1&raw=1";
const SAMPLE_COVER =
  "https://www.dropbox.com/s/7bv6mg2tj0h3l0r/lulu_trade_perfect_template.pdf?dl=1&raw=1";
const POD_6X9_BW = "0600X0900.BW.STD.PB.060UW444.MXX";

const catalog = [
  {
    id: "apple",
    slug: "apple",
    company: "Apple",
    title: "The Apple Digest",
    priceCents: 2400,
    status: "AVAILABLE" as const,
    sector: "TECHNOLOGY",
    ticker: "NASDAQ: AAPL",
    summary:
      "Understand how Apple combines hardware, software and services into one connected economic system.",
    volume: "VOL. 01",
    color: "green",
    moduleLink: "/apple",
    headquarters: "CUPERTINO · USA",
    spineHeight: 425,
    spineWidth: 74,
  },
  {
    id: "jpmorgan-chase",
    slug: "jpmorgan-chase",
    company: "JPMorgan Chase",
    title: "The JPMorgan Chase Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "FINANCIALS",
    ticker: "NYSE: JPM",
    summary:
      "Explore how a global bank turns deposits, lending, markets and financial services into a durable business.",
    volume: "VOL. 02",
    color: "navy",
    moduleLink: "",
    headquarters: "NEW YORK · USA",
    spineHeight: 390,
    spineWidth: 80,
  },
  {
    id: "toyota",
    slug: "toyota",
    company: "Toyota",
    title: "The Toyota Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "CONSUMER",
    ticker: "NYSE: TM",
    summary:
      "See how manufacturing discipline, global scale and product reliability shape an automotive business.",
    volume: "VOL. 03",
    color: "cream",
    moduleLink: "",
    headquarters: "TOYOTA CITY · JAPAN",
    spineHeight: 400,
    spineWidth: 72,
  },
  {
    id: "nvidia",
    slug: "nvidia",
    company: "NVIDIA",
    title: "The NVIDIA Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "TECHNOLOGY",
    ticker: "NASDAQ: NVDA",
    summary: "Follow the economics of accelerated computing, chips, platforms and AI infrastructure.",
    volume: "VOL. 04",
    color: "green",
    moduleLink: "",
    headquarters: "SANTA CLARA · USA",
    spineHeight: 380,
    spineWidth: 64,
  },
  {
    id: "costco",
    slug: "costco",
    company: "Costco",
    title: "The Costco Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "CONSUMER",
    ticker: "NASDAQ: COST",
    summary:
      "Understand the membership model, low-price discipline and inventory economics behind Costco.",
    volume: "VOL. 05",
    color: "teal",
    moduleLink: "",
    headquarters: "ISSAQUAH · USA",
    spineHeight: 410,
    spineWidth: 82,
  },
  {
    id: "nike",
    slug: "nike",
    company: "Nike",
    title: "The Nike Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "CONSUMER",
    ticker: "NYSE: NKE",
    summary:
      "Explore how brand, product innovation, distribution and athlete storytelling create global demand.",
    volume: "VOL. 06",
    color: "navy",
    moduleLink: "",
    headquarters: "BEAVERTON · USA",
    spineHeight: 360,
    spineWidth: 70,
  },
  {
    id: "amazon",
    slug: "amazon",
    company: "Amazon",
    title: "The Amazon Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "TECHNOLOGY",
    ticker: "NASDAQ: AMZN",
    summary:
      "Explore how commerce, logistics, subscriptions and cloud computing form several businesses inside one company.",
    volume: "VOL. 07",
    color: "gold",
    moduleLink: "",
    headquarters: "SEATTLE · USA",
    spineHeight: 395,
    spineWidth: 84,
  },
  {
    id: "microsoft",
    slug: "microsoft",
    company: "Microsoft",
    title: "The Microsoft Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "TECHNOLOGY",
    ticker: "NASDAQ: MSFT",
    summary:
      "Understand how software, cloud infrastructure and enterprise subscriptions reinforce one another.",
    volume: "VOL. 08",
    color: "green",
    moduleLink: "",
    headquarters: "REDMOND · USA",
    spineHeight: 415,
    spineWidth: 72,
  },
  {
    id: "berkshire-hathaway",
    slug: "berkshire-hathaway",
    company: "Berkshire Hathaway",
    title: "The Berkshire Hathaway Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "FINANCIALS",
    ticker: "NYSE: BRK.B",
    summary:
      "Study capital allocation, insurance float and the long-term ownership model behind Berkshire Hathaway.",
    volume: "VOL. 09",
    color: "cream",
    moduleLink: "",
    headquarters: "OMAHA · USA",
    spineHeight: 375,
    spineWidth: 86,
  },
  {
    id: "tesla",
    slug: "tesla",
    company: "Tesla",
    title: "The Tesla Digest",
    priceCents: 2400,
    status: "COMING_SOON" as const,
    sector: "CONSUMER",
    ticker: "NASDAQ: TSLA",
    summary: "Follow how electric vehicles, software, manufacturing and energy products combine inside Tesla.",
    volume: "VOL. 10",
    color: "red",
    moduleLink: "",
    headquarters: "AUSTIN · USA",
    spineHeight: 365,
    spineWidth: 68,
  },
];

export async function seedProducts(): Promise<void> {
  for (const row of catalog) {
    const values = {
      ...row,
      currency: "usd",
      podPackageId: POD_6X9_BW,
      pageCount: 32,
      interiorPdfUrl: SAMPLE_INTERIOR,
      coverPdfUrl: SAMPLE_COVER,
      updatedAt: new Date(),
    };
    await db.insert(products).values(values).onConflictDoNothing();
  }
  console.log(`seeded ${catalog.length} products`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await seedProducts();
  process.exit(0);
}
