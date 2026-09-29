// Source: the Juragan Cipung capstone report and project evidence.
//
// Client-sensitive material is deliberately excluded. The report contains
// defect rates, cost-of-poor-quality figures and a feasibility calculation
// for Greens Production; none of it appears here. This page documents the
// method and the delivered system, not the client's performance.
//
// No individual outside the capstone team is named or quoted.
import type { CaseStudy } from '@/lib/types'

export const juraganCipung: CaseStudy = {
  slug: "juragan-cipung",
  presentationType: "case-study",
  eyebrow: "Capstone design project",
  title: "Quality Control SOP & Dashboard",
  client: "Greens Production Konveksi, Bandung",
  subtitle:
    "Six stages made the garment. One stage checked it. I moved the check into all six and built the system that records them.",
  overview: {
    summary:
      "I redesigned garment quality control from one late inspection into six stage-level checks, then connected the SOP and seven control forms to a working dashboard. The system passed 184 UAT cases and received client approval.",
    role:
      "In a three-person capstone team, I worked across process analysis, SOP design, dashboard development and user acceptance testing.",
    objectives: [
      "Catch quality issues at the stage that creates them",
      "Standardize six inspection gates in one SOP",
      "Connect production and quality records in one dashboard",
      "Validate the complete workflow with its intended users",
    ],
  },
  snapshot: {
    challenge:
      "A single inspection near packing had to catch mistakes made five stages earlier.",
    delivered:
      "A six-gate quality process, one SOP with seven control forms, and a Flask dashboard on PostgreSQL.",
    outcome:
      "184 User Acceptance Testing cases ran with no rejections. The company approved the system in January 2026.",
  },
  engineeringLens: {
    system:
      "The order-to-packing garment workflow and the quality records that run alongside it.",
    objective:
      "Catch a specification error at the stage that creates it, not at the stage that ships it.",
    stakeholders:
      "Workshop management, admin staff, production operators, QC staff, and the three-person capstone team.",
    constraints: [
      "A workshop of 30 to 35 people",
      "Paper and chat-based records",
      "ISO 9001:2015 Clause 8.5.1",
      "Five-week observation window",
      "Existing office computers only",
    ],
    methods: [
      "Direct observation",
      "Stakeholder interviews",
      "BPMN",
      "Fishbone analysis",
      "User Acceptance Testing",
    ],
  },
  evidence: {
    level: "E2",
    name: "Validated outcome",
    summary:
      "184 UAT cases ran with no rejections, followed by client approval in January 2026.",
    sourceNote: "Capstone UAT log and client approval, January 2026.",
    limit:
      "The testing proves the system behaves as specified. No post-adoption operating data was collected, so this page claims delivery, not improvement.",
  },
  hero: {
    src: "/img/case-studies/juragan-cipung/dash-overview.png",
    alt: "Quality dashboard showing orders, production progress, and quality records in one view",
    caption: "The delivered dashboard: orders, production progress and quality records in one place.",
  },
  meta: [
    {
      label: "Role",
      value: "Process analysis, SOP design and dashboard development",
    },
    {
      label: "Team",
      value: "Three-person capstone team",
    },
    {
      label: "Timeline",
      value: "Sep 2025 to Jan 2026",
    },
    {
      label: "Project type",
      value: "Industrial Engineering capstone",
    },
  ],
  stack: [
    "Business Process Improvement",
    "Design Thinking",
    "ISO 9001:2015",
    "BPMN",
    "Flask",
    "PostgreSQL",
    "User Acceptance Testing",
  ],
  sections: [
    {
      id: "problem",
      label: "problem",
      lead: "Six stages built each garment, and only the last one checked it.",
      blocks: [
        {
          type: "lead",
          html:
            "Greens Production is a garment workshop in Bandung with 30 to 35 workers. An order passes through material intake, cutting, sewing, printing, finishing and packing. Only the last of those had a quality check.",
        },
        {
          type: "figure",
          src: "/img/case-studies/juragan-cipung/bpmn-as-is.jpg",
          alt: "Existing workshop process with a single quality check placed near packing",
          caption:
            "Everything downstream of a mistake has already been made by the time anyone looks at it.",
          plate: true,
          wide: true,
        },
      ],
    },
    {
      id: "method",
      label: "method",
      lead: "To ground the redesign in how the workshop actually runs, I paired Business Process Improvement with Design Thinking across four phases.",
      blocks: [
        {
          type: "cards",
          cols: 2,
          entries: [
            {
              num: "01",
              title: "Understand · Empathize",
              body: "Document the running process, identify who it touches, and learn what they need from it. Output: the as-is process map, two user personas, a pain-point analysis.",
            },
            {
              num: "02",
              title: "Organize · Define",
              body: "Set the objective and the indicators, then measure the current process against the standard. Output: objectives, KPIs, a clause-by-clause gap analysis.",
            },
            {
              num: "03",
              title: "Streamline · Ideate",
              body: "Score each activity for the value it adds, then attack the ones that add none. This is what turned four gaps into six gates rather than six more forms.",
            },
            {
              num: "04",
              title: "Prototype",
              body: "Build the proposal so people can react to something real. Output: the to-be process map, the SOP with its forms, and the dashboard.",
            },
          ],
        },
        {
          type: "callout",
          title: "Why two methods",
          body:
            "Business Process Improvement decides <strong>what the process should be</strong>. Design Thinking decides <strong>what the operators will actually use</strong>. A workshop this size will quietly abandon a procedure that fails the second test, however correct it is on paper.",
        },
      ],
    },
    {
      id: "explore",
      label: "explore",
      lead: "Five weeks on site, from 9 October to 15 November 2025, following orders and reading the records people already kept.",
      blocks: [
        {
          type: "text",
          html:
            "The records mattered more than the interviews. People described one process and the paperwork showed another, and the gap between the two is where the design had to go.",
        },
        {
          type: "personas",
          entries: [
            {
              name: "Production Planning",
              age: "32",
              role: "Sets the schedule and assigns the work",
              exp: "Eight years in garment production planning",
              summary:
                "Takes the order specification, splits it across operators, keeps material available, and watches for anything slipping.",
              goals: [
                "Every order made to the specification it was sold on",
                "Errors caught at the stage that made them",
                "No rework arriving in the last week of a deadline",
              ],
              pains: [
                "Specifications arrive incomplete, so operators interpret them",
                "Nothing checks the work until final inspection",
                "Material gets picked from the wrong roll",
                "Changes are spoken, so they reach some stations and not others",
              ],
              hmw: "How might we make the specification complete and unmistakable at every station?",
            },
            {
              name: "Production Admin",
              age: "24",
              role: "Writes the specifications and records what happens",
              exp: "Two years in production administration",
              summary:
                "Writes the order specification, distributes it, coordinates between the office and the floor, and logs anything that goes wrong.",
              goals: [
                "One specification everyone works from",
                "Every revision recorded and distributed",
                "Inspection evidence that can be found again later",
              ],
              pains: [
                "Specifications get written fast and lose their technical detail",
                "Customer revisions are not always captured",
                "No inspection checklist, so results are not documented",
                "Defect notes live in chat and on loose paper",
              ],
              hmw: "How might we make recording an inspection faster than not recording it?",
            },
          ],
        },
      ],
    },
    {
      id: "analyze",
      label: "analyze",
      lead: "The pain points sorted into four gaps, and every one of them was something nobody wrote down.",
      blocks: [
        {
          type: "figure",
          src: "/img/case-studies/juragan-cipung/fishbone.png",
          alt: "Fishbone analysis grouping causes under people, information, material, and method",
          caption:
            "Sorted under people, information, material and method. No single bone carries the problem alone.",
          plate: true,
          wide: true,
        },
        {
          type: "cards",
          cols: 2,
          entries: [
            {
              num: "01",
              title: "Information gap",
              body: "The order specification is incomplete, and it does not reach every station that needs it.",
            },
            {
              num: "02",
              title: "Process gap",
              body: "No gate between stages, and changes to a running order travel by speech.",
            },
            {
              num: "03",
              title: "Material gap",
              body: "No standard labelling, so stored fabric is not tied to an order or a stage.",
            },
            {
              num: "04",
              title: "Documentation gap",
              body: "Results are unstructured, so nothing can be traced back or reviewed together.",
            },
          ],
        },
        {
          type: "text",
          html:
            "Fixing any one of them alone leaves the other three producing the same result. That is what pushed the design towards a system rather than a procedure.",
        },
      ],
    },
    {
      id: "standard",
      label: "standard",
      lead: "To test the design against a real specification rather than my own judgement, I worked through ISO 9001:2015 Clause 8.5.1 requirement by requirement.",
      blocks: [
        {
          type: "table",
          compact: true,
          head: ["Clause 8.5.1 requires", "What I designed for it"],
          rows: [
            [
              "<strong>a.</strong> Documented information defining the product",
              "A 15-field order specification, identical at every workstation, with its revisions tracked",
            ],
            [
              "<strong>b.</strong> Suitable monitoring and measuring resources",
              "A named measuring tool per stage and a written ±0.5 cm tolerance, so a check is a measurement",
            ],
            [
              "<strong>c.</strong> Monitoring at the appropriate stage",
              "Six quality gates, one per production stage, each with its own checklist",
            ],
            [
              "<strong>d.</strong> Suitable infrastructure and environment",
              "A labelling scheme tying stored material to an order and a stage before it is picked",
            ],
            [
              "<strong>e.</strong> Competent people",
              "A staged training programme run per department, with scheduled refreshers",
            ],
            [
              "<strong>f.</strong> Validation where output is verified only later",
              "A first-article approval on printing, signed off before the run starts",
            ],
            [
              "<strong>g.</strong> Actions preventing human error",
              "Specification changes move through a recorded approval that reaches every station",
            ],
            [
              "<strong>h.</strong> Release and post-delivery activities",
              "A final check with sign-off, and the inspection record stored against the order",
            ],
          ],
          note: "Eight requirements, eight answers an operator can physically carry out. Operator feedback shaped the forms before they were finalised.",
        },
      ],
    },
    {
      id: "design",
      label: "design",
      lead: "The design puts a gate in every stage, gives each gate one form, and puts every form in one place.",
      blocks: [
        {
          type: "pipeline",
          entries: [
            { n: "01", label: "Material", sub: "Check and label" },
            { n: "02", label: "Cutting", sub: "Check size and count" },
            { n: "03", label: "Sewing", sub: "Check build quality" },
            { n: "04", label: "Printing", sub: "Check artwork and position" },
            { n: "05", label: "Finishing", sub: "Check final work" },
            { n: "06", label: "Packing", sub: "Release the order", final: true },
          ],
        },
        {
          type: "figure",
          src: "/img/case-studies/juragan-cipung/bpmn-to-be.jpg",
          alt: "Proposed workshop process with a quality gate at each of six stages",
          caption:
            "The same line, redrawn. A batch clears its own stage before anyone can hand it forward.",
          plate: true,
          wide: true,
        },
        {
          type: "cards",
          cols: 2,
          entries: [
            {
              num: "01",
              title: "Six stage checklists",
              body: "Same fields and same sign-off rule at every gate, so an operator learns the form once.",
            },
            {
              num: "02",
              title: "One non-conformance form",
              body: "Follows a failed item through fault, action, owner, due date and re-inspection.",
            },
            {
              num: "03",
              title: "A 15-field specification",
              body: "Puts size, material, colour and design detail at the station that needs them.",
            },
            {
              num: "04",
              title: "Material labels",
              body: "Tie stored fabric to an order and a stage before anyone picks it.",
            },
          ],
        },
        {
          type: "text",
          html:
            "To keep the forms and their records in one place, I built the dashboard on Flask and PostgreSQL. It runs in a browser on the computers the workshop already owned, which mattered more than any feature on the list.",
        },
        {
          type: "list",
          variant: "plain",
          entries: [
            {
              title: "Order and specification",
              body: "Holds the order and its 15 fields as one record, with revisions tracked.",
            },
            {
              title: "Invoice scanner",
              body: "Finds an order from its barcode with the device camera, then opens that order's specification and checks.",
            },
            {
              title: "Production monitoring",
              body: "Shows where each order sits and which stage is holding it.",
            },
            {
              title: "Quality control",
              body: "Runs the stage checklists and files failures on the non-conformance form.",
            },
            {
              title: "SOP library",
              body: "Serves the current procedure with its version history and prevents operators from using an old printout.",
            },
          ],
        },
        {
          type: "gallery",
          entries: [
            {
              src: "/img/case-studies/juragan-cipung/dash-overview.png",
              label: "Overview: orders and quality in one view",
              alt: "Dashboard overview with order and quality summary",
            },
            {
              src: "/img/case-studies/juragan-cipung/dash-dso.png",
              label: "Specification: the 15 fields, one record",
              alt: "Digital design specification order screen",
            },
            {
              src: "/img/case-studies/juragan-cipung/dash-production.png",
              label: "Production: where each order is held",
              alt: "Production order monitoring screen",
            },
            {
              src: "/img/case-studies/juragan-cipung/dash-qc-checklist.png",
              label: "Gate: the checklist an operator fills",
              alt: "Digital quality control checklist for one production stage",
            },
            {
              src: "/img/case-studies/juragan-cipung/dash-defect-form.png",
              label: "Failure: the form that follows it",
              alt: "Digital non-conformance form for a failed quality check",
            },
            {
              src: "/img/case-studies/juragan-cipung/dash-sop.png",
              label: "Library: the current version, always",
              alt: "SOP library screen with document version history",
            },
          ],
        },
      ],
    },
    {
      id: "outcome",
      label: "outcome",
      lead: "Six gates, 184 test cases run with the people who would work them, and no rejections.",
      blocks: [
        {
          type: "text",
          html:
            "We presented the process, SOP, forms and dashboard on 2 January 2026. On 12 January we returned for implementation, staff training and User Acceptance Testing.",
        },
        {
          type: "metrics",
          entries: [
            { count: 6, label: "Quality gates", sub: "One at each production stage, from one", tone: "good" },
            { count: 184, label: "UAT cases", sub: "Run with the people who use the system" },
            { count: 0, label: "Rejected", sub: "No failed acceptance result", tone: "good" },
            { count: 3, label: "Accepted with notes", sub: "Small changes recorded" },
          ],
        },
        {
          type: "callout",
          title: "What the testing does not show",
          body:
            "UAT shows the system behaves as specified. It does not measure what happens after adoption, and I collected no operating data afterwards. This page claims delivery, not improvement.",
        },
        {
          type: "list",
          variant: "plain",
          entries: [
            {
              title: "It needs a connection",
              body: "The dashboard is online. A later version should hold a form offline and send it once the connection returns.",
            },
            {
              title: "It needs managers to use it",
              body: "A gate only works if a failing batch actually stops. That depends on review habits and refresher training, not on software.",
            },
          ],
        },
        {
          type: "callout",
          title: "Project credits",
          body:
            "Tim Juragan Cipung: Rizaldy Widi Ridwan, David Rizky Wijaya and Muhammad Rafi Mahardika. I worked across the process analysis, the SOP and form design, and the dashboard build.",
        },
      ],
    },
  ],
}
