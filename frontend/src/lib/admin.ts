import { apiUrl } from "@/lib/api";

export type ShippingAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state_code: string;
  postcode: string;
  country_code: string;
  phone_number: string;
  email?: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type AdminPrintJob = {
  id: string;
  orderId: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  runAfter: string | null;
  lockedAt: string | null;
  lastError: string | null;
  luluPrintJobId: string | null;
  luluStatus: string | null;
  trackingId: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  payload: unknown;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminOrder = {
  id: string;
  publicId: string;
  email: string | null;
  customerName: string | null;
  phone: string | null;
  status: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingLevel: string | null;
  shippingAddress: ShippingAddress | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  itemCount: number;
  items: AdminOrderItem[];
  fulfillment: AdminPrintJob | null;
};

export type AdminCustomer = {
  key: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  guest: boolean;
  orderCount: number;
  paidOrderCount: number;
  lifetimeCents: number;
  refundedCents: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  statuses: Record<string, number>;
  products: string[];
  cities: string[];
  regions: string[];
  addresses: ShippingAddress[];
  orders: Array<{
    publicId: string;
    status: string;
    totalCents: number;
    createdAt: string | null;
  }>;
  inboxCount: number;
  subscribed: boolean;
};

export type AdminProduct = {
  id: string;
  slug: string;
  company: string;
  title: string;
  price: number;
  priceCents: number;
  currency: string;
  status: "AVAILABLE" | "COMING_SOON";
  sector: string | null;
  ticker: string | null;
  summary: string | null;
  volume: string | null;
  color: string | null;
  moduleLink: string | null;
  headquarters: string | null;
  spineHeight: number | null;
  spineWidth: number | null;
  podPackageId: string;
  pageCount: number;
  interiorPdfUrl: string;
  coverPdfUrl: string;
  samplePdf: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  unitsSold: number;
  revenueCents: number;
  orderCount: number;
};

export type AdminInbox = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  createdAt: string | null;
};

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  memberNo: string;
  createdAt: string;
};

export type AdminSnapshot = {
  generatedAt: string;
  kpis: {
    orders: number;
    openOrders: number;
    paidOrders: number;
    revenueCents: number;
    shippingCollectedCents: number;
    aovCents: number;
    customers: number;
    membersEstimate: number;
    subscribers: number;
    inbox: number;
    catalog: number;
    available: number;
    comingSoon: number;
    pressQueued: number;
    pressFailed: number;
    pressSubmitted: number;
    shipped: number;
    last24hRevenueCents: number;
    last24hOrders: number;
    unitsSold: number;
  };
  ordersByStatus: Record<string, number>;
  jobsByStatus: Record<string, number>;
  webhooksBySource: Record<string, number>;
  revenueByDay: Array<{ day: string; orders: number; revenueCents: number }>;
  revenueByProduct: Array<{
    id: string;
    title: string;
    company: string;
    ticker: string | null;
    unitsSold: number;
    revenueCents: number;
    orderCount: number;
    status: string;
  }>;
  shippingByCountry: Array<{ country: string; orders: number; revenueCents: number }>;
  catalogHealth: {
    samplePdfs: number;
    missingModule: number;
    missingTicker: number;
  };
  integrations: {
    stripe: boolean;
    lulu: boolean;
    luluBase: string;
    frontendOrigin: string;
  };
  orders: AdminOrder[];
  customers: AdminCustomer[];
  products: AdminProduct[];
  press: AdminPrintJob[];
  inbox: AdminInbox[];
  subscribers: Array<{ email: string; createdAt: string | null }>;
  webhooks: Array<{ id: string; source: string; processedAt: string | null }>;
};

const TOKEN_KEY = "mm_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

function adminHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAdminToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchAdminMe(): Promise<{ ok: true; expiresAt: string } | null> {
  const token = getAdminToken();
  if (!token) return null;
  const res = await fetch(`${apiUrl}/v1/admin/auth/me`, { headers: adminHeaders() });
  if (!res.ok) {
    setAdminToken(null);
    return null;
  }
  return (await res.json()) as { ok: true; expiresAt: string };
}

export async function requestAdminAccess(pin: string): Promise<{
  challengeId: string;
  expiresAt: string;
  notified: number;
  dev?: boolean;
}> {
  const res = await fetch(`${apiUrl}/v1/admin/auth/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    challengeId?: string;
    expiresAt?: string;
    notified?: number;
    dev?: boolean;
  };
  if (!res.ok || !data.challengeId || !data.expiresAt) {
    throw new Error(data.error || "Access request failed.");
  }
  return {
    challengeId: data.challengeId,
    expiresAt: data.expiresAt,
    notified: data.notified ?? 0,
    dev: data.dev,
  };
}

export async function pollAdminChallenge(id: string): Promise<{ status: string; expiresAt: string }> {
  const res = await fetch(`${apiUrl}/v1/admin/auth/status/${id}`);
  const data = (await res.json().catch(() => ({}))) as { error?: string; status?: string; expiresAt?: string };
  if (!res.ok || !data.status || !data.expiresAt) throw new Error(data.error || "Challenge missing.");
  return { status: data.status, expiresAt: data.expiresAt };
}

export async function completeAdminChallenge(challengeId: string): Promise<{ token: string; expiresAt: string }> {
  const res = await fetch(`${apiUrl}/v1/admin/auth/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; token?: string; expiresAt?: string };
  if (!res.ok || !data.token || !data.expiresAt) throw new Error(data.error || "Could not open session.");
  setAdminToken(data.token);
  return { token: data.token, expiresAt: data.expiresAt };
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${apiUrl}/v1/admin/auth/logout`, { method: "POST", headers: adminHeaders() });
  } finally {
    setAdminToken(null);
  }
}

export async function fetchAdminSnapshot(): Promise<AdminSnapshot> {
  const res = await fetch(`${apiUrl}/v1/admin`, { headers: adminHeaders() });
  if (res.status === 401) {
    setAdminToken(null);
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Admin desk could not reach the press (${res.status}).`);
  }
  return (await res.json()) as AdminSnapshot;
}

export async function fetchAdminMembers(): Promise<{ members: AdminMember[]; sessions: number }> {
  const res = await fetch("/api/admin/members", { headers: adminHeaders() });
  if (!res.ok) return { members: [], sessions: 0 };
  return (await res.json()) as { members: AdminMember[]; sessions: number };
}

export async function patchAdminProduct(
  id: string,
  patch: { status?: "AVAILABLE" | "COMING_SOON"; priceCents?: number },
) {
  const res = await fetch(`${apiUrl}/v1/admin/products/${id}`, {
    method: "PATCH",
    headers: adminHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Could not update the catalog.");
  }
}
