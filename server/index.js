import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { createSession, switchCard } from "./knot/client.js";
import { verifyWebhook } from "./knot/verify.js";
import { mockKnot } from "./knot/mock.js";
import { sseHandler, broadcast } from "./events.js";
import { demoUser, demoCard, merchants } from "./bank.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Keep the raw body around — Knot's signature covers the exact bytes sent.
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf.toString("utf8"); },
}));
app.use(express.static(path.join(__dirname, "..", "public")));

// ── Frontend config ──────────────────────────────────────────────────────────
app.get("/api/config", (_req, res) => {
  res.json({
    mode: config.mode,
    clientId: config.clientId,
    environment: config.knotEnvironment,
    webhookUrl: config.webhookUrl,
    merchants,
    user: { displayName: demoUser.displayName },
    card: {
      last4: demoCard.displayLast4,
      expiry: demoCard.displayExpiry,
      network: demoCard.network,
      productName: demoCard.productName,
    },
  });
});

// ── Step 1: backend creates a Knot session ───────────────────────────────────
app.post("/api/knot/session", async (req, res) => {
  try {
    const { session } = await createSession({
      externalUserId: demoUser.externalUserId,
      cardId: demoCard.cardId,
      metadata: { reference_token: `cfcu-${Date.now()}` },
    });
    broadcast({
      type: "api",
      title: "POST /session/create",
      detail: `Session created for ${demoUser.externalUserId} / ${demoCard.cardId}`,
      payload: { session },
    });
    res.json({
      sessionId: session,
      clientId: config.clientId,
      environment: config.knotEnvironment,
      mode: config.mode,
    });
  } catch (err) {
    console.error("session create failed:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// ── Step 3: webhooks from Knot (real or mock — same code path) ───────────────
app.post("/webhooks/knot", async (req, res) => {
  const { verified, reason } = verifyWebhook(req, config.secret);
  const event = req.body?.event;

  broadcast({
    type: "webhook",
    title: event || "UNKNOWN_EVENT",
    verified,
    verifyReason: reason,
    headers: {
      "knot-signature": req.get("Knot-Signature"),
      "content-type": req.get("Content-Type"),
      "content-length": req.get("Content-Length"),
    },
    payload: req.body,
  });

  if (!verified) {
    console.warn(`[webhook] rejected ${event}: ${reason}`);
    return res.status(401).json({ error: "invalid signature" });
  }
  res.json({ received: true }); // ack fast; Knot retries on non-200 or >10s

  // AUTHENTICATED with send_card → we have 15 seconds to send card details.
  if (event === "AUTHENTICATED" && req.body?.data?.send_card) {
    try {
      await switchCard({
        taskId: req.body.task_id,
        user: demoUser.user,
        card: demoCard.card,
      });
      broadcast({
        type: "api",
        title: "POST /card",
        detail: `Card •••• ${demoCard.displayLast4} sent for task ${req.body.task_id} (within 15s window)`,
        payload: { task_id: String(req.body.task_id), card: { number: "424242••••••4242", expiration: demoCard.card.expiration, cvv: "•••" } },
      });
    } catch (err) {
      console.error("switch card failed:", err.message);
      broadcast({ type: "error", title: "POST /card failed", detail: err.message });
    }
  }
});

// ── Live event stream for the webhook inspector & mock Link UI ───────────────
app.get("/api/events", sseHandler);

// ── Embedded mock of Knot's API (inert in live mode) ─────────────────────────
if (config.mode === "mock") {
  app.use("/mock-knot", mockKnot);
}

app.listen(config.port, () => {
  console.log(`Charles Federal Credit Union demo`);
  console.log(`  mode:        ${config.mode}${config.mode === "mock" ? " (set KNOT_MODE=live + real keys to hit development.knotapi.com)" : ""}`);
  console.log(`  app:         http://localhost:${config.port}`);
  console.log(`  knot api:    ${config.knotApiBase}`);
  console.log(`  webhook url: ${config.webhookUrl}`);
});
