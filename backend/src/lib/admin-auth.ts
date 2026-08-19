import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { adminChallenges, adminSessions, type AdminSession } from "../db/schema.js";
import { env, isProd } from "../env.js";
import { normalizeE164 } from "./phones.js";

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function adminPinConfigured(): boolean {
  return env().ADMIN_PIN.trim().length >= 4;
}

export function verifyAdminPin(input: string): boolean {
  const expected = env().ADMIN_PIN;
  if (!expected || expected.length < 4) return false;
  const a = Buffer.from(input.normalize("NFKC"));
  const b = Buffer.from(expected.normalize("NFKC"));
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  const sameHash = timingSafeEqual(ha, hb);
  return sameHash && a.length === b.length;
}

export function verifyBreakGlassToken(bearer: string | undefined): boolean {
  const expected = env().ADMIN_API_TOKEN.trim();
  if (!expected || !bearer) return false;
  const a = createHash("sha256").update(bearer).digest();
  const b = createHash("sha256").update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b) && bearer.length === expected.length;
}

export function newChallengeId(): string {
  return `mmadm_${randomBytes(3).toString("hex")}`;
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createChallenge(meta: { ip: string; userAgent: string }) {
  const id = newChallengeId();
  const now = new Date();
  const [row] = await db
    .insert(adminChallenges)
    .values({
      id,
      status: "pending",
      ip: meta.ip.slice(0, 128),
      userAgent: meta.userAgent.slice(0, 400),
      createdAt: now,
      expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
    })
    .returning();
  return row!;
}

export async function getChallenge(id: string) {
  const [row] = await db.select().from(adminChallenges).where(eq(adminChallenges.id, id)).limit(1);
  if (!row) return null;
  if (row.status === "pending" && row.expiresAt.getTime() < Date.now()) {
    const [updated] = await db
      .update(adminChallenges)
      .set({ status: "expired" })
      .where(and(eq(adminChallenges.id, id), eq(adminChallenges.status, "pending")))
      .returning();
    return updated ?? { ...row, status: "expired" as const };
  }
  return row;
}

export async function decideLatestPending(action: "allowed" | "denied", phone: string) {
  const pending = await db
    .select()
    .from(adminChallenges)
    .where(eq(adminChallenges.status, "pending"))
    .orderBy(desc(adminChallenges.createdAt))
    .limit(8);
  for (const row of pending) {
    const fresh = await getChallenge(row.id);
    if (fresh?.status === "pending") return decideChallenge(fresh.id, action, phone);
  }
  return { ok: false as const, reason: "no_pending" as const };
}

export async function decideChallenge(id: string, action: "allowed" | "denied", phone: string) {
  const row = await getChallenge(id);
  if (!row) return { ok: false as const, reason: "not_found" as const };
  if (row.status === "expired") return { ok: false as const, reason: "expired" as const, id: row.id };
  if (row.status !== "pending") return { ok: false as const, reason: "already_decided" as const, id: row.id, status: row.status };
  const [updated] = await db
    .update(adminChallenges)
    .set({
      status: action,
      decidedAt: new Date(),
      decidedByPhone: normalizeE164(phone),
    })
    .where(and(eq(adminChallenges.id, id), eq(adminChallenges.status, "pending")))
    .returning();
  if (!updated) return { ok: false as const, reason: "already_decided" as const, id };
  return { ok: true as const, id: updated.id, status: updated.status };
}

export async function consumeChallenge(id: string, meta: { ip: string; userAgent: string }) {
  const row = await getChallenge(id);
  if (!row) return { ok: false as const, error: "Challenge not found", status: 404 };
  if (row.status === "pending") return { ok: false as const, error: "Waiting for WhatsApp allow", status: 202 };
  if (row.status === "denied") return { ok: false as const, error: "Access denied", status: 403 };
  if (row.status === "expired") return { ok: false as const, error: "Challenge expired", status: 410 };
  if (row.status === "consumed") return { ok: false as const, error: "Challenge already used", status: 409 };

  const token = newSessionToken();
  const now = new Date();
  await db.insert(adminSessions).values({
    tokenHash: hashToken(token),
    challengeId: row.id,
    ip: meta.ip.slice(0, 128),
    userAgent: meta.userAgent.slice(0, 400),
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
  });
  await db
    .update(adminChallenges)
    .set({ status: "consumed", consumedAt: now })
    .where(eq(adminChallenges.id, id));

  return {
    ok: true as const,
    token,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
}

export async function sessionFromBearer(header: string | undefined): Promise<AdminSession | null> {
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  if (verifyBreakGlassToken(token)) {
    return {
      id: "break-glass",
      tokenHash: "break-glass",
      challengeId: null,
      ip: null,
      userAgent: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      revokedAt: null,
    };
  }
  const [row] = await db
    .select()
    .from(adminSessions)
    .where(and(eq(adminSessions.tokenHash, hashToken(token)), isNull(adminSessions.revokedAt)))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

export async function revokeSession(header: string | undefined): Promise<void> {
  if (!header || !header.toLowerCase().startsWith("bearer ")) return;
  const token = header.slice(7).trim();
  if (!token || verifyBreakGlassToken(token)) return;
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(eq(adminSessions.tokenHash, hashToken(token)));
}

export function parseWhatsAppCommand(body: string): { action: "allow" | "deny"; challengeId?: string } | null {
  const text = body.trim().replace(/^\s*["']|["']\s*$/g, "");
  const match = text.match(/^\/(allow|deny)(?:\s+(mmadm_[a-f0-9]{6}))?\s*$/i);
  if (!match) return null;
  return {
    action: match[1]!.toLowerCase() as "allow" | "deny",
    challengeId: match[2]?.toLowerCase(),
  };
}

function decisionSecret(): string {
  const cfg = env();
  return cfg.WHATSAPP_APP_SECRET.trim() || cfg.ADMIN_PIN.trim();
}

export function signChallengeDecision(challengeId: string, action: "allow" | "deny", expiresAt: Date): string {
  const exp = Math.floor(expiresAt.getTime() / 1000);
  const payload = `${challengeId}.${action}.${exp}`;
  const sig = createHmac("sha256", decisionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyChallengeDecisionToken(
  token: string,
): { challengeId: string; action: "allow" | "deny" } | null {
  const match = token.trim().match(/^(mmadm_[a-f0-9]{6})\.(allow|deny)\.(\d+)\.([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  const challengeId = match[1]!;
  const action = match[2]! as "allow" | "deny";
  const exp = Number(match[3]);
  const sig = match[4]!;
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const payload = `${challengeId}.${action}.${exp}`;
  const expected = createHmac("sha256", decisionSecret()).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { challengeId, action };
}

export function challengeDecisionUrls(
  apiOrigin: string,
  row: { id: string; expiresAt: Date },
): { allow: string; deny: string } {
  const base = apiOrigin.replace(/\/$/, "");
  return {
    allow: `${base}/v1/admin/auth/wa?t=${encodeURIComponent(signChallengeDecision(row.id, "allow", row.expiresAt))}`,
    deny: `${base}/v1/admin/auth/wa?t=${encodeURIComponent(signChallengeDecision(row.id, "deny", row.expiresAt))}`,
  };
}

export function challengeMessage(
  row: { id: string; ip: string | null; userAgent: string | null; createdAt: Date },
  links?: { allow: string; deny: string },
) {
  const ua = (row.userAgent || "unknown").slice(0, 80);
  const lines = [
    "Mintmark admin login request",
    "",
    `challenge: ${row.id}`,
    `ip: ${row.ip || "unknown"}`,
    `ua: ${ua}`,
    `at: ${row.createdAt.toISOString()}`,
    "",
  ];
  if (links) {
    lines.push("Tap Allow:", links.allow, "", "Tap Deny:", links.deny);
  } else {
    lines.push("Reply from this phone only:", "/allow", "/deny", "", `Or /allow ${row.id}`);
  }
  return lines.join("\n");
}

export function authNotConfiguredMessage(): string {
  if (isProd()) return "Admin auth is not configured";
  return "Set ADMIN_PIN, ADMIN_WHATSAPP_NUMBERS, and WhatsApp Cloud API env vars, then migrate (0001_admin_auth.sql).";
}
