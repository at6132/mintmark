/**
 * PRODUCTS — one entry per purchasable digest.
 *
 * PLACEHOLDER. One example issue, kept so the shop and cart keep rendering.
 * Add a company here when its digest is ready to sell; `id` should match the
 * company's id in `data/companies.ts`.
 */
export const products = [
  {
    "id": "example-co",
    "slug": "example-co",
    "company": "Example Co",
    "title": "The Example Co Digest",
    "price": 24.0,
    "currency": "USD",
    "status": "AVAILABLE",
    "sector": "TECHNOLOGY",
    "ticker": "NASDAQ: EXCO",
    "summary": "One sentence on what this issue teaches and why it is worth reading.",
    "volume": "VOL. 01",
    "color": "green",
    "moduleLink": "",
    "headquarters": "CITY · USA",
    "spineHeight": 425,
    "spineWidth": 74
  }
];

export const digestCoverStyles: Record<string, { background: string; color: string }> = {
  green: { background: "linear-gradient(165deg, #2ec4a8 0%, #176d5c 48%, #0b3d34 100%)", color: "#fffdf6" },
  navy: { background: "linear-gradient(165deg, #4c6ef0 0%, #243a75 50%, #12182e 100%)", color: "#fffdf6" },
  cream: { background: "linear-gradient(165deg, #f4e6c1 0%, #d4bc7a 52%, #8a6d3b 100%)", color: "#161b2e" },
  teal: { background: "linear-gradient(165deg, #3db8c4 0%, #1a6b74 50%, #0d3a40 100%)", color: "#fffdf6" },
  gold: { background: "linear-gradient(165deg, #f0c14b 0%, #c4921a 48%, #7a5a10 100%)", color: "#161b2e" },
  red: { background: "linear-gradient(165deg, #e05a4a 0%, #9a2e28 50%, #4a1414 100%)", color: "#fffdf6" },
};

export function digestCover(color?: string | null) {
  return digestCoverStyles[color || "green"] ?? digestCoverStyles.green;
}

export function productById(id: string) {
  return products.find((p) => p.id === id);
}
