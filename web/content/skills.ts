// ─────────────────────────────────────────────────────────────────────────
// Source of truth for the /about skills chapter.
//
// Tool names use the vendor's own spelling, because this is a page about
// professional tooling and the spelling is doing real work.
//
// A mark is either `icon`, a key into components/icons/tools.tsx, or `logo`,
// a supplied file under /public for the tools no open icon set carries.
// Both render the same way: a 12px silhouette in currentColor.
//
// Leaving both off is a normal state, not a gap to fill with something
// approximate. The chip renders as the page's ordinary tag.
// ─────────────────────────────────────────────────────────────────────────
import type { ToolGroup } from '@/lib/types'

export const skills: string[] = [
  "Process Improvement",
  "Quality Management",
  "Business Process Modelling",
  "Root-Cause Analysis",
  "Requirements Analysis",
  "Data Analysis",
  "Data Visualization",
  "Procurement & Supplier Performance",
  "ERP / SAP",
  "Product Design",
  "UI/UX Design",
  "Visual Communication",
]

export const toolGroups: ToolGroup[] = [
  {
    label: "Technical Development",
    // Split out of one "HTML/CSS/JS" entry, because three marks cannot share
    // one chip and the row is led by its marks. Say the word and it goes back.
    tools: [
      { name: "HTML5", icon: "html5" },
      { name: "CSS", icon: "css" },
      { name: "JavaScript", icon: "javascript" },
      { name: "Git", icon: "git" },
      { name: "GitHub", icon: "github" },
      { name: "VS Code", icon: "vscode" },
      { name: "Node.js", icon: "nodejs" },
      { name: "Flask", icon: "flask" },
      { name: "Python", icon: "python" },
    ],
    order: 2,
  },
  {
    label: "Research & Data",
    tools: [
      { name: "SQL", logo: "/img/tools/sql.svg" },
      { name: "Excel", logo: "/img/tools/excel.svg" },
      { name: "Power BI", logo: "/img/tools/powerbi.svg" },
      { name: "IBM SPSS", icon: "spss" },
      { name: "Minitab", icon: "minitab" },
    ],
    order: 0,
  },
  {
    label: "Enterprise",
    tools: [{ name: "SAP Logon", icon: "sap" }],
    order: 1,
  },
  {
    label: "AI Tools",
    tools: [
      { name: "Claude Code", icon: "claude" },
      { name: "Codex", logo: "/img/tools/codex.png" },
      { name: "Antigravity", logo: "/img/tools/antigravity.png" },
      { name: "Hermes Agent", logo: "/img/tools/hermes.png" },
    ],
    order: 4,
  },
  {
    label: "Design",
    tools: [
      { name: "Figma Suite", icon: "figma" },
      { name: "Photoshop", icon: "photoshop" },
      { name: "Premiere Pro", icon: "premierepro" },
      { name: "draw.io", icon: "drawio" },
      { name: "Visual Paradigm", logo: "/img/tools/visualparadigm.png" },
    ],
    order: 3,
  },
]
