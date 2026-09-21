// Charles Federal Credit Union's (fictional) core banking records — the data
// a real issuer would already hold. In live mode this is exactly what you'd
// pass to Knot's /card endpoint after an AUTHENTICATED webhook; the card here
// is a standard test PAN, never a real one.

export const demoUser = {
  externalUserId: "cfcu-user-000451",
  displayName: "Charles Donnelly",
  user: {
    name: { first_name: "Charles", last_name: "Donnelly" },
    address: {
      street: "100 Main Street",
      street2: "#100",
      city: "NEW YORK",
      region: "NY",
      postal_code: "10001",
      country: "US",
    },
    phone_number: "+11234567890",
  },
};

export const demoCard = {
  cardId: "cfcu-card-4821",
  displayLast4: "4242",
  displayExpiry: "08/30",
  network: "Visa",
  productName: "CFCU - Your Next Hire",
  card: {
    number: "4242424242424242",
    expiration: "08/2030",
    cvv: "012",
  },
};

// Merchants shown in the demo. IDs follow Knot's numeric merchant-id format
// (Uber is 11 in the docs' webhook example); in live mode the SDK renders
// Knot's own merchant catalog and these are only used for the dashboard rows.
// `icon` names an SVG symbol in public/index.html; `oldLast4` is the stale
// card each merchant has on file before the switch.
export const merchants = [
  { id: 11, name: "Uber", icon: "car", oldLast4: "8104" },
  { id: 13, name: "Netflix", icon: "film", oldLast4: "8104" },
  { id: 16, name: "Spotify", icon: "headphones", oldLast4: "8104" },
  { id: 19, name: "DoorDash", icon: "bag", oldLast4: "8104" },
  { id: 44, name: "Amazon", icon: "box", oldLast4: "8104" },
  // The easter egg: Knot accepts new hires, not new cards.
  { id: "knot", name: "Knot", icon: "knot", easterEgg: true },
];
