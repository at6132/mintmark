import { NextResponse } from "next/server";
import { z } from "zod";
import { createMember } from "@/lib/auth-server";

const schema = z.object({
  name: z.string().min(2, "Please give a name for the plate."),
  email: z.string().email("That email doesn’t look right."),
  password: z.string().min(8, "Password needs at least 8 characters."),
});

export async function POST(req: Request) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const body = schema.parse(raw);
    const result = await createMember(body);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ member: result.member });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not open the ledger." }, { status: 500 });
  }
}
