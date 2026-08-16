# Frontend changes still needed

The backend is live as its own service. **Do not ship checkout until these storefront edits are done.** The Next.js app was intentionally left alone.

Set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:3001` locally, the Railway backend URL in production).

## New pages

| Page | Why |
|---|---|
| `/order/success` | Stripe success URL. Read `?session_id=`, call `GET {API}/v1/orders/session/:sessionId`, show status + public id. Clear the cart. |
| `/order/[publicId]` optional | Lookup `GET {API}/v1/orders/mm_…` for tracking after the customer leaves success. |

Cancel already returns to `/cart` — no new cancel page required.

## Edits to existing files

### `src/app/cart/page.tsx` (required)

Replace “REQUEST CHECKOUT” → `/contact` with a button that:

1. Sends `{ items: cart.items.map(i => ({ id: i.id, quantity: i.quantity })) }` — **ids and qty only, never prices**
2. `POST {API}/v1/checkout`
3. `window.location = data.url` (Stripe Checkout)

Keep the current cart table; only change the CTA and the “fulfilment is offline” copy.

### `src/app/layout.tsx` or a tiny `src/lib/api.ts` (required)

Add a helper:

```ts
export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
```

Do not put Stripe or Lulu secrets in the frontend.

### `src/app/contact/page.tsx`

Change `fetch("/api/contact")` → `fetch(`${apiUrl}/v1/contact`)`.

### `src/components/InlineEmail.tsx`

Change `fetch("/api/newsletter")` → `fetch(`${apiUrl}/v1/newsletter`)`.

### `next.config.js` (optional, instead of rewriting every fetch)

```js
async rewrites() {
  return [{ source: "/api/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL}/v1/:path*` }];
}
```

If you do this, also add a rewrite from `/api/health` and keep Stripe/Lulu webhooks on the **backend domain**, not Next.

### `src/lib/cart.tsx` (optional)

Cart can stay in `localStorage`. After a successful checkout, call `clear()` from the success page.

### `src/app/shop/page.tsx` (optional)

Can keep the local `products` import. To use the API as source of truth (status, price):

`GET {API}/v1/products` → `{ products: [{ id, title, price, status, … }] }`

Disable add-to-cart unless `status === "AVAILABLE"`.

### Frontend API routes to retire later

These write JSON to disk and will lose data on Railway:

- `src/app/api/contact/route.ts`
- `src/app/api/newsletter/route.ts`

`src/app/api/products/route.ts` and `src/app/api/search/route.ts` can stay until the shop is wired to the backend catalog.

## CORS / env on frontend Railway service

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public URL of the backend service |

Backend must have `FRONTEND_ORIGIN` set to the frontend URL and `PUBLIC_APP_URL` to the same origin (used in Stripe success/cancel URLs).

## Do not do

- Do not send `price` from the client
- Do not call Lulu or Stripe from the browser
- Do not enable Stripe Tax in the backend until tax registrations are active
- Do not use the seeded Lulu sample PDFs in production — swap product `interior_pdf_url` / `cover_pdf_url` in Postgres
