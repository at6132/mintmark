import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.js";
import { subscribers } from "../../db/schema.js";

export const newsletterRoutes = new Hono();

const schema = z.object({
  email: z.string().email(),
});

newsletterRoutes.post("/v1/newsletter", zValidator("json", schema), async (c) => {
  const { email } = c.req.valid("json");
  await db
    .insert(subscribers)
    .values({ email: email.toLowerCase() })
    .onConflictDoNothing({ target: subscribers.email });
  return c.json({ ok: true });
});
