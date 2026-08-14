import { NextResponse } from "next/server";
import { products } from "@/data/products";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const status = searchParams.get("status");
  let list = [...products];
  if (status) list = list.filter((p) => p.status === status);
  if (q) {
    list = list.filter((p) =>
      `${p.company} ${p.title} ${p.ticker} ${p.summary} ${p.sector}`.toLowerCase().includes(q),
    );
  }
  return NextResponse.json({ products: list });
}
