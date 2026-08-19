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
  // Homepage media from Shopify Files
  heroBooks: "/images/hero-books.png",
  // Placeholder art. Swap these for the day's real images, or point the block's
  // own image field at an upload — nothing else needs to change.
  leadPlaceholder: "/images/placeholder-lead.svg",
  questionPlaceholder: "/images/placeholder-lead.svg",
  // Company / bookshelf file images
  digestCoverReference: "/images/mintmark-digest-cover-reference.png",
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
  if (u === "/companies/apple") u = "/catalog";
  return u;
}
