/**
 * Charles Federal Credit Union — member app.
 *
 * The integration surface is exactly what a real issuer ships:
 *   1. ask our backend for a Knot session   (POST /api/knot/session)
 *   2. open the Knot Link SDK with it       (knotapi.open({...}))
 *   3. watch webhooks land                  (SSE from /api/events)
 *
 * In mock mode the SDK is MockKnotapiJS; in live mode the real knotapi-js
 * bundle is loaded from unpkg and constructed identically.
 */
let CONFIG = null;
const statusByMerchant = new Map();

async function loadRealSdk() {
  if (window.KnotapiJS) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/knotapi-js@next";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load knotapi-js from unpkg"));
    document.head.appendChild(s);
  });
}

function makeSdk() {
  if (CONFIG.mode === "live") {
    const KnotapiJS = window.KnotapiJS.default;
    return new KnotapiJS();
  }
  return new window.MockKnotapiJS();
}

// ── UI: merchants ────────────────────────────────────────────────────────────
function renderMerchants() {
  const list = document.getElementById("merchant-list");
  list.innerHTML = "";
  for (const m of CONFIG.merchants) {
    const li = document.createElement("li");
    li.className = "merchant";
    li.innerHTML = `
      <span class="merchant-icon">${m.icon}</span>
      <div>
        <div class="merchant-name">${m.name}</div>
        <div class="merchant-status" data-status="${m.id}">Card on file ends in old card</div>
      </div>
      <button data-id="${m.id}">Update card</button>`;
    li.querySelector("button").addEventListener("click", () => startFlow(m, li));
    list.appendChild(li);
  }
}

function setMerchantStatus(merchantId, text, cls) {
  const el = document.querySelector(`[data-status="${merchantId}"]`);
  if (!el) return;
  el.textContent = text;
  el.className = `merchant-status ${cls || ""}`;
}

// ── The flow ─────────────────────────────────────────────────────────────────
async function startFlow(merchant, li) {
  const button = li.querySelector("button");
  button.disabled = true;
  setMerchantStatus(merchant.id, "Opening Knot Link…", "working");
  markStep("session", false); markStep("sdk", false);
  markStep("authenticated", false); markStep("card", false); markStep("updated", false);

  try {
    // 1 — backend creates the session
    const res = await fetch("/api/knot/session", { method: "POST" });
    if (!res.ok) throw new Error((await res.json()).error || "session create failed");
    const { sessionId, clientId, environment } = await res.json();
    markStep("session", true);

    // 2 — open the Link SDK (real or mock, same call)
    if (CONFIG.mode === "live") await loadRealSdk();
    const knotapi = makeSdk();
    markStep("sdk", true);

    knotapi.open({
      sessionId,
      clientId,
      environment,
      merchantIds: [merchant.id],
      merchant, // extra context used only by the mock Link UI
      entryPoint: "card_dashboard",
      onEvent: (event, merchantName, merchantId, payload, taskId) => {
        console.log("[knot onEvent]", event, { merchantName, merchantId, payload, taskId });
        if (event === "AUTHENTICATED") {
          setMerchantStatus(merchant.id, "Authenticated — switching card…", "working");
        }
      },
      onSuccess: ({ merchantName }) => {
        setMerchantStatus(merchant.id, `Card •••• ${CONFIG.card.last4} on file ✓ just updated`, "updated");
        button.textContent = "Updated ✓";
      },
      onError: (code, description) => {
        setMerchantStatus(merchant.id, `Error: ${code} — ${description}`, "");
        button.disabled = false;
      },
      onExit: () => {
        if (!statusByMerchant.get(merchant.id)) {
          setMerchantStatus(merchant.id, "Update canceled", "");
          button.disabled = false;
        }
      },
    });
  } catch (err) {
    setMerchantStatus(merchant.id, `Error: ${err.message}`, "");
    button.disabled = false;
  }
}

// ── Console: flow steps + live log ──────────────────────────────────────────
function markStep(step, done) {
  const li = document.querySelector(`.flow-steps [data-step="${step}"]`);
  if (li) li.classList.toggle("done", done);
}

function appendLog(evt) {
  const log = document.getElementById("log");
  log.querySelector(".log-empty")?.remove();

  const entry = document.createElement("details");
  entry.className = `log-entry ${evt.type}`;
  const time = new Date(evt.at).toLocaleTimeString();
  const badge =
    evt.type === "webhook"
      ? `<span class="badge ${evt.verified ? "ok" : "bad"}">${evt.verified ? "SIGNATURE VERIFIED" : "BAD SIGNATURE"}</span>`
      : "";
  entry.innerHTML = `
    <summary>
      <span class="log-time">${time}</span>
      <span class="log-title">${evt.type === "webhook" ? "⇦ " : "⇨ "}${evt.title}</span>
      ${badge}
    </summary>
    ${evt.detail ? `<div class="log-detail">${evt.detail}</div>` : ""}
    ${evt.verifyReason ? `<div class="log-detail">verify: ${evt.verifyReason} · Knot-Signature: <code style="font-family:var(--mono)">${(evt.headers?.["knot-signature"] || "").slice(0, 24)}…</code></div>` : ""}
    ${evt.payload ? `<pre>${JSON.stringify(evt.payload, null, 2)}</pre>` : ""}`;
  log.prepend(entry);

  // advance the step tracker off real events
  if (evt.type === "api" && evt.title.includes("/session/create")) markStep("session", true);
  if (evt.type === "api" && evt.title.includes("/card")) markStep("card", true);
  if (evt.type === "webhook" && evt.payload?.event === "AUTHENTICATED") markStep("authenticated", true);
  if (evt.type === "webhook" && evt.payload?.event === "CARD_UPDATED") {
    markStep("updated", true);
    const mId = evt.payload.merchant?.id;
    if (mId != null) statusByMerchant.set(mId, "updated");
  }
}

function subscribeEvents() {
  const es = new EventSource("/api/events");
  es.onmessage = (msg) => appendLog(JSON.parse(msg.data));
}

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  CONFIG = await (await fetch("/api/config")).json();

  const pill = document.getElementById("mode-pill");
  pill.textContent = CONFIG.mode === "live"
    ? `LIVE · development.knotapi.com`
    : `MOCK MODE · set KNOT_MODE=live to use real keys`;
  pill.classList.add(CONFIG.mode);

  document.getElementById("card-product").textContent = CONFIG.card.productName;
  document.getElementById("card-last4").textContent = CONFIG.card.last4;
  document.getElementById("card-holder").textContent = CONFIG.user.displayName;
  document.getElementById("card-expiry").textContent = CONFIG.card.expiry;
  document.getElementById("card-network").textContent = CONFIG.card.network;
  document.getElementById("webhook-url").textContent = CONFIG.webhookUrl;

  renderMerchants();
  subscribeEvents();
}

boot();
