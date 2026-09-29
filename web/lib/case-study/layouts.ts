import type { Block, CaseStudySection } from '@/lib/types'

export type BeatLayout =
  | 'context-stack'
  | 'narrative-split'
  | 'paired-evidence'
  | 'sequence-gallery'
  | 'data-ledger'
  | 'signal-band'

export type BeatTone = 'plain' | 'soft' | 'accent' | 'dark'
export type MediaWidth = 'compact' | 'medium' | 'full'

interface BeatSpec {
  id: string
  layout: BeatLayout
  intro: string
  blockIndexes: number[]
  heading?: string
  takeaway?: string
  tone?: BeatTone
  mediaWidth?: MediaWidth
}

export interface ResolvedBeat extends Omit<BeatSpec, 'blockIndexes'> {
  interaction?: 'none' | 'comparison' | 'experiment'
  walkthroughs?: string[]
  blocks: Block[]
}

type SectionLayoutMap = Record<string, BeatSpec[]>

const bobbin: SectionLayoutMap = {
  problem: [
    {
      id: 'problem-scale',
      layout: 'signal-band',
      tone: 'soft',
      heading: 'The scale of the problem',
      intro:
        'The first figures establish how often defects appeared, how much sewing contributed, and why a depleted bobbin could pass unnoticed.',
      blockIndexes: [0, 1],
      takeaway:
        'The failure becomes visible only after the seam has already lost its lower thread.',
    },
    {
      id: 'problem-causes',
      layout: 'context-stack',
      heading: 'Why the failure stayed hidden',
      intro:
        'The fishbone diagram connects the operating, machine, and method causes. Read it for the common point: the remaining thread cannot be observed while the machine is running.',
      blockIndexes: [2, 3],
      mediaWidth: 'full',
    },
  ],
  method: [
    {
      id: 'experiment-logic',
      layout: 'sequence-gallery',
      heading: 'A test that keeps the interaction visible',
      intro:
        'Distance and angle can change the same reflected signal together. The sequence below shows how the experiment kept that joint effect measurable and confirmed the selected setting afterward.',
      blockIndexes: [0, 1, 2],
    },
  ],
  explore: [
    {
      id: 'three-inputs',
      layout: 'sequence-gallery',
      heading: 'Three inputs fixed the design constraints',
      intro:
        'The interview, shop-floor observation, and sensor datasheet each supplied a different constraint. Together they set the warning point, available clearance, and unanswered angle question.',
      blockIndexes: [0, 1],
    },
  ],
  hardware: [
    {
      id: 'sensing-principle',
      layout: 'narrative-split',
      heading: 'One reflective mark becomes one count',
      intro:
        'The sensing mechanism is intentionally small. The explanation and image show how one white mark creates a repeatable voltage change without touching the bobbin.',
      blockIndexes: [0, 1],
      mediaWidth: 'medium',
    },
    {
      id: 'hardware-decisions',
      layout: 'sequence-gallery',
      heading: 'Four decisions turn the signal into a usable tool',
      intro:
        'The hardware choices cover sensing, pulse capture, operator warning, and reset behavior. Each decision answers a constraint observed at the sewing station.',
      blockIndexes: [2],
    },
    {
      id: 'pin-map',
      layout: 'data-ledger',
      heading: 'How the components connect',
      intro:
        'This pin map documents the physical interface to the ESP32. Notice that both analogue and digital sensor outputs are retained because they answer different measurement questions.',
      blockIndexes: [3],
    },
    {
      id: 'prototype-views',
      layout: 'sequence-gallery',
      heading: 'Prototype, mount, and repeatable rig',
      intro:
        'These three views move from the assembled unit to the adjustable sensor holder and the test rig. The important detail is that the holder can be removed and returned to a repeatable position between runs.',
      blockIndexes: [4, 5],
    },
  ],
  software: [
    {
      id: 'counting-logic',
      layout: 'context-stack',
      heading: 'Counting without accepting every flicker',
      intro:
        'Two thresholds separate a pulse from signal noise. Rejected edges remain in the experiment record, so a missed rotation cannot disappear from the analysis.',
      blockIndexes: [0, 1],
    },
    {
      id: 'signal-comparison',
      layout: 'paired-evidence',
      tone: 'dark',
      heading: 'Strong and weak reflections, compared',
      intro:
        'Both plots use the same reading logic. Compare the dips against the lower threshold and then follow the accepted-pulse ticks along the bottom.',
      blockIndexes: [2, 3],
      takeaway:
        'Missing ticks are retained as missed rotations, so detection rate measures the placement instead of hiding the filter failures.',
    },
    {
      id: 'software-requirements',
      layout: 'data-ledger',
      heading: 'Requirement, implementation, and acceptance',
      intro:
        'The table links each software requirement to what was built and the condition used to accept it. Read across a row to follow the evidence chain.',
      blockIndexes: [4],
    },
    {
      id: 'experiment-log',
      layout: 'context-stack',
      heading: 'The interface is also the run record',
      intro:
        'The monitor records the run identity, parameters, and responses while the experiment is running. This avoids retyping twelve sets of measurements before analysis.',
      blockIndexes: [5],
      mediaWidth: 'full',
    },
    {
      id: 'software-layers',
      layout: 'sequence-gallery',
      heading: 'Three layers keep measurement and checking separate',
      intro:
        'Firmware captures the signal, the monitoring interface records each run, and an independent script recomputes the results from the saved file.',
      blockIndexes: [6, 7],
    },
  ],
  experiment: [
    {
      id: 'twelve-runs',
      layout: 'data-ledger',
      heading: 'Four treatments, three remounts each',
      intro:
        'The table compares the mean and spread of both responses across all four distance-and-angle combinations. The two responses identify different apparent winners.',
      blockIndexes: [0, 1],
    },
    {
      id: 'response-spread',
      layout: 'context-stack',
      heading: 'The spread matters as much as the mean',
      intro:
        'The boxplots show what the averages alone conceal. Look for the treatment with the widest detection-rate spread across three identical remounts.',
      blockIndexes: [2],
      mediaWidth: 'full',
    },
  ],
  analyze: [
    {
      id: 'interaction',
      layout: 'context-stack',
      heading: 'Distance changes meaning when the angle changes',
      intro:
        'The interaction plot tests whether distance has one consistent effect at both angles. The crossing lines show that it does not, so neither factor can be specified independently.',
      blockIndexes: [0],
      mediaWidth: 'full',
    },
    {
      id: 'anova',
      layout: 'data-ledger',
      heading: 'Where the signal variation came from',
      intro:
        'The ANOVA table separates the model, main effects, interaction, and error. Read the p-value together with contribution rather than treating either column alone as the result.',
      blockIndexes: [1],
    },
    {
      id: 'decision-tradeoff',
      layout: 'paired-evidence',
      heading: 'A decision across two responses',
      intro:
        'The comparison brings detection reliability and signal quality back into one decision. The accompanying limitation explains why detection rate could not separate the four settings statistically.',
      blockIndexes: [2, 3, 4],
    },
  ],
  outcome: [
    {
      id: 'recommended-pair',
      layout: 'signal-band',
      tone: 'accent',
      heading: 'The recommended setting',
      intro:
        'The selected distance-and-angle pair balances repeatability and combined desirability, then checks both responses against a confirmation run.',
      blockIndexes: [0, 1, 2],
    },
    {
      id: 'next-evidence',
      layout: 'context-stack',
      heading: 'What the result establishes—and what comes next',
      intro:
        'The final points translate the finding into a mounting rule and keep the next validation work visible instead of presenting a bench result as production impact.',
      blockIndexes: [3, 4],
    },
  ],
}

