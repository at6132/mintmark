import { Hono } from "hono";
import { z } from "zod";
import { db } from "../../db/index.js";
import { subscribers } from "../../db/schema.js";
import { emailSchema, jsonValidator } from "../lib/validation.js";

export const newsletterRoutes = new Hono();

const schema = z.object({
  email: emailSchema,
});

newsletterRoutes.post("/v1/newsletter", jsonValidator(schema), async (c) => {
  const { email } = c.req.valid("json");
  await db.insert(subscribers).values({ email }).onConflictDoNothing({ target: subscribers.email });
  return c.json({ ok: true });
});
