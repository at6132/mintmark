import { NextResponse } from "next/server";
import { products } from "@/data/products";
import { catalogContent } from "@/data/catalog";
import { homeContent } from "@/data/home";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  if (!q) return NextResponse.json({ results: [] });

  const productHits = products
    .filter((p) => `${p.company} ${p.title} ${p.summary}`.toLowerCase().includes(q))
    .map((p) => ({
      type: "product",
      title: p.title,
      href: "/shop",
      meta: p.company,
    }));

  const companyHits = catalogContent.companies
    .filter((c) => `${c.company_name} ${c.ticker} ${c.keywords || ""}`.toLowerCase().includes(q))
    .map((c) => ({
      type: "company",
      title: c.company_name,
      href: c.module_link || "/companies",
      meta: c.ticker,
    }));

  const storyHits = homeContent.editorial.blocks
    .filter((b) => "heading" in b && String(b.heading).toLowerCase().includes(q))
    .slice(0, 8)
    .map((b) => ({
      type: "story",
      title: String((b as { heading?: string }).heading || ""),
      href: String((b as { link?: string }).link || "/"),
      meta: String((b as { ticker?: string }).ticker || "STORY"),
    }));

  return NextResponse.json({
    results: [...companyHits, ...productHits, ...storyHits].slice(0, 24),
  });
}