const juragan: SectionLayoutMap = {
  problem: [
    {
      id: 'late-quality-control',
      layout: 'context-stack',
      heading: 'The first inspection came after all six stages',
      intro:
        'The current-state process shows when a mistake becomes visible. Follow a batch downstream and notice that inspection arrives only after every preceding stage has already added work.',
      blockIndexes: [0, 1],
      mediaWidth: 'full',
    },
  ],
  method: [
    {
      id: 'four-phases',
      layout: 'sequence-gallery',
      heading: 'Process improvement and operator use, together',
      intro:
        'The four phases connect process analysis with the way operators would actually use the new controls. The final note explains why both methods were necessary.',
      blockIndexes: [0, 1],
    },
  ],
  explore: [
    {
      id: 'field-evidence',
      layout: 'paired-evidence',
      heading: 'Two views of the same workshop',
      intro:
        'Interviews described the intended process while records exposed the process people actually followed. The two personas keep both operating perspectives visible.',
      blockIndexes: [0, 1],
    },
  ],
  analyze: [
    {
      id: 'root-causes',
      layout: 'context-stack',
      heading: 'The causes were distributed across the system',
      intro:
        'The fishbone groups evidence under people, information, material, and method. Read it as a system map: no single category can explain the quality gap on its own.',
      blockIndexes: [0],
      mediaWidth: 'full',
    },
    {
      id: 'four-gaps',
      layout: 'sequence-gallery',
      heading: 'Four gaps emerged from the analysis',
      intro:
        'The four cards convert the root-cause map into designable gaps. The closing statement explains why solving only one would leave the same outcome intact.',
      blockIndexes: [1, 2],
    },
  ],
  standard: [
    {
      id: 'iso-mapping',
      layout: 'data-ledger',
      heading: 'Testing the proposal against an external standard',
      intro:
        'The two-column ledger maps each Clause 8.5.1 requirement to the control designed for it. Read across each row to see whether the proposal answers the requirement directly.',
      blockIndexes: [0],
    },
  ],
  design: [
    {
      id: 'six-gates',
      layout: 'sequence-gallery',
      heading: 'A quality gate at every production stage',
      intro:
        'The sequence shows where each gate sits. Every node represents a stage that must clear its own check before the batch moves forward.',
      blockIndexes: [0],
    },
    {
      id: 'future-process',
      layout: 'context-stack',
      tone: 'dark',
      heading: 'The same line, redrawn around earlier control',
      intro:
        'The future-state diagram shows the structural change from the original process. Look for the checks that now happen before work is handed downstream.',
      blockIndexes: [1],
      mediaWidth: 'full',
    },
    {
      id: 'design-components',
      layout: 'sequence-gallery',
      heading: 'Four controls, one shared record',
      intro:
        'The next group moves from process control into the delivered system: checklists, non-conformance records, specifications, and material labels are kept together by the dashboard.',
      blockIndexes: [2, 3, 4],
    },
    {
      id: 'dashboard-screens',
      layout: 'sequence-gallery',
      heading: 'The workflow across six screens',
      intro:
        'Read the screens in order from overview and specification to production, gate, failure, and current procedure. The sequence follows one order through the system.',
      blockIndexes: [5],
    },
  ],
  outcome: [
    {
      id: 'delivery-evidence',
      layout: 'signal-band',
      tone: 'accent',
      heading: 'Delivery and acceptance evidence',
      intro:
        'The implementation record covers six gates and 184 acceptance cases. The limitation is kept beside those figures because acceptance does not prove later operating improvement.',
      blockIndexes: [0, 1, 2],
    },
    {
      id: 'operational-limits',
      layout: 'context-stack',
      heading: 'What adoption would still require',
      intro:
        'The closing points keep the connection and management dependencies visible, followed by the team credits for the work delivered.',
      blockIndexes: [3, 4],
    },
  ],
}

