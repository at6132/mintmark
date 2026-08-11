import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, writeJson } from "@/lib/storage";

const schema = z.object({
  email: z.string().email(),
});

type Subscriber = { email: string; createdAt: string };

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const list = await readJson<Subscriber[]>("subscribers.json", []);
    if (!list.some((s) => s.email.toLowerCase() === body.email.toLowerCase())) {
      list.push({ email: body.email, createdAt: new Date().toISOString() });
      await writeJson("subscribers.json", list);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}

export async function GET() {
  const list = await readJson<Subscriber[]>("subscribers.json", []);
  return NextResponse.json({ count: list.length });
}
