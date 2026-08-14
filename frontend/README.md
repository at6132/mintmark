# Mintmark

Standalone recreation of the Mintmark Shopify editorial store — Next.js frontend + API backend, deployable on Railway.

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, CSS
- **Backend:** Next.js Route Handlers (`/api/*`) for health, products, cart, newsletter, contact, search
- **Data:** Seeded content extracted from the Shopify theme JSON templates

## Pages

| Route | Source template |
|-------|-----------------|
| `/` | `templates/index.json` |
| `/mission` | `page.mission.json` |
| `/mint` | `page.mint.json` |
| `/bookshelf` | `page.bookshelf.json` |
| `/companies` | `page.cataloge.json` |
| `/companies/apple` | `page.apple.json` |
| `/digests/nvidia` | `page.nvidia-digest.json` |
| `/contact` | `page.contact.json` |
| `/shop` | product digests |
| `/cart` | cart drawer equivalent |
| `/404` | not found |

## Local development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Railway

From the `frontend` directory:

```bash
railway up
```

Or connect this folder as a Railway service root. The Dockerfile builds a standalone Next.js server. Railway injects `PORT` automatically.

### Optional env vars

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (Railway sets this) |
| `CONTACT_NOTIFY_EMAIL` | Optional destination label stored with contact messages |

Contact + newsletter messages are stored in `data/*.json` on the filesystem (fine for demo/MVP). Swap for Postgres/Redis later if needed.

## Note on media

Shopify CDN assets (`shopify://shop_images/...`) are theme references, not files in the theme zip. This site recreates imagery with CSS/SVG editorial graphics so every page works offline and on Railway without CDN secrets.
