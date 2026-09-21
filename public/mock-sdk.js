/**
 * MockKnotapiJS — a drop-in stand-in for the real `knotapi-js` Web SDK.
 *
 * Exposes the same surface the real SDK does:
 *
 *   const knotapi = new KnotapiJS();
 *   knotapi.open({ sessionId, clientId, environment, merchantIds,
 *                  onSuccess, onError, onEvent, onExit });
 *
 * so app.js is written once and works in both modes — in live mode it
 * constructs `window.KnotapiJS.default` from unpkg instead of this class.
 *
 * The modal mimics Knot Link's hosted UI: merchant login → progress while the
 * real backend flow runs (AUTHENTICATED webhook → POST /card → CARD_UPDATED
 * webhook, all over real HTTP with real signatures) → success.
 */
class MockKnotapiJS {
  open(opts) {
    const {
      sessionId, merchantIds = [], merchant = {},
      onSuccess = () => {}, onError = () => {}, onEvent = () => {}, onExit = () => {},
    } = opts;

    if (!sessionId) return onError("INVALID_SESSION", "No sessionId provided.");

    const merchantId = merchantIds[0] ?? merchant.id;
    const merchantName = merchant.name ?? "Merchant";
    const merchantIcon = merchant.icon ?? "🛍";

    // ── modal skeleton ──
    const overlay = document.createElement("div");
    overlay.className = "knot-overlay";
    overlay.innerHTML = `
      <div class="knot-modal" role="dialog" aria-label="Knot Link">
        <div class="knot-modal-head">
          <div class="knot-logo">K</div>
          <span>Knot <small style="font-weight:400;color:#a0aec0">(mock Link UI)</small></span>
          <button class="knot-close" aria-label="Close">×</button>
        </div>
        <div class="knot-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    const body = overlay.querySelector(".knot-body");
    let finished = false;

    const close = () => {
      overlay.remove();
      es.close();
      if (!finished) onExit();
    };
    overlay.querySelector(".knot-close").addEventListener("click", close);

    // ── login screen ──
    body.innerHTML = `
      <div class="knot-merchant">
        <span class="m-icon">${merchantIcon}</span>
        <div><b>${merchantName}</b><small>Sign in to update your card on file</small></div>
      </div>
      <label>Email or username</label>
      <input type="text" value="ada.lovelace@example.com" />
      <label>Password</label>
      <input type="password" value="correct-horse-battery" />
      <button class="knot-primary">Continue</button>
      <div class="knot-note">Demo credentials — nothing is sent to ${merchantName}.</div>`;

    onEvent("MERCHANT_CLICKED", merchantName, merchantId, {}, null);

    // ── listen for this session's webhooks via the app's SSE stream ──
    let taskId = null;
    const es = new EventSource("/api/events");
    es.onmessage = (msg) => {
      const evt = JSON.parse(msg.data);
      if (evt.type !== "webhook" || evt.payload?.session_id !== sessionId) return;

      if (evt.payload.event === "AUTHENTICATED") {
        onEvent("AUTHENTICATED", merchantName, merchantId, { send_card: true }, evt.payload.task_id);
        setProgress("Authenticated ✓ — placing your card in the merchant wallet…",
          `webhook AUTHENTICATED → issuer POST /card (task ${evt.payload.task_id})`);
      }
      if (evt.payload.event === "CARD_UPDATED") {
        finished = true;
        body.innerHTML = `
          <div class="knot-success">
            <div class="knot-check">✓</div>
            <div class="knot-progress-label">Card updated on ${merchantName}</div>
            <div class="knot-progress-sub">CARD_UPDATED · task ${evt.payload.task_id}</div>
            <button class="knot-primary" style="margin-top:20px">Done</button>
          </div>`;
        body.querySelector("button").addEventListener("click", close);
        onSuccess({ merchantName });
      }
    };

    const setProgress = (label, sub) => {
      body.innerHTML = `
        <div class="knot-progress">
          <div class="knot-spinner"></div>
          <div class="knot-progress-label">${label}</div>
          <div class="knot-progress-sub">${sub}</div>
        </div>`;
    };

    // ── submit → drive the mock merchant auth ──
    body.querySelector(".knot-primary").addEventListener("click", async () => {
      onEvent("LOGIN_STARTED", merchantName, merchantId, {}, null);
      setProgress(`Signing in to ${merchantName}…`, "mock merchant authentication");
      try {
        const res = await fetch("/mock-knot/link/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, merchant_id: merchantId, merchant_name: merchantName }),
        });
        if (!res.ok) throw new Error((await res.json()).error_message || "login failed");
        ({ task_id: taskId } = await res.json());
      } catch (err) {
        onError("INTERNAL_ERROR", err.message);
        close();
      }
    });
  }
}

window.MockKnotapiJS = MockKnotapiJS;