const kopitech: SectionLayoutMap = {
  problem: [
    {
      id: 'operational-delay',
      layout: 'signal-band',
      tone: 'soft',
      heading: 'A live process, an end-of-day record',
      intro:
        'The opening figures show the cost of disconnected handovers: manual counting, two early bottlenecks, and no live view for production planning.',
      blockIndexes: [0, 1],
    },
    {
      id: 'paper-handover',
      layout: 'context-stack',
      heading: 'Where information stopped moving',
      intro:
        'The current-state BPMN map follows records across warehouse and production roles. Notice that every handover ends in a separate paper record that the next role cannot read live.',
      blockIndexes: [2],
      mediaWidth: 'full',
    },
  ],
  method: [
    {
      id: 'analysis-method',
      layout: 'sequence-gallery',
      heading: 'From current process to testable requirements',
      intro:
        'The five steps move from mapping the process and roles to modelling the data and attaching an acceptance condition to every feature.',
      blockIndexes: [0],
    },
    {
      id: 'stakeholder-roles',
      layout: 'sequence-gallery',
      heading: 'Three perspectives shaped the system',
      intro:
        'The role groups distinguish who could authorize the change, who would use it, and who analysed and built the proposed system.',
      blockIndexes: [1],
    },
  ],
  explore: [
    {
      id: 'nine-role-flow',
      layout: 'sequence-gallery',
      heading: 'Following the machine through nine roles',
      intro:
        'The stage sequence and role cards show how the product and its information move together. The repeated pattern is a paper handover between each operating step.',
      blockIndexes: [0, 1, 2],
    },
  ],
  analyze: [
    {
      id: 'four-problems',
      layout: 'sequence-gallery',
      heading: 'Four symptoms, one information gap',
      intro:
        'The four findings cover stalled assembly, late orders, manual work-in-progress counting, and manual finished-unit reporting. The final sentence identifies their common cause.',
      blockIndexes: [0, 1],
    },
  ],
  design: [
    {
      id: 'handover-change',
      layout: 'paired-evidence',
      heading: 'Turning a handover into a shared record',
      intro:
        'The before-and-after comparison shows what changes when one barcode scan records the same movement for production, work in progress, and stock.',
      blockIndexes: [0, 1],
    },
    {
      id: 'future-process',
      layout: 'context-stack',
      tone: 'dark',
      heading: 'The proposed process',
      intro:
        'The future-state BPMN map places a scan at each handover. Follow one component and look for the point where the dashboard record becomes available to the next role.',
      blockIndexes: [2],
      mediaWidth: 'full',
    },
    {
      id: 'coverage',
      layout: 'signal-band',
      tone: 'accent',
      heading: 'Coverage of the delivered design',
      intro:
        'These figures describe design and acceptance coverage—not factory performance. They show the number of features, criteria, and access roles represented in the build.',
      blockIndexes: [3],
    },
    {
      id: 'wireframe-coverage',
      layout: 'context-stack',
      heading: 'Checking screen coverage before implementation',
      intro:
        'The entity model keeps schedules, requirements, targets, and assemblies connected. The low-fidelity screens then test whether the feature list has a place in the interface.',
      blockIndexes: [4, 5],
      mediaWidth: 'full',
    },
    {
      id: 'delivered-screens',
      layout: 'sequence-gallery',
      heading: 'From overview to finished output',
      intro:
        'Read the delivered screens from overview to schedule, daily target, component stock, and finished assembly. Each screen corresponds to a step in the shared production record.',
      blockIndexes: [6],
    },
  ],
  outcome: [
    {
      id: 'shown-vs-not-shown',
      layout: 'paired-evidence',
      heading: 'Delivered evidence and unmeasured impact',
      intro:
        'The two statements separate what the project demonstrates from what it never measured. Keeping them side by side prevents feature coverage from reading as factory improvement.',
      blockIndexes: [0, 1],
    },
    {
      id: 'next-version',
      layout: 'context-stack',
      heading: 'The next version needs operational safeguards',
      intro:
        'The remaining requirements address failed scans and delayed operator behavior, followed by the project credits.',
      blockIndexes: [2, 3],
    },
  ],
}

