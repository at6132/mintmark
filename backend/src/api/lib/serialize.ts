import type { Product } from "../../db/schema.js";
import { products } from "../../db/schema.js";
import { centsToDollars } from "../../lib/money.js";

export const publicProductColumns = {
  id: products.id,
  slug: products.slug,
  company: products.company,
  title: products.title,
  priceCents: products.priceCents,
  currency: products.currency,
  status: products.status,
  sector: products.sector,
  ticker: products.ticker,
  summary: products.summary,
  volume: products.volume,
  color: products.color,
  moduleLink: products.moduleLink,
  headquarters: products.headquarters,
  spineHeight: products.spineHeight,
  spineWidth: products.spineWidth,
};

export type PublicProduct = Pick<
  Product,
  | "id"
  | "slug"
  | "company"
  | "title"
  | "priceCents"
  | "currency"
  | "status"
  | "sector"
  | "ticker"
  | "summary"
  | "volume"
  | "color"
  | "moduleLink"
  | "headquarters"
  | "spineHeight"
  | "spineWidth"
>;

export function serializeProduct(p: PublicProduct) {
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
