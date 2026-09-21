import { config } from "../config.js";

/**
 * Server-side Knot API client.
 *
 * Talks Basic auth (client_id:secret) against `config.knotApiBase`, which is
 * either the embedded mock (KNOT_MODE=mock) or https://development.knotapi.com
 * (KNOT_MODE=live). The request/response shapes are identical in both modes —
 * they mirror Knot's published API reference.
 */
function authHeader() {
  const token = Buffer.from(`${config.clientId}:${config.secret}`).toString("base64");
  return `Basic ${token}`;
}

async function knotFetch(path, body) {
  const res = await fetch(`${config.knotApiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json.error_message || json.message || `Knot API ${res.status} on ${path}`;
    throw new Error(message);
  }
  return json;
}

/**
 * POST /session/create → { session: "<uuid>" }
 * https://docs.knotapi.com/api-reference/sessions/create-session
 */
export function createSession({ externalUserId, cardId, metadata }) {
  return knotFetch("/session/create", {
    type: "card_switcher",
    external_user_id: externalUserId,
    card_id: cardId,
    metadata: metadata ?? null,
  });
}

/**
 * POST /card — send card details after the AUTHENTICATED webhook
 * (must arrive within 15 seconds when send_card: true).
 * https://docs.knotapi.com/card-switcher/sending-card-data
 */
export function switchCard({ taskId, user, card }) {
  return knotFetch("/card", {
    task_id: String(taskId),
    user,
    card,
  });
}
