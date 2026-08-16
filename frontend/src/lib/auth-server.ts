import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { readJson, writeJson } from "@/lib/storage";

const scrypt = promisify(scryptCb);

export const SESSION_COOKIE = "mm_ledger";
const SESSION_DAYS = 30;
const KEYLEN = 64;

export type Member = {
  id: string;
  name: string;
  email: string;
  memberNo: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicMember = Omit<Member, "passwordHash">;

type Session = {
  token: string;
  memberId: string;
  expiresAt: string;
};

function publicMember(member: Member): PublicMember {
  const { passwordHash: _, ...rest } = member;
  return rest;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const key = (await scrypt(password, salt, expected.length)) as Buffer;
  if (key.length !== expected.length) return false;
  return timingSafeEqual(key, expected);
}

async function loadMembers(): Promise<Member[]> {
  return readJson<Member[]>("members.json", []);
}

async function saveMembers(members: Member[]): Promise<void> {
  await writeJson("members.json", members);
}

async function loadSessions(): Promise<Session[]> {
  const now = Date.now();
  const sessions = await readJson<Session[]>("sessions.json", []);
  return sessions.filter((s) => Date.parse(s.expiresAt) > now);
}

async function saveSessions(sessions: Session[]): Promise<void> {
  await writeJson("sessions.json", sessions);
}

function nextMemberNo(members: Member[]): string {
  const n = 1400 + members.length + 1;
  return `MM-${String(n).padStart(5, "0")}`;
}

export async function createMember(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ member: PublicMember } | { error: string; status: number }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { error: "Please give a name for the plate.", status: 400 };
  if (input.password.length < 8) {
    return { error: "Password needs at least 8 characters.", status: 400 };
  }

  const members = await loadMembers();
  if (members.some((m) => m.email === email)) {
    return { error: "That email is already on the ledger. Sign in instead.", status: 409 };
  }

  const member: Member = {
    id: crypto.randomUUID(),
    name,
    email,
    memberNo: nextMemberNo(members),
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  members.push(member);
  await saveMembers(members);
  await createSession(member.id);
  return { member: publicMember(member) };
}

export async function authenticateMember(input: {
  email: string;
  password: string;
}): Promise<{ member: PublicMember } | { error: string; status: number }> {
  const email = input.email.trim().toLowerCase();
  const members = await loadMembers();
  const member = members.find((m) => m.email === email);
  const ok = member ? await verifyPassword(input.password, member.passwordHash) : false;
  if (!member || !ok) {
    return { error: "Those credentials don’t match the ledger.", status: 401 };
  }
  await createSession(member.id);
  return { member: publicMember(member) };
}

async function createSession(memberId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const sessions = await loadSessions();
  sessions.push({ token, memberId, expiresAt: expires.toISOString() });
  await saveSessions(sessions);
  cookies().set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readSessionMember(): Promise<PublicMember | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessions = await loadSessions();
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  const members = await loadMembers();
  const member = members.find((m) => m.id === session.memberId);
  return member ? publicMember(member) : null;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const sessions = (await loadSessions()).filter((s) => s.token !== token);
    await saveSessions(sessions);
  }
  cookies().set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
