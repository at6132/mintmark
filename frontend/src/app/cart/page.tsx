"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clear } = useCart();

  return (
    <main className="ck">
      <span className="ck__trim" aria-hidden="true" />
      <div className="ck__inner">
        <span className="ck__kicker">Your cart</span>
        <h1 className="ck__title">Checkout</h1>

        {items.length === 0 ? (
          <div className="ck__empty">
            <p>Your cart is empty.</p>
            <Link className="ck__btn ck__btn--gold" href="/companies">
              Browse digests
            </Link>
          </div>
        ) : (
          <div className="ck__grid">
            <div className="ck__items">
              {items.map((item) => (
                <div className="ck__item" key={item.id}>
                  <span className="ck__item-cover" aria-hidden="true">
                    <b>Q3</b>
                    <i>Digest</i>
                  </span>
                  <div className="ck__item-main">
                    <strong>{item.title}</strong>
                    {item.company ? <small>{item.company}</small> : null}
                  </div>
                  <div className="ck__item-qty">
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Decrease">−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Increase">+</button>
                  </div>
                  <span className="ck__item-price">{money(item.price * item.quantity)}</span>
                  <button type="button" className="ck__remove" onClick={() => removeItem(item.id)} aria-label="Remove">
                    ×
                  </button>
                </div>
              ))}
            </div>

            <aside className="ck__summary">
              <div className="ck__row">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div className="ck__row">
                <span>Shipping</span>
                <strong>Free</strong>
              </div>
              <div className="ck__row ck__row--total">
                <span>Total</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <Link className="ck__btn ck__btn--gold ck__checkout" href="/checkout">
                Checkout · {money(subtotal)}
              </Link>
              <button type="button" className="ck__btn ck__btn--ghost" onClick={clear}>
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
