import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, writeJson } from "@/lib/storage";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  topic: z.string().min(1),
  message: z.string().min(5),
});

type Message = z.infer<typeof schema> & { id: string; createdAt: string };

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const list = await readJson<Message[]>("messages.json", []);
    list.unshift({
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    await writeJson("messages.json", list);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}

export async function GET() {
  const list = await readJson<Message[]>("messages.json", []);
  return NextResponse.json({ count: list.length, messages: list.slice(0, 20) });
}
