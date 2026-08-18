"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { money } from "@/lib/format";

type OrderPayload = {
  order?: {
    publicId: string;
    status: string;
    email?: string | null;
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
  };
  items?: Array<{ title: string; quantity: number; unitPriceCents: number }>;
  error?: string;
};

function OrderSuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { clear } = useCart();
  const [data, setData] = useState<OrderPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/v1/orders/session/${encodeURIComponent(sessionId)}`);
        const json = (await res.json()) as OrderPayload;
        if (!res.ok) throw new Error(json.error || "Order not found");
        if (!cancelled) {
          setData(json);
          clear();
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this order.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, clear]);

  const order = data?.order;

  return (
    <section className="ara-cart">
      <div className="ara-cart__inner">
        <header className="ara-cart__intro">
          <div>
            <p className="ara-cart__eyebrow">PRESS COPY</p>
            <h1>{order ? "The order is in." : error ? "Still setting type." : "Confirming the slip."}</h1>
          </div>
          <p className="ara-cart__lede">
            {order
              ? "Payment landed. We’ll send these volumes to print and email tracking when the job ships."
              : "Hold the page — we’re matching your Stripe session to the order desk."}
          </p>
        </header>

        <div className="ara-cart__empty" style={{ gridTemplateColumns: "1fr" }}>
          <div className="ara-cart__empty-copy">
            {error ? (
              <>
                <p className="ara-cart__eyebrow">DESK NOTE</p>
                <h2>We couldn’t find that slip.</h2>
                <p>{error}</p>
              </>
            ) : order ? (
              <>
                <p className="ara-cart__eyebrow">ORDER {order.publicId}</p>
                <h2>Thank you for the read.</h2>
                <p>
                  Status: {order.status.replaceAll("_", " ")}
                  {order.email ? ` · ${order.email}` : ""}. Total {money((order.totalCents || 0) / 100)}.
                </p>
                {data?.items?.length ? (
                  <p>
                    {data.items
                      .map((item) => `${item.quantity}× ${item.title}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="ara-cart__eyebrow">SETTING TYPE</p>
                <h2>Matching the session.</h2>
              </>
            )}
            <div className="ara-cart__empty-actions">
              <Link className="ara-cart__btn ara-cart__btn--primary" href="/shop">
                BACK TO THE SHELF
              </Link>
              <Link className="ara-cart__btn ara-cart__btn--ghost" href="/">
                FRONT PAGE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="ara-cart">
          <div className="ara-cart__inner">
            <header className="ara-cart__intro">
              <div>
                <p className="ara-cart__eyebrow">PRESS COPY</p>
                <h1>Confirming the slip.</h1>
              </div>
            </header>
          </div>
        </section>
      }
    >
      <OrderSuccessInner />
    </Suspense>
  );
}