const ensyse: SectionLayoutMap = {
  problem: [
    {
      id: 'missing-public-home',
      layout: 'context-stack',
      heading: 'A public presence that had to outlast the project team',
      intro:
        'The laboratory needed one place for its courses, activities and people. The harder requirement was making that place maintainable after handover.',
      blockIndexes: [0, 1],
    },
    {
      id: 'delivery-requirements',
      layout: 'sequence-gallery',
      heading: 'Four requirements shaped the page system',
      intro:
        'Structure, responsiveness, editability and consistency became the rules used to judge every template before implementation.',
      blockIndexes: [2],
    },
  ],
  method: [
    {
      id: 'design-to-handover',
      layout: 'sequence-gallery',
      heading: 'From approved design to an editable build',
      intro:
        'The project moved through a reviewed Figma system, custom front-end implementation, Gutenberg assembly and a final handover check.',
      blockIndexes: [0, 1],
      mediaWidth: 'full',
    },
  ],
  design: [
    {
      id: 'shared-page-system',
      layout: 'context-stack',
      tone: 'dark',
      heading: 'The home page establishes the shared visual grammar',
      intro:
        'The first screen introduces the laboratory and routes students into four course tracks without giving each track a separate visual identity.',
      blockIndexes: [0],
      mediaWidth: 'full',
    },
    {
      id: 'template-decisions',
      layout: 'paired-evidence',
      heading: 'The two templates most likely to break',
      intro:
        'Course pages hold several content types while the team page must absorb changing group sizes. Solving those extremes set the rules for the remaining pages.',
      blockIndexes: [1],
    },
    {
      id: 'site-sections',
      layout: 'sequence-gallery',
      heading: 'One system across five kinds of page',
      intro:
        'The walkthrough moves from course detail and team structure to the profile, activity archive and long-form reading template.',
      blockIndexes: [2],
    },
  ],
  handover: [
    {
      id: 'editable-guardrails',
      layout: 'context-stack',
      heading: 'Editors control content order; the system protects the design',
      intro:
        'Gutenberg gives staff a familiar editing surface while the custom blocks retain the type, spacing and responsive rules established in Figma.',
      blockIndexes: [0],
    },
  ],
  outcome: [
    {
      id: 'launch-evidence',
      layout: 'signal-band',
      tone: 'accent',
      heading: 'A reviewed website that made it through handover',
      intro:
        'The numbers describe the delivered information architecture and launch status. They are delivery evidence, not audience-performance metrics.',
      blockIndexes: [0, 1],
    },
    {
      id: 'ensyse-evidence-boundary',
      layout: 'context-stack',
      heading: 'What the project proves and where the evidence stops',
      intro:
        'The final notes separate launch and approval from unmeasured traffic or engagement, then record the team contribution behind the delivery.',
      blockIndexes: [2, 3],
    },
  ],
}

