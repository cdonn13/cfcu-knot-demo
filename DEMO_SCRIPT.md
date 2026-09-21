# 3-Minute Loom Script — "Knot in your app"

Frame: you're the Solutions Engineer, the viewer is a prospect (issuer/fintech PM or eng lead). Screen: the deployed app, both panels visible.

**0:00 – 0:20 — Set the scene.**
"This is Charlie Federal Credit Union — a stand-in for your app. Your member's card is saved at Uber, Netflix, Amazon… and when that card is reissued or you want top-of-wallet, this is what Knot looks like embedded in your product. Left side is what your member sees; right side is what your engineers see."

**0:20 – 1:00 — Run the flow.**
Click **Update card** on Uber. As Link opens: "One tap. Behind the scenes my backend just called Knot's `/session/create` — you can see it land in the console with the session ID." Sign in with the demo credentials. "The member signs in to the merchant *inside* Knot's Link UI — their credentials never touch my servers."

**1:00 – 1:50 — The engineering story (console).**
Point at the events as they arrive: "Knot fires an `AUTHENTICATED` webhook — notice the signature-verified badge; that's HMAC-SHA256 over the raw payload, per your docs. My backend has 15 seconds to respond with the card details via `POST /card` — there it goes. And then `CARD_UPDATED` confirms the card is live in the merchant wallet. Five steps, all lit."

**1:50 – 2:30 — The integration cost.**
"Everything you just saw is ~300 lines: one endpoint to create sessions, one webhook handler, one SDK call. This demo runs against a mock that mirrors Knot's published API shapes — switching it to live keys is literally one environment variable, which is exactly what I'd do first on a customer call."

**2:30 – 3:00 — Close.**
"Repo's linked below — README covers the architecture and the mock-to-live switch. I built this against the public docs; with sandbox credentials I'd love to flip `KNOT_MODE=live` and record the same demo against the real development environment. That's the ask."

---

## Follow-up email sketch (send with the Loom + repo link)

Subject: **Built the CardSwitcher demo I'd give your prospects**

> Hi Knot team — after applying for the Solutions Engineer role, I built the integration I imagine an SE demos most: a fake card issuer running CardSwitcher end to end (session create → Link SDK → signed webhooks → `/card` within the 15s window), with a live console showing prospects exactly what their engineers would build.
>
> 3-min walkthrough: [Loom link] · Repo: [GitHub link] · Live: [deploy link]
>
> It currently runs against a mock that mirrors your published API shapes — one env var switches it to development.knotapi.com. If someone's willing to issue sandbox credentials, I'll re-record the demo against the real environment.
>
> — Charles
