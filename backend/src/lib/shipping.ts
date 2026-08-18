export const LULU_SHIPPING_LEVELS = [
  "MAIL",
  "GROUND",
  "PRIORITY_MAIL",
  "EXPEDITED",
  "EXPRESS",
] as const;

export type LuluShippingLevel = (typeof LULU_SHIPPING_LEVELS)[number];

/** Customer-facing Stripe shipping options. Amounts are what the buyer pays, not Lulu cost. */
export const STRIPE_SHIPPING_OPTIONS: Array<{
  level: LuluShippingLevel;
  displayName: string;
  amountCents: number;
  minDays: number;
  maxDays: number;
}> = [
  { level: "MAIL", displayName: "Standard mail", amountCents: 599, minDays: 7, maxDays: 21 },
  { level: "GROUND", displayName: "Ground", amountCents: 899, minDays: 4, maxDays: 8 },
  { level: "PRIORITY_MAIL", displayName: "Priority mail", amountCents: 1299, minDays: 2, maxDays: 5 },
  { level: "EXPEDITED", displayName: "Expedited", amountCents: 2499, minDays: 2, maxDays: 3 },
  { level: "EXPRESS", displayName: "Express", amountCents: 3999, minDays: 1, maxDays: 2 },
];

export const DEFAULT_SHIPPING_COUNTRIES = [
  "US",
  "CA",
  "GB",
  "AU",
  "DE",
  "FR",
  "IE",
  "NL",
  "ES",
  "IT",
  "SE",
  "NO",
  "DK",
  "NZ",
] as const;

export function isShippingLevel(value: string): value is LuluShippingLevel {
  return (LULU_SHIPPING_LEVELS as readonly string[]).includes(value);
}
