import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/health", (c) =>
  c.json({
    ok: true,
    service: "mintmark-api",
    time: new Date().toISOString(),
  }),
);
