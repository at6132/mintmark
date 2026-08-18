import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.js";
import { contactMessages } from "../../db/schema.js";

export const contactRoutes = new Hono();

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  topic: z.string().min(1),
  message: z.string().min(5),
});

contactRoutes.post("/v1/contact", zValidator("json", schema), async (c) => {
  const body = c.req.valid("json");
  const [row] = await db.insert(contactMessages).values(body).returning({ id: contactMessages.id });
  return c.json({ ok: true, id: row?.id });
});
