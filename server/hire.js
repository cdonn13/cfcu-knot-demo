// GET /hire — proper HTTP semantics for the only endpoint that matters.
export const hire = {
  status: "200 OK",
  available: true,
  candidate: {
    name: "Charles Donnelly",
    goes_by: "Charlie",
    role_applied: "Solutions Engineer",
    location: "Chicago, IL",
    email: "cedonnelly13@gmail.com",
    phone: "(513) 446-6454",
    linkedin: "https://linkedin.com/in/charlesdonnelly",
    resume_pdf: "https://cfcu-knot-demo.onrender.com/resume.pdf",
  },
  summary:
    "Product lead and client manager with a technical background spanning software development, design, and product management. Equally comfortable in the code, in the design, and in front of the customer — which is roughly the job description of a Solutions Engineer.",
  proof_of_work: {
    live_demo: "https://cfcu-knot-demo.onrender.com",
    repo: "https://github.com/cdonn13/cfcu-knot-demo",
    what_it_is:
      "A working Knot CardSwitcher integration: /session/create with Basic auth, the knotapi-js Link SDK, Knot-Signature HMAC verification, and the AUTHENTICATED -> POST /card (15s) -> CARD_UPDATED loop. Built against Knot's published docs; KNOT_MODE=live away from development.knotapi.com.",
  },
  experience: [
    {
      company: "Runwayz",
      title: "Head of Product",
      dates: "Jun 2025 – present",
      highlights: [
        "Owned product strategy and roadmap; journey maps positioned the product for a projected 40% increase in inbound customers",
        "Established a design partner program — integrated the product directly with customers as their primary point of contact",
        "Built and delivered tailored product demos for stakeholders and design partners",
        "Constructed a ground-up design system and an automated Figma-to-GitHub pipeline with AI-driven workflows (Claude, MCPs), accelerating handoff 3x",
      ],
    },
    {
      company: "Donnelly Design",
      title: "Product Lead & Client Manager",
      dates: "Mar 2024 – present",
      highlights: [
        "Designed and developed custom solutions and integrations (APIs, HubSpot, Stripe, AWS, Google Analytics, Notion, Figma) for a portfolio of clients",
        "Cut product time-to-market 30% by turning discovery and research into shipped solutions with dev teams",
        "100% retention on high-churn-risk clients; converted at-risk relationships into upsells",
      ],
    },
    {
      company: "Platform Venture Studio",
      title: "Product Development Lead",
      dates: "Jan 2022 – Mar 2024",
      highlights: [
        "Built and designed MVPs hands-on for high-growth startups on 8-week timelines, contributing to a collective $5M ARR",
        "Implemented custom integrations (Stripe, Google Analytics, HotJar, HubSpot, AWS) in regulated spaces (HIPAA, legal compliance)",
      ],
    },
  ],
  education: [
    { school: "Johns Hopkins Carey Business School", degree: "MBA", expected: "May 2027" },
    { school: "Maryland Institute College of Art (MICA)", degree: "Master of Design Leadership", expected: "May 2027" },
    { school: "University of Notre Dame", degree: "BA, Industrial & Product Design", completed: "May 2021" },
  ],
  skills: {
    product: ["Solutions Consulting", "Implementation & Onboarding", "Custom Integrations & APIs", "Stakeholder & Partner Management", "AI Workflows (Claude & MCPs)"],
    design: ["Design Systems", "UI/UX", "Prototyping", "Journey Mapping", "WCAG Accessibility"],
    tools: ["Figma", "Claude", "Cursor", "GitHub", "Stripe", "AWS", "HubSpot", "Segment", "Notion", "Jira"],
  },
  next_step: "POST /interview — I'll bring the demo.",
};
