"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { digestCover, productById } from "@/data/products";
import { assets, appHref } from "@/lib/assets";
import { apiUrl } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

function DigestCover({
  id,
  company,
  color,
  volume,
}: {
  id: string;
  company?: string;
  color?: string;
  volume?: string;
}) {
  const photo = id === "apple" ? assets.appleDigestCover : undefined;
  const paint = digestCover(color);
  const initial = (company || "M").slice(0, 1).toUpperCase();

  return (
    <div
      className={`ara-cart__cover${photo ? " ara-cart__cover--photo" : ""}`}
      style={
        photo
          ? { backgroundImage: `url(${photo})` }
          : { background: paint.background, color: paint.color }
      }
      aria-hidden="true"
    >
      {photo ? null : (
        <>
          <span className="ara-cart__cover-vol">{volume || "VOL."}</span>
          <strong>{initial}</strong>
        </>
      )}
    </div>
  );
}

function EmptyDesk() {
  return (
    <svg className="ara-cart__empty-art" viewBox="0 0 280 168" fill="none" aria-hidden="true">
      <rect x="18" y="28" width="244" height="122" rx="14" fill="#FBF7EC" stroke="#161B2E" strokeWidth="2.2" />
      <path d="M18 52h244" stroke="#C9BEA8" strokeWidth="1.2" />
      <path d="M38 74h204M38 92h168M38 110h188" stroke="#1FA88F" strokeOpacity="0.28" strokeWidth="1.4" />
      <rect x="42" y="18" width="38" height="118" rx="4" fill="#176D5C" stroke="#161B2E" strokeWidth="2" />
      <rect x="86" y="28" width="34" height="108" rx="4" fill="#3A5BE0" stroke="#161B2E" strokeWidth="2" />
      <rect x="126" y="22" width="36" height="114" rx="4" fill="#E0A526" stroke="#161B2E" strokeWidth="2" />
      <rect
        x="178"
        y="36"
        width="58"
        height="100"
        rx="6"
        fill="#F5EFE1"
        stroke="#161B2E"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <path d="M188 86h38" stroke="#C9BEA8" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="236" cy="44" r="9" fill="#1FA88F" stroke="#161B2E" strokeWidth="1.6" />
    </svg>
  );
}

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clear, count, ready } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      items.map((item) => {
        const product = productById(item.id);
        return {
          ...item,
          company: item.company || product?.company,
          color: item.color || product?.color,
          volume: item.volume || product?.volume,
          ticker: item.ticker || product?.ticker,
          moduleLink: product?.moduleLink,
        };
      }),
    [items],
  );

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/v1/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout is not available yet.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout is not available yet.");
      setBusy(false);
    }
  }

  const volumeLabel = count === 1 ? "1 VOLUME" : `${count} VOLUMES`;

  return (
    <section className="ara-cart">
      <div className="ara-cart__inner">
        <header className="ara-cart__intro">
          <div>
            <p className="ara-cart__eyebrow">
              YOUR CART{ready && count > 0 ? ` · ${volumeLabel}` : ready ? " · EMPTY SLIP" : ""}
            </p>
            <h1>{!ready ? "Your cart." : count > 0 ? "Digests on the desk." : "The desk is clear."}</h1>
          </div>
          <p className="ara-cart__lede">
            Printed company guides, bound for the shelf. Review the volumes, then send them to press.
          </p>
        </header>

        {!ready ? (
          <div className="ara-cart__empty ara-cart__empty--quiet" aria-hidden="true" />
        ) : items.length === 0 ? (
          <div className="ara-cart__empty">
            <EmptyDesk />
            <div className="ara-cart__empty-copy">
              <p className="ara-cart__eyebrow">EMPTY SLIP</p>
              <h2>Nothing on order yet.</h2>
              <p>
                Add a digest from the shop — each volume is a printed company guide, designed to keep, mark up, and
                return to.
              </p>
              <div className="ara-cart__empty-actions">
                <Link className="ara-cart__btn ara-cart__btn--primary" href="/shop">
                  BROWSE DIGESTS
                </Link>
                <Link className="ara-cart__btn ara-cart__btn--ghost" href="/catalog">
                  OPEN THE CATALOG
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="ara-cart__layout">
            <div className="ara-cart__items">
              <div className="ara-cart__items-head">
                <span>ON THE SLIP</span>
                <strong>{volumeLabel}</strong>
              </div>
              <ul className="ara-cart__list">
                {rows.map((item) => (
                  <li key={item.id} className="ara-cart__row">
                    <DigestCover
                      id={item.id}
                      company={item.company}
                      color={item.color}
                      volume={item.volume}
                    />
                    <div className="ara-cart__meta">
                      <p className="ara-cart__kicker">
                        {item.volume || "DIGEST"}
                        {item.ticker ? ` · ${item.ticker}` : ""}
                      </p>
                      <h2>{item.title}</h2>
                      {item.company ? <p className="ara-cart__company">{item.company}</p> : null}
                      {item.moduleLink ? (
                        <Link className="ara-cart__file" href={appHref(item.moduleLink) || "/shop"}>
                          COMPANY FILE →
                        </Link>
                      ) : null}
                    </div>
                    <div className="ara-cart__controls">
                      <div className="ara-cart__qty" role="group" aria-label={`Quantity for ${item.title}`}>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <strong className="ara-cart__line">{money(item.price * item.quantity)}</strong>
                      <button type="button" className="ara-cart__remove" onClick={() => removeItem(item.id)}>
                        REMOVE
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="ara-cart__summary">
              <div className="ara-cart__summary-head">
                <span>ORDER SLIP</span>
                <h2>The tally.</h2>
              </div>
              <div className="ara-cart__summary-body">
                <div className="ara-cart__line-row">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div className="ara-cart__line-row ara-cart__line-row--muted">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="ara-cart__total">
                  <span>Due now</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <p className="ara-cart__note">
                  Each digest is printed to order. Stripe collects payment and a shipping address; we send the volumes
                  to press after the order lands.
                </p>
                {error ? <div className="ara-cart__error">{error}</div> : null}
                <button
                  type="button"
                  className="ara-cart__btn ara-cart__btn--primary ara-cart__btn--wide"
                  onClick={checkout}
                  disabled={busy}
                >
                  {busy ? "OPENING CHECKOUT…" : "CHECK OUT"}
                </button>
                <Link className="ara-cart__btn ara-cart__btn--ghost ara-cart__btn--wide" href="/shop">
                  CONTINUE SHOPPING
                </Link>
                <button type="button" className="ara-cart__clear" onClick={clear}>
                  CLEAR THE SLIP
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
