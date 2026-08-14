"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, clear } = useCart();

  return (
    <section className="page-section cream">
      <div className="shell">
        <p className="eyebrow">YOUR CART</p>
        <h1>Checkout, simplified.</h1>
        <p className="lede">Review digests before you place an educational order enquiry.</p>

        {items.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "left", padding: "40px 0" }}>
            <p>Your cart is empty.</p>
            <Link className="btn btn-primary" href="/shop">
              BROWSE DIGESTS
            </Link>
          </div>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Digest</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      {item.company ? (
                        <div style={{ color: "var(--muted)", fontSize: 13 }}>{item.company}</div>
                      ) : null}
                    </td>
                    <td>{money(item.price)}</td>
                    <td>
                      <div className="qty-row">
                        <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Decrease">
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Increase">
                          +
                        </button>
                      </div>
                    </td>
                    <td>{money(item.price * item.quantity)}</td>
                    <td>
                      <button type="button" className="btn btn-secondary" onClick={() => removeItem(item.id)}>
                        REMOVE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-summary">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Fulfilment is handled offline in this MVP. Send a contact note with your cart details to complete an
                order.
              </p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <Link className="btn btn-primary" href="/contact">
                  REQUEST CHECKOUT
                </Link>
                <button type="button" className="btn btn-secondary" onClick={clear}>
                  CLEAR CART
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
