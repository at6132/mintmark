import type { Product } from "../../db/schema.js";
import { centsToDollars } from "../../lib/money.js";

export function serializeProduct(p: Product) {
  return {
    id: p.id,
    slug: p.slug,
    company: p.company,
    title: p.title,
    price: centsToDollars(p.priceCents),
    priceCents: p.priceCents,
    currency: p.currency.toUpperCase(),
    status: p.status,
    sector: p.sector,
    ticker: p.ticker,
    summary: p.summary,
    volume: p.volume,
    color: p.color,
    moduleLink: p.moduleLink,
    headquarters: p.headquarters,
    spineHeight: p.spineHeight,
    spineWidth: p.spineWidth,
  };
}
