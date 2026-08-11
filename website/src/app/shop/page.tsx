"use client";

import Link from "next/link";
import { products } from "@/data/products";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

const covers: Record<string, string> = {
  green: "linear-gradient(145deg,#1fa88f,#0f5f50)",
  navy: "linear-gradient(145deg,#243a75,#121f42)",
  cream: "linear-gradient(145deg,#e8d9b4,#b8a57a)",
  teal: "linear-gradient(145deg,#2a8f9e,#124e57)",
  gold: "linear-gradient(145deg,#d4a423,#8a6912)",
  red: "linear-gradient(145deg,#b53036,#5f1418)",
};

export default function ShopPage() {
  const { addItem } = useCart();

  return (
    <section className="page-section cream">
      <div className="shell">
        <p className="eyebrow">PHYSICAL DIGESTS</p>
        <h1>Books built to keep.</h1>
        <p className="lede">
          Each digest is a printed company guide designed for reading, annotation and return. Every volume is $24.
        </p>
        <div className="product-grid" style={{ marginTop: 28 }}>
          {products.map((p) => (
            <article key={p.id} className="product-card">
              <div
                className="product-card__cover"
                style={{
                  background: covers[p.color] || covers.green,
                  color: p.color === "cream" || p.color === "gold" ? "#161b2e" : "#fff",
                }}
              >
                {p.company}
              </div>
              <div className="product-card__body">
                <div style={{ fontFamily: "var(--font-body-family)", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }}>
                  {p.volume} · {p.status}
                </div>
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
                <strong style={{ fontFamily: "var(--font-body-family)" }}>{money(p.price)}</strong>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-mint"
                    disabled={p.status !== "AVAILABLE"}
                    onClick={() =>
                      addItem({
                        id: p.id,
                        title: p.title,
                        price: p.price,
                        company: p.company,
                      })
                    }
                  >
                    {p.status === "AVAILABLE" ? "ADD TO CART" : "COMING SOON"}
                  </button>
                  {p.moduleLink ? (
                    <Link className="btn btn-secondary" href={p.moduleLink}>
                      COMPANY FILE
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
