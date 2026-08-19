import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Context, Next } from "hono";
import {
  adminPinConfigured,
  authNotConfiguredMessage,
  challengeDecisionUrls,
  challengeMessage,
  consumeChallenge,
  createChallenge,
  decideChallenge,
  decideLatestPending,
  getChallenge,
  parseWhatsAppCommand,
  revokeSession,
  sessionFromBearer,
  verifyAdminPin,
  verifyChallengeDecisionToken,
} from "../../lib/admin-auth.js";
import { isOperatorPhone, operatorNumbers } from "../../lib/phones.js";
import {
  notifyOperators,
  parseInboundMessages,
  sendWhatsApp,
  verifyMetaSignature,
  whatsappConfigured,
} from "../../lib/whatsapp.js";
import { env, isProd } from "../../env.js";

export const adminAuthRoutes = new Hono();

function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.slice(0, 128);
  }
  return c.req.header("x-real-ip")?.slice(0, 128) || "unknown";
}

function publicApiOrigin(c: Context): string {
  const proto = (c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", ""))
    .split(",")[0]!
    .trim();
  const host = (c.req.header("x-forwarded-host") || c.req.header("host") || "").split(",")[0]!.trim();
  if (host) return `${proto}://${host}`;
  return env().PUBLIC_APP_URL;
}

function userAgent(c: Context): string {
  return c.req.header("user-agent")?.slice(0, 400) || "unknown";
}

function decisionHtml(title: string, body: string): string {
  const safeTitle = title.replace(/[<>&]/g, "");
  const safeBody = body.replace(/[<>&]/g, "");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background: #111; color: #eee; padding: 2rem 1.25rem; max-width: 28rem; }
    h1 { font-size: 1.15rem; margin: 0 0 0.5rem; }
    p { margin: 0; color: #bbb; line-height: 1.45; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeBody}</p>
</body>
</html>`;
}

export async function requireAdminSession(c: Context, next: Next) {
  const session = await sessionFromBearer(c.req.header("authorization"));
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  await next();
}

adminAuthRoutes.get("/v1/admin/auth/me", async (c) => {
  const session = await sessionFromBearer(c.req.header("authorization"));
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  return c.json({
    ok: true,
    expiresAt: session.expiresAt,
    breakGlass: session.id === "break-glass",
  });
});

adminAuthRoutes.post(
  "/v1/admin/auth/request",
  zValidator(
    "json",
    z.object({
      pin: z.string().min(4).max(64),
    }),
  ),
  async (c) => {
    if (!adminPinConfigured() || operatorNumbers().length === 0) {
      return c.json({ error: authNotConfiguredMessage() }, 503);
    }
    const { pin } = c.req.valid("json");
    if (!verifyAdminPin(pin)) {
      return c.json({ error: "Invalid pin" }, 401);
    }

    const challenge = await createChallenge({ ip: clientIp(c), userAgent: userAgent(c) });
    const links = challengeDecisionUrls(publicApiOrigin(c), challenge);
    const body = challengeMessage(challenge, links);

    if (whatsappConfigured()) {
      const notify = await notifyOperators(body);
      if (notify.sent === 0) {
        return c.json(
          {
            error:
              notify.lastError ||
              "WhatsApp notify failed. Check Cloud API token, phone number id, and that both operators are test recipients who have messaged the bot.",
          },
          502,
        );
      }
      return c.json({
        challengeId: challenge.id,
        status: "pending",
        expiresAt: challenge.expiresAt.toISOString(),
        notified: notify.sent,
      });
    }

    if (isProd()) {
      return c.json({ error: "WhatsApp Cloud API is not configured" }, 503);
    }

    console.warn("ADMIN CHALLENGE (dev, WhatsApp unset)\n" + body);
    return c.json({
      challengeId: challenge.id,
      status: "pending",
      expiresAt: challenge.expiresAt.toISOString(),
      notified: 0,
      dev: true,
    });
  },
);

adminAuthRoutes.get("/v1/admin/auth/status/:id", async (c) => {
  const row = await getChallenge(c.req.param("id"));
  if (!row) return c.json({ error: "Challenge not found" }, 404);
  return c.json({
    challengeId: row.id,
    status: row.status,
    expiresAt: row.expiresAt.toISOString(),
  });
});

adminAuthRoutes.post(
  "/v1/admin/auth/complete",
  zValidator("json", z.object({ challengeId: z.string().regex(/^mmadm_[a-f0-9]{6}$/) })),
  async (c) => {
    const { challengeId } = c.req.valid("json");
    const result = await consumeChallenge(challengeId, { ip: clientIp(c), userAgent: userAgent(c) });
    if (!result.ok) return c.json({ error: result.error }, result.status as 202 | 403 | 404 | 409 | 410);
    return c.json({ token: result.token, expiresAt: result.expiresAt });
  },
);

adminAuthRoutes.post("/v1/admin/auth/logout", async (c) => {
  await revokeSession(c.req.header("authorization"));
  return c.json({ ok: true });
});

adminAuthRoutes.get("/v1/admin/auth/wa", async (c) => {
  const token = c.req.query("t") || "";
  const parsed = verifyChallengeDecisionToken(token);
  if (!parsed) {
    return c.html(decisionHtml("Link invalid", "This allow/deny link is expired or malformed."), 400);
  }
  const result = await decideChallenge(
    parsed.challengeId,
    parsed.action === "allow" ? "allowed" : "denied",
    "whatsapp-link",
  );
  if (result.ok) {
    return c.html(
      decisionHtml(
        result.status === "allowed" ? "Allowed" : "Denied",
        result.status === "allowed"
          ? "Go back to the laptop. The admin desk can continue."
          : "This login request was denied.",
      ),
    );
  }
  if (result.reason === "expired") {
    return c.html(decisionHtml("Expired", "Ask them to request access again."), 410);
  }
  if (result.reason === "already_decided") {
    return c.html(decisionHtml("Already decided", `This challenge is already ${result.status}.`));
  }
  return c.html(decisionHtml("Not found", "Unknown challenge."), 404);
});

/** Local-only: approve the pending challenge without WhatsApp. */
adminAuthRoutes.post("/v1/admin/auth/dev-allow", async (c) => {
  if (isProd()) return c.json({ error: "Not found" }, 404);
  const result = await decideLatestPending("allowed", "+15550000000");
  if (!result.ok) return c.json({ error: result.reason }, 400);
  return c.json({ ok: true, challengeId: result.id, status: result.status });
});

adminAuthRoutes.on(["GET", "HEAD"], "/v1/webhooks/whatsapp", (c) => {
  if (c.req.method === "HEAD") {
    return c.body(null, 200);
  }

  const url = new URL(c.req.url);
  const mode = url.searchParams.get("hub.mode") || c.req.query("hub.mode") || "";
  const token = (url.searchParams.get("hub.verify_token") || c.req.query("hub.verify_token") || "").trim();
  const challenge = url.searchParams.get("hub.challenge") || c.req.query("hub.challenge") || "";
  const expected = env().WHATSAPP_VERIFY_TOKEN.trim();

  if (!mode) {
    return c.text("ok", 200);
  }
  if (mode === "subscribe" && expected && token === expected) {
    return c.text(challenge, 200);
  }
  return c.text("Forbidden", 403);
});

adminAuthRoutes.post("/v1/webhooks/whatsapp", async (c) => {
  const raw = await c.req.text();
  const secret = env().WHATSAPP_APP_SECRET.trim();
  if (secret) {
    if (!verifyMetaSignature(raw, c.req.header("x-hub-signature-256"))) {
      return c.json({ error: "Invalid signature" }, 401);
    }
  } else if (isProd()) {
    return c.json({ error: "WHATSAPP_APP_SECRET is required" }, 503);
  }

  let payload: unknown;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  for (const message of parseInboundMessages(payload)) {
    await handleOperatorMessage(message.from, message.body);
  }
  return c.json({ ok: true }, 200);
});

async function handleOperatorMessage(from: string, body: string): Promise<void> {
  if (!isOperatorPhone(from)) return;

  const command = parseWhatsAppCommand(body);
  if (!command) {
    if (body.trim().startsWith("/")) {
      await sendWhatsApp(from, "Mintmark admin bot\n\n/allow\n/deny\n/allow mmadm_xxxxxx");
    }
    return;
  }

  const result = command.challengeId
    ? await decideChallenge(command.challengeId, command.action === "allow" ? "allowed" : "denied", from)
    : await decideLatestPending(command.action === "allow" ? "allowed" : "denied", from);

  let reply = "No pending admin login.";
  if (result.ok) {
    reply =
      result.status === "allowed"
        ? `Allowed ${result.id}. The browser can continue.`
        : `Denied ${result.id}.`;
  } else if (result.reason === "expired") {
    reply = `Challenge ${result.id ?? ""} expired. Ask them to request again.`.trim();
  } else if (result.reason === "already_decided") {
    reply = `Already ${result.status} (${result.id}).`;
  } else if (result.reason === "not_found") {
    reply = "Unknown challenge id.";
  }

  await sendWhatsApp(from, reply);
}
