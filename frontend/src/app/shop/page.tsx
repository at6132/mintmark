"use client";

import Link from "next/link";
import { digestCover, products } from "@/data/products";
import { assets, appHref } from "@/lib/assets";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export default function ShopPage() {
  const { addItem } = useCart();

  return (
    <section className="ara-shop">
      <div className="ara-shop__inner">
        <header className="ara-shop__intro">
          <div>
            <p className="ara-shop__eyebrow">PHYSICAL DIGESTS</p>
            <h1>Books built to keep.</h1>
          </div>
          <p className="ara-shop__lede">
            Each digest is a printed company guide designed for reading, annotation and return. Every volume is $24.
          </p>
        </header>

        <div className="ara-shop__grid">
          {products.map((p) => {
            const paint = digestCover(p.color);
            // a product may ship its own cover photo; otherwise the painted cover is used
            const photo = undefined;
            const available = p.status === "AVAILABLE";
            return (
              <article key={p.id} className="ara-shop__card">
                <div
                  className={`ara-shop__cover${photo ? " ara-shop__cover--photo" : ""}`}
                  style={
                    photo
                      ? { backgroundImage: `url(${photo})`, color: "#fffdf6" }
                      : { background: paint.background, color: paint.color }
                  }
                >
                  <span>
                    {p.volume} · {p.ticker}
                  </span>
                  <strong>{p.company}</strong>
                </div>
                <div className="ara-shop__body">
                  <div className="ara-shop__card-kicker">
                    {p.sector} · {p.headquarters}
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.summary}</p>
                  <strong className="ara-shop__price">{money(p.price)}</strong>
                  <div className="ara-shop__actions">
                    <button
                      type="button"
                      className={`ara-cart__btn ${available ? "ara-cart__btn--primary" : "ara-cart__btn--ghost"}`}
                      disabled={!available}
                      onClick={() =>
                        addItem({
                          id: p.id,
                          title: p.title,
                          price: p.price,
                          company: p.company,
                          color: p.color,
                          volume: p.volume,
                          ticker: p.ticker,
                        })
                      }
                    >
                      {available ? "ADD TO CART" : "COMING SOON"}
                    </button>
                    {p.moduleLink ? (
                      <Link className="ara-cart__btn ara-cart__btn--ghost" href={appHref(p.moduleLink) || "/catalog"}>
                        COMPANY FILE
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
