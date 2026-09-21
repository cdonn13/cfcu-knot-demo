// Central config. The entire mock ↔ live switch lives here: set KNOT_MODE=live
// (plus your real client_id/secret from the Knot Customer Dashboard) and every
// request goes to Knot's development environment instead of the embedded mock.
const PORT = Number(process.env.PORT || 3000);

export const config = {
  port: PORT,

  // "mock" (default) → embedded mock of Knot's API, no credentials needed.
  // "live"           → https://development.knotapi.com with real credentials.
  mode: process.env.KNOT_MODE === "live" ? "live" : "mock",

  clientId: process.env.KNOT_CLIENT_ID || "mock-client-id",
  secret: process.env.KNOT_SECRET || "mock-secret",

  // SDK environment passed to knotapi-js in live mode.
  knotEnvironment: process.env.KNOT_ENVIRONMENT || "development",

  // Where this app is reachable from the outside. The mock Knot server posts
  // webhooks here over real HTTP; in live mode you register
  // `${publicUrl}/webhooks/knot` in the Knot Customer Dashboard.
  publicUrl:
    process.env.PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL || // set automatically by Render
    `http://localhost:${PORT}`,

  get knotApiBase() {
    return this.mode === "live"
      ? process.env.KNOT_API_BASE || "https://development.knotapi.com"
      : `http://localhost:${PORT}/mock-knot`;
  },

  get webhookUrl() {
    return `${this.publicUrl}/webhooks/knot`;
  },
};
