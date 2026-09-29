// Source: "Project Website Ensyse Slide (1).pdf" in
// web/content/case-studies/source-materials, plus captures of
// the live site at ensys.labs.telkomuniversity.ac.id taken 1 September 2026.
//
// The deck supports the delivery and approval claims. It carries no analytics,
// so this page makes no traffic or engagement claim.
import type { CaseStudy } from '@/lib/types'

export const ensyseProject: CaseStudy = {
  slug: 'ensyse-website',
  presentationType: 'case-study',
  eyebrow: 'Digital product case study',
  title: 'ENSYSe Laboratory Website',
  client: 'Enterprise System Engineering Laboratory, Telkom University',
  subtitle:
    'A laboratory with four courses and no public address. I led the product design and built the front end its staff still edit today.',
  overview: {
    summary:
      'I turned the laboratory’s courses, activities and people into one responsive website and a maintainable publishing system. The approved site launched on the university subdomain with reusable blocks staff can edit after handover.',
    role:
      'I led product design and front-end development in an eight-person team, from information architecture and Figma through WordPress implementation.',
    objectives: [
      'Give the laboratory one coherent public address',
      'Organize four course tracks within one page system',
      'Build responsive layouts from reusable components',
      'Let staff update content without editing custom code',
    ],
  },
  snapshot: {
    challenge:
      'The laboratory taught four courses and ran activities, research and competitions, but had no central public website or maintainable publishing structure.',
    delivered:
      'A responsive Figma page system and WordPress front end with reusable Gutenberg blocks for five sections and four course tracks.',
    outcome:
      'The laboratory approved the website at final review and launched it on the university subdomain. Staff can edit it after handover.',
  },
  engineeringLens: {
    system:
      'The laboratory’s public information across courses, activities, people and long-form content, plus the staff workflow used to keep it current.',
    objective:
      'Give the laboratory one coherent public address that staff can maintain without rebuilding layouts or editing custom code.',
    stakeholders:
      'Laboratory staff and assistants, current and prospective students, the laboratory Product Owner, and the eight-person project team.',
    constraints: [
      'Four course tracks with different resources',
      'Five public site sections',
      'WordPress and university hosting',
      'Staff handover after the project ended',
      'September 2025 to January 2026 delivery window',
    ],
    methods: [
      'Information architecture',
      'Figma page-system design',
      'Scrum reviews',
      'Reusable Gutenberg blocks',
      'Responsive front-end development',
    ],
  },
  evidence: {
    level: 'E1',
    name: 'Delivered output',
    summary:
      'The website passed the January final review, launched on the university subdomain and remained editable by laboratory staff after handover.',
    sourceNote:
      'Project Website ENSYSe presentation deck and captures of the live website, reviewed September 2026.',
    limit:
      'The project materials contain no traffic, engagement or usability analytics. This case study demonstrates delivery and maintainability, not measured audience impact.',
  },
  hero: {
    src: '/img/case-studies/ensyse-website/home.png',
    alt: 'ENSYSe website home page with the laboratory introduction and four course cards',
    caption: 'The live home page: laboratory introduction over the four course tracks.',
  },
  meta: [
    {
      label: 'Role',
      value: 'Product design lead and front-end developer',
    },
    {
      label: 'Team',
      value: 'Eight-person project team',
    },
    {
      label: 'Timeline',
      value: 'September 2025 to January 2026',
    },
    {
      label: 'Project type',
      value: 'Laboratory website',
    },
  ],
  stack: [
    'Product Design',
    'Information Architecture',
    'Figma',
    'WordPress',
    'Gutenberg',
    'HTML/CSS/JS',
  ],
  sections: [
    {
      id: 'problem',
      label: 'problem',
      lead: 'A laboratory teaching four courses had no public address, and whatever we built had to survive our handover.',
      blocks: [
        {
          type: 'lead',
          html:
            'The Enterprise System Engineering Laboratory teaches ERP, information systems, programming and data analysis. It also runs practicums, company visits, competitions and research. None of it had a public home.',
        },
        {
          type: 'text',
          html:
            'A one-off site would have gone stale the week we left. So the brief I actually worked to was the editor, not the visitor: the assistants had to be able to change a page next year without calling a developer.',
        },
        {
          type: 'cards',
          cols: 2,
          entries: [
            {
              num: '01',
              title: 'One clear structure',
              body: 'Five sections cover the laboratory, its courses, its activities and its people.',
            },
            {
              num: '02',
              title: 'Responsive pages',
              body: 'The same layouts hold at phone, tablet and desktop widths.',
            },
            {
              num: '03',
              title: 'Editable content',
              body: 'Staff rearrange a page with blocks instead of editing markup.',
            },
            {
              num: '04',
              title: 'A consistent design',
              body: 'Shared blocks keep type, spacing and layout in one system across every page.',
            },
          ],
        },
      ],
    },
    {
      id: 'method',
      label: 'method',
      lead: 'To build against an approved design, I set the page system in Figma and took it through sprint review before writing code.',
      blocks: [
        {
          type: 'pipeline',
          entries: [
            { n: '01', label: 'Design', sub: 'Figma page system' },
            { n: '02', label: 'Build', sub: 'Custom front-end code' },
            { n: '03', label: 'Edit', sub: 'Gutenberg block order' },
            { n: '04', label: 'Review', sub: 'Sprint and final checks', final: true },
          ],
        },
        {
          type: 'figure',
          src: '/img/case-studies/ensyse-website/scrum-cycle.png',
          alt: 'Project timeline from September planning to the January final review',
          caption:
            'Planned in September, built from October to December, reviewed and launched in January.',
        },
      ],
    },
    {
      id: 'design',
      label: 'design',
      lead: 'Five sections share one page system, and the two hardest templates decided the shape of everything else.',
      blocks: [
        {
          type: 'figure',
          src: '/img/case-studies/ensyse-website/home.png',
          alt: 'ENSYSe home page with a welcome panel and four course cards',
          caption:
            'Home. A rotating welcome panel over the four course tracks, each opening its own detail page.',
          wide: true,
        },
        {
          type: 'cards',
          cols: 2,
          entries: [
            {
              num: '01',
              title: 'A course carries four kinds of content',
              body: 'Course information, hands-on resources, software and submissions. Stacked, that is a page nobody scrolls, so the course template splits them across tabs and loads each on demand.',
            },
            {
              num: '02',
              title: 'Divisions grow and shrink',
              body: 'The team page groups assistants into five divisions that change size every intake. The member card is one block repeated, so a division can gain or lose people without the layout breaking.',
            },
          ],
        },
        {
          type: 'gallery',
          entries: [
            {
              src: '/img/case-studies/ensyse-website/course-detail.png',
              label: 'Course: four tabs over one frame',
              alt: 'ENSYSe course page for Hands-On Enterprise Resource Planning with tabbed sections',
            },
            {
              src: '/img/case-studies/ensyse-website/team.png',
              label: 'Team: one card, five divisions',
              alt: 'ENSYSe Meet Our Assistant page with division tabs and member cards',
            },
            {
              src: '/img/case-studies/ensyse-website/about.png',
              label: 'About: profile, vision, mission',
              alt: 'ENSYSe about page with a team photo, vision, mission and work programme',
            },
            {
              src: '/img/case-studies/ensyse-website/activities.png',
              label: 'Activities: the post archive',
              alt: 'ENSYSe Life at Ensyse activity archive with post cards',
            },
            {
              src: '/img/case-studies/ensyse-website/advisor.png',
              label: 'Long-form: the reading template',
              alt: 'ENSYSe long-form page template with a portrait card above running text',
            },
          ],
        },
      ],
    },
    {
      id: 'handover',
      label: 'handover',
      lead: 'To keep the site editable without letting it drift, Gutenberg controls the order of blocks and my code controls what sits inside them.',
      blocks: [
        {
          type: 'text',
          html:
            'I wrote the HTML, CSS and JavaScript, then placed it inside WordPress as Gutenberg blocks. That split is the whole handover: order is editable, design is not. An editor can rebuild a page and cannot break the type scale.',
        },
      ],
    },
    {
      id: 'outcome',
      label: 'outcome',
      lead: 'Live since January 2026 on the university subdomain, approved at final review, and edited by staff without me.',
      blocks: [
        {
          type: 'metrics',
          entries: [
            { count: 5, label: 'Site sections', sub: 'Home through to Feedback' },
            { count: 4, label: 'Course tracks', sub: 'ERP, APSI, ALPRO, Data' },
            { count: 1, label: 'Live website', sub: 'Approved at final review', tone: 'good' },
          ],
        },
        {
          type: 'callout',
          title: 'Launch status',
          body:
            'Live at <strong>ensys.labs.telkomuniversity.ac.id</strong>, approved at the January milestone review.',
        },
        {
          type: 'callout',
          title: 'What this does not show',
          body:
            'The project deck holds no traffic or user data. I treat the launch and the approval as delivery proof, and I make no claim that the site changed engagement.',
        },
        {
          type: 'callout',
          title: 'Project credits',
          body:
            'Project team of eight: Matthew Sebastian Sugarry as project manager, with Pamela Rizqi Maharani, Tessa Trinita Br Barus, David Rizky Wijaya, Cindy Joselyn Lim, Oktrian Dini Ramadhani and Marcell Mayer Chan, working to the laboratory as Product Owner. I led the product design and built the front end.',
        },
      ],
    },
  ],
}