const qse: SectionLayoutMap = {
  problem: [
    {
      id: 'one-account-many-voices',
      layout: 'context-stack',
      heading: 'Four campaign voices were competing inside one grid',
      intro:
        'The design problem was consistency at account level: each campaign needed distinction without making the feed look like unrelated projects.',
      blockIndexes: [0],
    },
  ],
  method: [
    {
      id: 'grid-level-exploration',
      layout: 'context-stack',
      heading: 'Every direction was tested where the audience would meet it',
      intro:
        'The exploration board evaluates complete rows rather than isolated posts, so a strong tile could not hide a broken feed rhythm.',
      blockIndexes: [0],
      mediaWidth: 'full',
    },
    {
      id: 'feed-comparison',
      layout: 'paired-evidence',
      heading: 'The repeated information becomes the alignment system',
      intro:
        'The before-and-after views show how fixed header and contact zones turn separate posts into one continuous surface.',
      blockIndexes: [1, 2],
      takeaway:
        'Consistency comes from aligning what repeats, while leaving the campaign content room to change.',
    },
  ],
  system: [
    {
      id: 'master-template',
      layout: 'context-stack',
      tone: 'dark',
      heading: 'A fixed frame with an open centre',
      intro:
        'The template locks the brand and navigation cues in place, then gives each campaign the centre of the composition.',
      blockIndexes: [0],
      mediaWidth: 'medium',
    },
    {
      id: 'system-rules',
      layout: 'sequence-gallery',
      heading: 'Three fixed zones and six content pillars',
      intro:
        'The zones explain where repeated information lives. The pillar tags explain what kind of content the audience has opened.',
      blockIndexes: [1, 2],
    },
  ],
  collections: [
    {
      id: 'campaign-map',
      layout: 'sequence-gallery',
      heading: 'Four campaigns test the same system in different ways',
      intro:
        'Recruitment tests urgency, internship stories test long-form reading, team posts test scale and event recaps test mixed photography.',
      blockIndexes: [0],
    },
    {
      id: 'recruitment-series',
      layout: 'sequence-gallery',
      heading: 'Recruitment: from attention to action',
      intro:
        'The sequence opens with anticipation, moves into requirements and reuses the same frame when the deadline changes.',
      blockIndexes: [1],
    },
    {
      id: 'internship-stories',
      layout: 'sequence-gallery',
      heading: 'Internship stories: one reading pattern for every contributor',
      intro:
        'A fixed cover and text structure let the person, company and project change without making readers learn a new carousel each time.',
      blockIndexes: [2],
    },
    {
      id: 'team-series',
      layout: 'sequence-gallery',
      heading: 'Team introductions: one card from three people to the full roster',
      intro:
        'The member system scales across divisions and ends in a recap that keeps the entire organization visually connected.',
      blockIndexes: [3],
    },
    {
      id: 'event-recap',
      layout: 'sequence-gallery',
      heading: 'Event recap: composition from inconsistent source photos',
      intro:
        'The contact-sheet grid absorbs changes in crop, lighting and group size while preserving a steady rhythm across four frames.',
      blockIndexes: [4],
    },
  ],
  outcome: [
    {
      id: 'system-reuse',
      layout: 'signal-band',
      tone: 'accent',
      heading: 'The template kept producing work after handover',
      intro:
        'The output count shows the range covered by the system. Continued use by the division is the strongest available outcome evidence.',
      blockIndexes: [0, 1],
    },
    {
      id: 'qse-evidence-boundary',
      layout: 'context-stack',
      heading: 'Clear limits, a practical next step and explicit credit',
      intro:
        'The closing notes keep missing analytics visible, identify the documentation the system still needs and record responsibility for the work.',
      blockIndexes: [2, 3, 4],
    },
  ],
}

