import { Hono } from "hono";
import { z } from "zod";
import { db } from "../../db/index.js";
import { contactMessages } from "../../db/schema.js";
import { emailSchema, jsonValidator } from "../lib/validation.js";

export const contactRoutes = new Hono();

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+(). \-]*$/)
    .optional(),
  topic: z.string().trim().min(1).max(80),
  message: z.string().trim().min(5).max(4000),
});

contactRoutes.post("/v1/contact", jsonValidator(schema), async (c) => {
  const body = c.req.valid("json");
  await db.insert(contactMessages).values(body);
  return c.json({ ok: true });
});
