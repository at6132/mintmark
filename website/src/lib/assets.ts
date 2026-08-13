/** Local copies of Shopify theme assets + CDN shop files */
export const assets = {
  // Header/footer logo from Shopify Files (shop_images/998e0312-...)
  logo: "/images/logo.png",
  logoCanonical: "/images/998e0312-86aa-4378-93dc-880407058e09.png",
  wordmarkMint: "/assets/mintmark-wordmark-mint.png",
  wordmarkInk: "/assets/mintmark-wordmark-ink.png",
  markTransparent: "/assets/mintmark-mark-transparent.png",
  markApp: "/assets/mintmark-mark-app.png",
  mintEmblem: "/assets/mintmark-mint-emblem.png",
  bookplate: "/assets/mintmark-bookplate.png",
  companyCoinNvda: "/assets/mintmark-company-coin-nvda.png",
  // Homepage media from Shopify Files
  heroBooks: "/images/hero-books.png",
  nvdaLead: "/images/nvda-lead.png",
  appleFeature: "/images/apple-feature.png",
  costcoFeature: "/images/costco-feature.png",
  questionCostco: "/images/question-costco.png",
  // Company / bookshelf file images
  appleLogo: "/images/aa9f57b5-bb13-471c-9f31-aaf8905e82e4.png",
  appleHero: "/images/8c72f11b-3415-4cdb-ac0c-643eacf49247.png",
  appleDigestCover: "/images/mintmark-digest-cover-reference.png",
  bookshelfDesktop: "/images/918ad2ad-aeea-4c3b-894f-9cc1cacd37eb.png",
  bookshelfMobile: "/images/c69ee960-dcda-4c7d-a3df-326f6ab46e02.png",
  bookshelfEmblem: "/images/b4f7d89e-f1bc-41ea-86a8-680c71157e96.png",
  companyModuleHero: "/images/cf0b56c0-60fe-472e-932b-217282038403.png",
  profileImage: "/images/02c045ff-7331-4798-a8b1-88192cb880b3.png",
} as const;

/** Map shopify://shop_images/name → local /images/name */
export function shopImage(ref?: string | null) {
  if (!ref) return undefined;
  const name = ref
    .replace(/^shopify:\/\/shop_images\//, "")
    .replace(/^\/?images\//, "")
    .split("?")[0];
  return `/images/${name}`;
}

export function asset(name: keyof typeof assets) {
  return assets[name];
}

/** Convert Shopify links to app routes */
export function appHref(url?: string | null) {
  if (!url) return undefined;
  let u = url
    .replace("shopify://pages/", "/")
    .replace("/pages/", "/")
    .replace("shopify://", "/");
  if (u === "/cataloge" || u === "/companies") u = "/catalog";
  if (u === "/the-mint") u = "/mint";
  if (u === "/apple") u = "/companies/apple";
  if (u === "/nvidia-digest" || u === "/nvidia") u = "/digests/nvidia";
  return u;
}
