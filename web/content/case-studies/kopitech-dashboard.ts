// Source: FRI-003_Laporan Tugas Besar APSI.pdf, May 2025.
// The report proves the analysis, the requirements and the dashboard build.
// It carries no live factory performance data, so this page makes no
// operational-improvement claim.
import type { CaseStudy } from '@/lib/types'

export const kopitechDashboard: CaseStudy = {
  slug: "kopitech-dashboard",
  presentationType: "case-study",
  eyebrow: "Information system analysis and design",
  title: "Kopitech Corp Integrated Dashboard",
  client: "Kopitech Corp, espresso machine manufacturer",
  subtitle:
    "Workers recorded each handover across seven stations on paper. I mapped the flow, wrote the requirements, and built the dashboard that replaced manual counting.",
  overview: {
    summary:
      "I translated paper handovers across seven production stations into one role-based dashboard. The final build connected process maps, requirements, data structure and 28 acceptance-ready features for three access roles.",
    role:
      "In a three-person team, I focused on requirements analysis and dashboard development, from the as-is process through acceptance-ready screens.",
    objectives: [
      "Make work in progress visible as production moves",
      "Connect seven station handovers in one system",
      "Give each role the information and actions it needs",
      "Define every feature with testable acceptance criteria",
    ],
  },
  snapshot: {
    challenge:
      "Handovers were recorded manually and WIP was tallied near the end of the day, leaving planning without a live view of production.",
    delivered:
      "Nine mapped roles, a proposed process built on barcode handovers, 28 features with acceptance criteria, and the working dashboard.",
    outcome:
      "The build covers 28 features, 27 acceptance criteria and three access roles. No factory adoption data exists.",
  },
  engineeringLens: {
    system:
      "Kopitech's planning-to-finished-warehouse information flow across nine production roles.",
    objective:
      "Make stock, work in progress and inspection results readable from one role-based system, as the work happens.",
    stakeholders:
      "Production Planning, warehouse staff, seven station operators, inspection, and the three-person course team.",
    constraints: [
      "Paper handovers between every station",
      "Role-specific access rules",
      "No live factory integration available",
      "Academic timeline ending May 2025",
    ],
    methods: [
      "BPMN",
      "Role mapping",
      "Requirements analysis",
      "ERD and use-case modelling",
      "Acceptance criteria",
    ],
  },
  evidence: {
    level: "E1",
    name: "Delivered output",
    summary:
      "The build covers 28 features, 27 acceptance criteria and three access roles.",
    sourceNote: "FRI-003 Laporan Tugas Besar APSI, May 2025.",
    limit:
      "The report documents feature coverage and design, not factory adoption or measured operational change.",
  },
  hero: {
    src: "/img/case-studies/kopitech-dashboard/ui-dashboard.png",
    alt: "Kopitech dashboard with production, warehouse, and work-in-progress information",
    caption: "The delivered dashboard: production, warehouse and report data in one view.",
  },
  meta: [
    {
      label: "Role",
      value: "Requirements analysis and dashboard development",
    },
    {
      label: "Team",
      value: "Three-person course team",
    },
    {
      label: "Timeline",
      value: "Reported May 2025",
    },
    {
      label: "Project type",
      value: "Academic information-system project",
    },
  ],
  stack: [
    "System Analysis",
    "BPMN",
    "Requirements",
    "Role-Based Access",
    "Acceptance Criteria",
    "Node.js",
  ],
  sections: [
    {
      id: "problem",
      label: "problem",
      lead: "Workers logged the seven station handovers by hand, leaving planning without a live view of the floor.",
      blocks: [
        {
          type: "lead",
          html:
            "Kopitech assembles espresso machines across seven stations. Production and inspection results were recorded manually. Accounting required an end-of-day WIP report, with counting taking place 30 minutes before operations closed. Planning could not see production obstacles as they happened.",
        },
        {
          type: "stats",
          entries: [
            {
              value: "30 min",
              label: "Before closing",
              note: "When daily manual WIP counting took place; not a measured task duration",
              tone: "bad",
            },
            {
              value: "2",
              label: "Stations that stall first",
              note: "Installation and Assembly wait on the most parts",
              tone: "bad",
            },
            {
              value: "0",
              label: "Live views of the floor",
              note: "Production obstacles were not visible as they happened",
              tone: "bad",
            },
          ],
        },
        {
          type: "figure",
          src: "/img/case-studies/kopitech-dashboard/bpmn-as-is.png",
          alt: "Existing Kopitech process with separate paper records across production roles",
          caption:
            "Every role keeps its own record, and no role can read anyone else's.",
          plate: true,
          wide: true,
        },
      ],
    },
    {
      id: "method",
      label: "method",
      lead: "I modelled the process, wrote requirements by role, and gave each feature an acceptance test.",
      blocks: [
        {
          type: "list",
          variant: "numbered",
          entries: [
            {
              title: "Model the process in BPMN, as-is and to-be",
              body: "So the change is visible as a change, not as a list of features.",
            },
            {
              title: "Map every role that touches it",
              body: "Task, data used, and what the system would have to alter for them.",
            },
            {
              title: "Write one requirement statement per role",
              body: "Stated as what the system must let that role do, not as a screen.",
            },
            {
              title: "Model the data and the interactions",
              body: "An entity diagram for the schema, use-case and activity diagrams per role.",
            },
            {
              title: "Attach an acceptance criterion to every feature",
              body: "One condition that decides whether the feature is finished.",
            },
          ],
        },
        {
          type: "cards",
          cols: 3,
          entries: [
            {
              num: "01",
              title: "Problem owner",
              body: "The company's leadership, who could authorise the change.",
            },
            {
              num: "02",
              title: "Problem users",
              body: "Production staff, warehouse, and production planning, who would live with it.",
            },
            {
              num: "03",
              title: "Designer, analyst, builder",
              body: "Our three-person team held all three of those roles ourselves.",
            },
          ],
        },
      ],
    },
    {
      id: "explore",
      label: "explore",
      lead: "I followed the flow from production planning to the finished warehouse and recorded what each of the nine roles did, touched, and needed.",
      blocks: [
        {
          type: "text",
          html:
            "Seven of the nine roles are station operators. Reading them in order shows the machine taking shape, and shows where a paper handover sits between every pair of them.",
        },
        {
          type: "tags",
          entries: [
            "Separator",
            "Queue Station",
            "Installation",
            "Assembly",
            "Painting",
            "Inspection Area",
            "Finished Warehouse",
          ],
        },
        {
          type: "cards",
          cols: 3,
          entries: [
            {
              num: "01",
              title: "Operator",
              body: "Reads the schedule and posts output. Can see stock, cannot change it.",
            },
            {
              num: "02",
              title: "Warehouse",
              body: "Owns component and finished-product stock, and reads the schedule.",
            },
            {
              num: "03",
              title: "Production Planning",
              body: "Owns the schedule, the daily targets and the reports.",
            },
          ],
        },
      ],
    },
    {
      id: "analyze",
      label: "analyze",
      lead: "Four operating problems shared one cause: the floor had no live handover record.",
      blocks: [
        {
          type: "cards",
          cols: 2,
          entries: [
            {
              num: "01",
              title: "Assembly stalls on late parts",
              body: "Planning learns about the shortage after the station has already gone idle.",
            },
            {
              num: "02",
              title: "Orders ship late",
              body: "Nothing reports a slipping target while there is still time to act on it.",
            },
            {
              num: "03",
              title: "Work in progress is counted by hand",
              body: "Accounting requires an end-of-day figure. Manual counting takes place 30 minutes before closing; the report does not measure how long it takes.",
            },
            {
              num: "04",
              title: "Finished units are tallied manually",
              body: "Output and inspection results get written up by the operators who should be assembling.",
            },
          ],
        },
        {
          type: "text",
          html:
            "One live handover record addresses all four problems and makes record-keeping part of the work.",
        },
      ],
    },
    {
      id: "design",
      label: "design",
      lead: "The proposed process adds a barcode scan to each handover, so operators create the record as they move the work.",
      blocks: [
        {
          type: "text",
          html:
            "A component carries a barcode from the warehouse, through each station, to the finished machine. An operator scans it as the work passes on. That one action posts production, updates work in progress, and moves stock.",
        },
        {
          type: "compare",
          entries: [
            ["Count work in progress before close", "It totals itself as operators scan"],
            ["Order parts from an estimate", "Order against the schedule and current stock"],
            ["Find delays in tomorrow's report", "See the queue while the work is still running"],
            ["Write inspection results on paper", "Pass and defect counts land in one report"],
          ],
        },
        {
          type: "figure",
          src: "/img/case-studies/kopitech-dashboard/bpmn-to-be.png",
          alt: "Proposed Kopitech process with dashboard-recorded handovers across warehouse and production",
          caption:
            "Each scan writes the handover to the dashboard for the next role.",
          plate: true,
          wide: true,
        },
        {
          type: "metrics",
          entries: [
            { count: 28, label: "System features", sub: "Login through to WIP reporting" },
            { count: 27, label: "Acceptance criteria", sub: "One testable condition each" },
            { count: 3, label: "Access roles", sub: "Operator, Warehouse, Planning" },
          ],
        },
        {
          type: "text",
          html:
            "Behind the screens sits an entity model linking the master schedule to its time slots, component requirements, daily targets and finished assemblies, so a plan and its execution stay attached to each other.",
        },
        {
          type: "figure",
          src: "/img/case-studies/kopitech-dashboard/low-fidelity.png",
          alt: "Low-fidelity wireframes for the Kopitech dashboard screens",
          caption: "Wireframes first, to test screen coverage against the feature list before any code.",
          plate: true,
          wide: true,
        },
        {
          type: "gallery",
          entries: [
            {
              src: "/img/case-studies/kopitech-dashboard/home.png",
              label: "Overview: production and warehouse totals",
              alt: "Kopitech dashboard overview with production and warehouse totals",
            },
            {
              src: "/img/case-studies/kopitech-dashboard/mps.png",
              label: "Schedule: the master production plan",
              alt: "Kopitech Master Production Schedule list",
            },
            {
              src: "/img/case-studies/kopitech-dashboard/production-target.png",
              label: "Target: today's goal against progress",
              alt: "Kopitech production target and progress screen",
            },
            {
              src: "/img/case-studies/kopitech-dashboard/warehouse-component.png",
              label: "Stock: components, as they move",
              alt: "Kopitech warehouse component stock screen",
            },
            {
              src: "/img/case-studies/kopitech-dashboard/finished-assembly.png",
              label: "Output: finished assemblies posted",
              alt: "Kopitech finished assembly input screen",
            },
          ],
        },
      ],
    },
    {
      id: "outcome",
      label: "outcome",
      lead: "The design makes each handover visible from one scan; the project did not test it in a live shift.",
      blocks: [
        {
          type: "callout",
          title: "What this project shows",
          body:
            "A traceable design: nine roles mapped, a proposed process, <strong>28 features</strong>, <strong>27 acceptance criteria</strong> and three access levels. Any future team can follow each screen back to the role and the rule that produced it.",
        },
        {
          type: "callout",
          title: "What it does not show",
          body:
            "The report contains no live factory use or performance data. This case study makes no claim about downtime, production speed, or cost savings.",
        },
        {
          type: "list",
          variant: "plain",
          entries: [
            {
              title: "The scan needs its failure cases",
              body: "A second version has to define what happens on a failed scan, and on a package that arrives at the wrong station.",
            },
            {
              title: "The barcode assumes discipline it cannot enforce",
              body: "If an operator batches ten scans at the end of a shift, the live view is a shift old again.",
            },
          ],
        },
        {
          type: "callout",
          title: "Project credits",
          body:
            "Team FRI-003: Juan Valentino Wehantouw, Muhammad Rafi Zain and David Rizky Wijaya.",
        },
      ],
    },
  ],
}
