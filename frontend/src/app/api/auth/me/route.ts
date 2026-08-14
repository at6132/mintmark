import { NextResponse } from "next/server";
import { readSessionMember } from "@/lib/auth-server";

export async function GET() {
  const member = await readSessionMember();
  return NextResponse.json({ member });
}
