import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import type { Member } from "@/lib/auth-server";

type Session = {
  token: string;
  memberId: string;
  expiresAt: string;
};

export async function GET() {
  const members = await readJson<Member[]>("members.json", []);
  const now = Date.now();
  const sessions = (await readJson<Session[]>("sessions.json", [])).filter(
    (s) => Date.parse(s.expiresAt) > now,
  );

  return NextResponse.json({
    members: members.map(({ passwordHash: _pw, ...rest }) => rest),
    sessions: sessions.length,
  });
}
