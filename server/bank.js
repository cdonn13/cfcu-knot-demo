// Charles Federal Credit Union's (fictional) core banking records — the data
// a real issuer would already hold. In live mode this is exactly what you'd
// pass to Knot's /card endpoint after an AUTHENTICATED webhook; the card here
// is a standard test PAN, never a real one.

export const demoUser = {
  externalUserId: "cfcu-user-000451",
  displayName: "Ada Lovelace",
  user: {
    name: { first_name: "Ada", last_name: "Lovelace" },
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
  productName: "CFCU Platinum Rewards",
  card: {
    number: "4242424242424242",
    expiration: "08/2030",
    cvv: "012",
  },
};

// Merchants shown in the demo. IDs follow Knot's numeric merchant-id format
// (Uber is 11 in the docs' webhook example); in live mode the SDK renders
// Knot's own merchant catalog and these are only used for the dashboard rows.
export const merchants = [
  { id: 11, name: "Uber", icon: "🚗" },
  { id: 13, name: "Netflix", icon: "🎬" },
  { id: 16, name: "Spotify", icon: "🎧" },
  { id: 19, name: "DoorDash", icon: "🥡" },
  { id: 44, name: "Amazon", icon: "📦" },
];