const layoutBySlug: Record<string, SectionLayoutMap> = {
  'bobbin-sensor-doe': bobbin,
  'juragan-cipung': juragan,
  'kopitech-dashboard': kopitech,
  'ensyse-website': ensyse,
  'qse-instagram-redesign': qse,
}

export function resolveSectionBeats(
  slug: string,
  section: CaseStudySection
): ResolvedBeat[] {
  if (section.cmsBeats) return section.cmsBeats
  const specs = layoutBySlug[slug]?.[section.id]

  if (!specs) {
    return [
      {
        id: `${section.id}-story`,
        layout: 'context-stack',
        intro: section.lead,
        blocks: section.blocks,
      },
    ]
  }

  const used = specs.flatMap((spec) => spec.blockIndexes)
  const expected = section.blocks.map((_, index) => index)
  const invalid = used.some((index) => !expected.includes(index))
  const unique = new Set(used)

  if (
    invalid ||
    unique.size !== used.length ||
    unique.size !== expected.length ||
    expected.some((index) => !unique.has(index))
  ) {
    throw new Error(
      `Invalid case-study layout manifest for ${slug}/${section.id}: expected block indexes ${expected.join(', ')}, received ${used.join(', ')}`
    )
  }

  return specs.map(({ blockIndexes, ...spec }) => ({
    ...spec,
    blocks: blockIndexes.map((index) => section.blocks[index]),
  }))
}
