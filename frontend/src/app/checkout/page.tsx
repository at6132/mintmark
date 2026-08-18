"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    clear();
    router.push("/order/success");
  };

  return (
    <main className="ck">
      <span className="ck__trim" aria-hidden="true" />
      <div className="ck__inner">
        <span className="ck__kicker">Secure checkout</span>
        <h1 className="ck__title">Checkout</h1>

        {items.length === 0 ? (
          <div className="ck__empty">
            <p>Your cart is empty.</p>
            <Link className="ck__btn ck__btn--gold" href="/companies">
              Browse digests
            </Link>
          </div>
        ) : (
          <form className="ck__grid" onSubmit={onSubmit}>
            <div className="ck__form">
              <fieldset className="ck__field">
                <legend>Contact</legend>
                <input className="ck__input" required type="email" name="email" placeholder="Email address" autoComplete="email" />
              </fieldset>

              <fieldset className="ck__field">
                <legend>Shipping address</legend>
                <div className="ck__field-row">
                  <input className="ck__input" required name="first" placeholder="First name" autoComplete="given-name" />
                  <input className="ck__input" required name="last" placeholder="Last name" autoComplete="family-name" />
                </div>
                <input className="ck__input" required name="address" placeholder="Address" autoComplete="street-address" />
                <div className="ck__field-row">
                  <input className="ck__input" required name="city" placeholder="City" autoComplete="address-level2" />
                  <input className="ck__input" required name="state" placeholder="State" autoComplete="address-level1" />
                  <input className="ck__input" required name="zip" placeholder="ZIP" autoComplete="postal-code" />
                </div>
              </fieldset>

              <fieldset className="ck__field">
                <legend>Payment</legend>
                <input className="ck__input" required name="card" inputMode="numeric" placeholder="Card number" autoComplete="cc-number" />
                <div className="ck__field-row">
                  <input className="ck__input" required name="exp" placeholder="MM / YY" autoComplete="cc-exp" />
                  <input className="ck__input" required name="cvc" inputMode="numeric" placeholder="CVC" autoComplete="cc-csc" />
                </div>
                <p className="ck__note">Payments are encrypted. You won't be charged until your order ships.</p>
              </fieldset>
            </div>

            <aside className="ck__summary">
              <div className="ck__summary-items">
                {items.map((item) => (
                  <div className="ck__summary-line" key={item.id}>
                    <span>
                      {item.title} <em>× {item.quantity}</em>
                    </span>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
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
              <button type="submit" className="ck__btn ck__btn--gold ck__checkout" disabled={placing}>
                {placing ? "Placing order…" : `Pay ${money(subtotal)}`}
              </button>
              <Link className="ck__btn ck__btn--ghost" href="/cart">
                Back to cart
              </Link>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
