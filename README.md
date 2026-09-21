# Charlie Federal Credit Union × Knot

A demo card-issuer app that runs the **Knot CardSwitcher** integration end to end — the walkthrough you’d give a bank or fintech evaluating Knot:

1. **Backend creates a session** — `POST /session/create` with Basic auth (`client_id:secret`), per [Knot's API reference](https://docs.knotapi.com/api-reference/sessions/create-session)
2. **Frontend opens the Knot Link SDK** — the `knotapi-js` `open()` surface with `onSuccess` / `onError` / `onEvent` / `onExit`
3. **Webhooks arrive and are verified** — `Knot-Signature` HMAC-SHA256 verification per [Knot's webhook docs](https://docs.knotapi.com/webhooks)
4. **`AUTHENTICATED` → card sent within 15s** — backend responds to the webhook with `POST /card` carrying the cardholder + card payload
5. **`CARD_UPDATED`** — card is live in the merchant wallet; the member UI and the live event console both reflect it

The right-hand **integration console** shows every API call and webhook in real time — raw payloads, signature-verification badges, and a step tracker — so a prospect can see exactly what their engineers would build.

## Run it

```bash
npm install
npm start          # http://localhost:3000
```

No credentials needed — it starts in **mock mode**: an embedded mock of Knot's API (mounted at `/mock-knot`) that mirrors the published request/response shapes and delivers webhooks as *real signed HTTP POSTs* to `/webhooks/knot`, so the same verification and card-switch code paths run as in production.

Click **Update card** on any merchant, sign in with the pre-filled demo credentials, and watch the five steps light up.

## Switch to real keys

One env change — the app code is identical in both modes:

```bash
KNOT_MODE=live
KNOT_CLIENT_ID=...        # from the Knot Customer Dashboard
KNOT_SECRET=...
PUBLIC_URL=https://your-deploy-url   # register ${PUBLIC_URL}/webhooks/knot in the dashboard
```

In live mode the backend hits `https://development.knotapi.com` and the frontend loads the real `knotapi-js@next` bundle from unpkg with the same `open()` call.

## Architecture

```
public/                  the member-facing "bank app" + integration console
  app.js                 session → open SDK → live event stream (SSE)
  mock-sdk.js            drop-in stand-in for knotapi-js (same open() surface)
server/
  index.js               routes: /api/knot/session, /webhooks/knot, /api/events
  knot/client.js         Knot API client — Basic auth, /session/create, /card
  knot/verify.js         Knot-Signature HMAC-SHA256 build/sign/verify
  knot/mock.js           embedded mock of Knot's API (inert when KNOT_MODE=live)
  bank.js                the issuer's "core banking" records (test PAN only)
```

Design choices worth calling out:

- **The webhook handler acks fast** and does the card switch after responding — Knot retries on non-200 or >10s, and the 15-second card window starts at `AUTHENTICATED`.
- **Signature verification uses the raw request bytes**, timing-safe compare, and omits `session_id` from the signature base when absent — matching the documented scheme.
- **The mock is server-side and speaks real HTTP**, so "mock mode" still exercises auth headers, webhook signatures, and the full request lifecycle — not just stubbed function calls.
- No real card data anywhere: the demo card is the standard `4242…` test PAN.

## Deploy

Any Node host works (Render, Railway, Fly). Set `PUBLIC_URL` to the deployed URL so mock webhooks route back to the app over the public internet — same path a real Knot webhook would take.
