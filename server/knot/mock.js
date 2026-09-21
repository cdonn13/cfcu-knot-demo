import { Router } from "express";
import crypto from "node:crypto";
import { config } from "../config.js";
import { signWebhook } from "./verify.js";

/**
 * Embedded mock of Knot's API, mounted at /mock-knot.
 *
 * It plays the part of Knot's servers so the rest of the app can run the real
 * integration unchanged: same Basic auth, same request/response shapes as the
 * published API reference, and webhooks delivered as real signed HTTP POSTs to
 * this app's /webhooks/knot endpoint — so the signature-verification code path
 * is exercised even in mock mode.
 *
 * Endpoints mirrored from docs.knotapi.com:
 *   POST /session/create  → { session: "<uuid>" }
 *   POST /card            → {} (triggers CARD_UPDATED webhook)
 *
 * Mock-only (stands in for what Knot's hosted Link UI does internally):
 *   POST /link/login      → drives merchant auth, emits AUTHENTICATED webhook
 */

const sessions = new Map(); // session_id → { external_user_id, card_id, metadata }
const tasks = new Map();    // task_id → { session_id, merchant, timer }
let nextTaskId = 25600;     // task ids in the docs' examples look like 25605

function requireBasicAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const expected = "Basic " + Buffer.from(`${config.clientId}:${config.secret}`).toString("base64");
  if (header !== expected) {
    return res.status(401).json({ error_message: "Invalid client_id or secret." });
  }
  next();
}

async function deliverWebhook(payload) {
  const rawBody = JSON.stringify(payload);
  const contentType = "application/json";
  const signature = signWebhook({
    rawBody,
    contentType,
    event: payload.event,
    sessionId: payload.session_id,
    secret: config.secret,
  });
  try {
    await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "Knot-Signature": signature,
        "Encryption-Type": "HMAC-SHA256",
      },
      body: rawBody,
    });
  } catch (err) {
    console.error(`[mock-knot] webhook delivery failed: ${err.message}`);
  }
}

export const mockKnot = Router();

mockKnot.post("/session/create", requireBasicAuth, (req, res) => {
  const { type, external_user_id, card_id, metadata } = req.body || {};
  if (type !== "card_switcher") {
    return res.status(400).json({ error_message: `Unsupported session type: ${type}` });
  }
  if (!external_user_id || !card_id) {
    return res.status(400).json({ error_message: "external_user_id and card_id are required for card_switcher sessions." });
  }
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { external_user_id, card_id, metadata: metadata ?? null });
  res.json({ session: sessionId });
});

// The mock Link UI calls this when the user submits merchant credentials.
// Knot's real flow: user authenticates inside Link → your backend receives an
// AUTHENTICATED webhook with send_card: true → you must POST /card within 15s.
mockKnot.post("/link/login", (req, res) => {
  const { session_id, merchant_id, merchant_name } = req.body || {};
  const session = sessions.get(session_id);
  if (!session) {
    return res.status(400).json({ error_message: "INVALID_SESSION" });
  }
  const taskId = nextTaskId++;
  const merchant = { id: Number(merchant_id), name: merchant_name };
  tasks.set(taskId, { session_id, merchant, cardReceived: false });

  // Simulate the merchant login round-trip, then fire the webhook.
  setTimeout(() => {
    deliverWebhook({
      event: "AUTHENTICATED",
      session_id,
      task_id: taskId,
      external_user_id: session.external_user_id,
      merchant,
      data: { send_card: true, metadata: session.metadata },
      timestamp: Date.now(),
    });
  }, 900);

  res.status(202).json({ task_id: taskId });
});

mockKnot.post("/card", requireBasicAuth, (req, res) => {
  const { task_id, user, card } = req.body || {};
  const task = tasks.get(Number(task_id));
  if (!task) {
    return res.status(400).json({ error_message: `Unknown task_id: ${task_id}` });
  }
  if (!card?.number || !card?.expiration || !card?.cvv) {
    return res.status(400).json({ error_message: "card.number, card.expiration and card.cvv are required." });
  }
  if (!user?.name?.first_name || !user?.address?.postal_code) {
    return res.status(400).json({ error_message: "user.name and user.address are required." });
  }
  task.cardReceived = true;

  const session = sessions.get(task.session_id);
  // Simulate Knot placing the card in the merchant wallet, then confirm.
  setTimeout(() => {
    deliverWebhook({
      event: "CARD_UPDATED",
      session_id: task.session_id,
      task_id: Number(task_id),
      external_user_id: session?.external_user_id,
      merchant: task.merchant,
      data: {
        card_id: session?.card_id,
        metadata: session?.metadata,
      },
      timestamp: Date.now(),
    });
  }, 1400);

  res.json({});
});
