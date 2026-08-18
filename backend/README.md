# Mintmark backend

Hono API + Postgres + a separate Lulu worker. The Next.js app in `frontend/` is untouched; see [FRONTEND_CHANGES.md](./FRONTEND_CHANGES.md) for the storefront edits still needed.

## Railway services

Create **four** services in one project:

| Service | Root | Dockerfile | Start |
|---|---|---|---|
| Postgres | Railway plugin | — | `railway add --database postgres` |
| backend | `backend/` | `Dockerfile` | migrate + API |
| worker | `backend/` | `Dockerfile.worker` | print-job loop |
| frontend | `frontend/` | existing | Next.js |

Share `DATABASE_URL` with backend and worker via a variable reference (`${{Postgres.DATABASE_URL}}`). Give backend a public domain for Stripe and Lulu webhooks.

## Local

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev          # API on :3001
npm run dev:worker   # second terminal
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/v1/products` | catalog |
| GET | `/v1/products/:id` | one product |
| POST | `/v1/checkout` | create Stripe Checkout Session |
| POST | `/v1/shipping/quote` | Lulu shipping quote |
| GET | `/v1/orders/:id` | order by uuid or `mm_…` public id |
| GET | `/v1/orders/session/:sessionId` | order after Stripe redirect |
| POST | `/v1/contact` | contact form |
| POST | `/v1/newsletter` | newsletter |
| POST | `/v1/webhooks/stripe` | Stripe webhooks (raw body) |
| POST | `/v1/webhooks/lulu` | Lulu `PRINT_JOB_STATUS_CHANGED` |

Checkout body (prices always come from Postgres, never the client):

```json
{ "items": [{ "id": "apple", "quantity": 1 }] }
```

Stripe Checkout collects shipping address and phone. After `checkout.session.completed`, the worker submits a Lulu print-job.

## Stripe Dashboard

1. Restricted key (`rk_`) with Checkout Sessions + webhook read.
2. Webhook URL: `https://<backend>/v1/webhooks/stripe`
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
4. Do not enable Stripe Tax until you have an active registration.

## Lulu

1. Sandbox keys from [developers.lulu.com](https://developers.lulu.com)
2. `LULU_API_BASE=https://api.sandbox.lulu.com`
3. Webhook URL: `https://<backend>/v1/webhooks/lulu` topic `PRINT_JOB_STATUS_CHANGED`
4. Production Lulu account needs a saved payment method or jobs stay `UNPAID`
5. Replace seeded Dropbox sample PDFs with real interior/cover URLs on each product before going live

## Env

See `.env.example`. Store secrets in Railway variables, not in git.
