import crypto from "node:crypto";

/**
 * Verify a Knot webhook signature.
 *
 * Per https://docs.knotapi.com/webhooks — Knot signs webhooks with
 * HMAC-SHA256 (base64) over a pipe-delimited string of headers and body
 * fields, sent in the `Knot-Signature` header:
 *
 *   Content-Length|<len>|Content-Type|<type>|Encryption-Type|HMAC-SHA256|event|<event>|session_id|<session_id>
 *
 * `session_id` is omitted from the string when the webhook has none.
 * The HMAC key is your API secret.
 */
export function buildSignatureBase({ contentLength, contentType, event, sessionId }) {
  const parts = [
    "Content-Length", String(contentLength),
    "Content-Type", contentType,
    "Encryption-Type", "HMAC-SHA256",
    "event", event,
  ];
  if (sessionId != null) parts.push("session_id", sessionId);
  return parts.join("|");
}

export function signWebhook({ rawBody, contentType, event, sessionId, secret }) {
  const base = buildSignatureBase({
    contentLength: Buffer.byteLength(rawBody),
    contentType,
    event,
    sessionId,
  });
  return crypto.createHmac("sha256", secret).update(base).digest("base64");
}

export function verifyWebhook(req, secret) {
  const received = req.get("Knot-Signature");
  if (!received) return { verified: false, reason: "missing Knot-Signature header" };

  const body = req.body || {};
  const expected = signWebhook({
    rawBody: req.rawBody ?? JSON.stringify(body),
    contentType: req.get("Content-Type") || "application/json",
    event: body.event,
    sessionId: body.session_id,
    secret,
  });

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { verified, reason: verified ? "HMAC-SHA256 signature matches" : "signature mismatch" };
}
