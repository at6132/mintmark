# Mintmark monorepo

| Folder | What it is |
|--------|------------|
| Theme root (`assets/`, `sections/`, `templates/`, …) | Original Shopify theme (source of content + design) |
| [`website/`](./website/) | **Standalone site** — Next.js frontend + API, ready for Railway |

## Deploy / run the real site

```bash
cd website
npm install
npm run dev
```

See [`website/README.md`](./website/README.md) for Railway Dockerfile deploy steps.
