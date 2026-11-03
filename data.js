// Sample data for the demo. Every company and person here is fictional
// (the company names are the standard Microsoft placeholder brands).
// Dates are written as "days ago" so the demo always looks current.
// To use the tracker for real, replace this file with your own data or
// add jobs in the app with "+ Add job" (those are saved in your browser).

(function () {
  const D = n => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };

  const jobs = [
    {
      company: "Contoso Fabrication AI",
      title: "Solutions Engineer",
      url: "https://example.com/jobs/contoso-solutions-engineer",
      description: "Machine-learning platform that tunes CNC and injection-molding lines in real time. Post-sales role: integrate with factory data systems and help customers deploy models, using Python, SQL and REST APIs.",
      payMin: 110000, payMax: 150000,
      location: "Remote (US) · 25% travel",
      dateApplied: D(4), status: "Applied", focus: true, priority: "high",
      color: "#1d4ed8", logoText: "CF",
      summary: "Applied through their careers page and got the automatic confirmation. A former classmate works on their customer team, which is the warmest way in.",
      people: [
        { name: "Priya Ramanathan", role: "Customer Engineering Lead", degree: "2nd", contacted: true, note: "Mutual connection through a former classmate. Messaged asking for 15 minutes." },
        { name: "Marcus Hale", role: "Technical Recruiter", degree: "3rd", contacted: false, note: "Posted the role on LinkedIn." },
        { name: "Elena Sorokina", role: "Solutions Engineer", degree: "3rd", contacted: false, note: "Has the same title. Good for an informational call." }
      ],
      convo: [
        { d: D(4), channel: "Email", dir: "auto", text: "Application received." },
        { d: D(3), channel: "LinkedIn", dir: "out", text: "Messaged Priya asking for a short call about the customer team." }
      ],
      nextSteps: [
        "Connect with Marcus Hale and mention the application.",
        "Ask Elena Sorokina what a typical week looks like.",
        "Prepare a 2-minute story about a factory integration you've done."
      ]
    },
    {
      company: "Fabrikam Aerospace",
      title: "Field Applications Engineer",
      url: "https://example.com/jobs/fabrikam-fae",
      description: "Generative-design software for aerospace brackets and heat exchangers. Run customer pilots, build workflows in their Python SDK, and report product gaps back to engineering.",
      payMin: 105000, payMax: 140000,
      location: "Remote (US) · 20–40% travel",
      dateApplied: D(12), status: "Interviewing", focus: true, priority: "high",
      color: "#111827", logoText: "FA",
      summary: "Recruiter screen went well. A technical interview with the hiring manager is next; it will focus on the Python SDK and a past additive-manufacturing project.",
      people: [
        { name: "Jordan Whitfield", role: "Hiring Manager, Field Engineering", degree: "2nd", contacted: true, note: "Interviewing next week." },
        { name: "Aisha Bello", role: "Senior Recruiter", degree: "1st", contacted: true, note: "Ran the screen. Very responsive." }
      ],
      convo: [
        { d: D(12), channel: "Email", dir: "auto", text: "Application received." },
        { d: D(8), channel: "Email", dir: "in", text: "Aisha invited you to a 30-minute recruiter screen." },
        { d: D(6), channel: "Phone", dir: "out", text: "Recruiter screen. Next step: technical interview with Jordan." },
        { d: D(2), channel: "Email", dir: "in", text: "Aisha sent times for the technical interview." }
      ],
      nextSteps: [
        "Reply to Aisha with interview times.",
        "Build a small demo in their public SDK to bring to the interview.",
        "Review the bracket redesign project and its numbers."
      ]
    },
    {
      company: "Northwind Robotics",
      title: "Deployment Engineer",
      url: "https://example.com/jobs/northwind-deployment",
      description: "Autonomous material-handling robots for warehouses. Commission robots at customer sites, train operators, and troubleshoot mechanical and network issues.",
      payMin: 95000, payMax: 125000,
      location: "Remote · 50% travel",
      dateApplied: D(19), status: "Applied", priority: "med",
      color: "#0f766e", logoText: "NR",
      summary: "Applied about three weeks ago. Messaged the recruiter once, with no reply yet.",
      people: [
        { name: "Sam Okafor", role: "Talent Partner", degree: "3rd", contacted: true, note: "Messaged after applying, no reply." },
        { name: "Hannah Lindqvist", role: "Deployment Lead, East", degree: "3rd", contacted: false, note: "Leads the team this role would join." }
      ],
      convo: [
        { d: D(19), channel: "Email", dir: "auto", text: "Application received." },
        { d: D(17), channel: "LinkedIn", dir: "out", text: "Messaged Sam: just applied, happy to share more about field install experience." }
      ],
      nextSteps: [
        "Follow up with Sam; it's been more than two weeks.",
        "Connect with Hannah Lindqvist directly."
      ]
    },
    {
      company: "Litware CAD",
      title: "Technical Pre-Sales Engineer",
      url: "https://example.com/jobs/litware-presales",
      description: "Cloud PDM and BOM management for small hardware teams. Run demos and discovery calls, and build sales content with the product team.",
      payMin: null, payMax: null,
      location: "Remote (North America)",
      dateApplied: D(6), status: "Applied", priority: "med",
      color: "#7c3aed", logoText: "LC",
      summary: "Applied and emailed the VP of Sales directly. He replied asking for a resume in PDF.",
      people: [
        { name: "Tomás Ibarra", role: "VP of Sales", degree: "2nd", contacted: true, note: "Replied quickly. Wants the resume as a PDF." }
      ],
      convo: [
        { d: D(6), channel: "Email", dir: "out", text: "Sent a short note on why the role fits, plus a portfolio link." },
        { d: D(1), channel: "Email", dir: "in", text: "Tomás asked for a PDF resume and availability next week." }
      ],
      nextSteps: [
        "Send Tomás the PDF resume and three time slots.",
        "Sign up for a free trial and build a BOM from one of your own parts before the call."
      ]
    },
    {
      company: "Adventure Works Energy",
      title: "Mechanical Engineer II",
      url: "https://example.com/jobs/adventure-works-me2",
      description: "Small modular reactor developer. Design and analysis of balance-of-plant components; hybrid with some site work.",
      payMin: 100000, payMax: 130000,
      location: "Hybrid · Washington, DC",
      dateApplied: null, status: "Interested", priority: "low",
      color: "#b45309", logoText: "AW",
      summary: "Not applied yet. Strong fit on paper, but it's hybrid; checking how many office days are required.",
      people: [
        { name: "Grace Liu", role: "Engineering Manager", degree: "3rd", contacted: false, note: "Posted about the opening." }
      ],
      convo: [],
      nextSteps: [
        "Find out how many in-office days are required.",
        "Tailor the resume toward pressure-boundary and ASME work, then apply."
      ]
    },
    {
      company: "Proseware",
      title: "Customer Success Engineer",
      url: "https://example.com/jobs/proseware-cse",
      description: "Inspection software that compares scanned parts against CAD. Onboard customers, write integration scripts, and own technical escalations.",
      payMin: 90000, payMax: 115000,
      location: "Remote (US)",
      dateApplied: D(40), status: "Applied", priority: "low",
      color: "#be123c", logoText: "PW",
      summary: "Applied over a month ago with no reply from anyone. The tracker moves it to the no-reply list automatically.",
      people: [],
      convo: [{ d: D(40), channel: "Email", dir: "auto", text: "Application received." }]
    }
  ];

  const rejected = [
    { company: "Wingtip Toys", title: "Product Design Engineer", date: D(9), stage: "2 interviews", note: "Went with an internal candidate.", color: "#0369a1", logoText: "WT", hl: true },
    { company: "Woodgrove Industrial", title: "Applications Engineer", date: D(15), stage: "Phone screen", color: "#4d7c0f", logoText: "WI" },
    { company: "Tailspin Systems", title: "Sales Engineer", date: D(22), stage: "Application", color: "#6b21a8", logoText: "TS" }
  ];

  const closed = [
    { company: "Coho Machining", title: "CNC Programmer", when: "~1 mo" },
    { company: "Lucerne Labs", title: "R&D Engineer", when: "~2 mo" },
    { company: "Margie's Travel Tech", title: "Field Engineer", when: "~2 mo" }
  ];

  window.TRACKER_DATA = { jobs, rejected, closed };
})();
