// Sources: the QSE Figma design file and the published @KeprofQSE_ feed.
//
// No analytics export exists for the account, so this portfolio makes no
// reach, growth or engagement claim. What it shows is the system and the
// work made from it.
import type { CaseStudy } from '@/lib/types'

export const qseDesignPortfolio: CaseStudy = {
  slug: 'qse-instagram-redesign',
  presentationType: 'case-study',
  eyebrow: 'Visual systems case study',
  title: 'QSE Design Portfolio',
  client: 'Keprofesian Quality System Engineering, Telkom University',
  subtitle:
    'A year of recruitment, internship, team and event design for one student organisation, all built from a single frame.',
  overview: {
    summary:
      'I designed one reusable visual system for four campaign types across the QSE Instagram grid. Fixed brand and contact zones kept the account coherent while each campaign retained its own content and tone.',
    role:
      'As graphic designer and art director, I shaped the master template, tested grid rhythm and produced the campaign collections with the Public Affair team.',
    objectives: [
      'Keep four campaign voices coherent in one account',
      'Align repeated information across every three-tile row',
      'Create a template other designers can reuse',
      'Preserve clarity across mixed source photography',
    ],
  },
  snapshot: {
    challenge:
      'Recruitment, member stories, team introductions and event recaps each needed their own voice while the Instagram grid still had to read as one account.',
    delivered:
      'A master template with fixed brand, content-pillar and contact zones, then four campaign collections built from that shared system.',
    outcome:
      'The Public Affair team continued producing posts from the template after my involvement ended. No account analytics were available.',
  },
  engineeringLens: {
    system:
      'QSE’s social-content workflow: a shared Instagram grid, recurring campaigns, changing source photography and a team that had to keep publishing.',
    objective:
      'Make every campaign recognizable on its own while keeping repeated brand information aligned across the full account.',
    stakeholders:
      'QSE Public Affair designers, organization members, recruitment candidates, internship-story contributors and the account audience.',
    constraints: [
      'Multiple campaign voices in one feed',
      'Three-tile Instagram grid rhythm',
      'Mixed source-photo quality',
      'A template used by more than one designer',
      'No analytics export for outcome measurement',
    ],
    methods: [
      'Visual audit',
      'Grid-level layout testing',
      'Master-template design',
      'Photo compositing',
      'Campaign art direction',
    ],
  },
  evidence: {
    level: 'E1',
    name: 'Delivered output',
    summary:
      'The Figma system produced four campaign collections and remained in use by the Public Affair division after the original design work ended.',
    sourceNote:
      'QSE Figma design file and the published @KeprofQSE_ feed, reviewed for this portfolio.',
    limit:
      'No reach, follower-growth or engagement export exists. The evidence supports system reuse and published output, not audience-performance claims.',
  },
  hero: {
    src: '/img/case-studies/qse-instagram-redesign/figma-cover.jpg',
    alt: 'QSE social content design portfolio shown as a Figma cover image',
    caption: 'Selected QSE content, all built from one shared visual system.',
    plate: true,
  },
  meta: [
    {
      label: 'Role',
      value: 'Graphic designer and art director',
    },
    {
      label: 'Team',
      value: 'QSE Public Affair division',
    },
    {
      label: 'Timeline',
      value: 'Academic year 2024/2025',
    },
    {
      label: 'Project type',
      value: 'Organization design portfolio',
    },
  ],
  stack: [
    'Visual Direction',
    'Layout System',
    'Art Direction',
    'Photo Compositing',
    'Figma',
  ],
  sections: [
    {
      id: 'problem',
      label: 'problem',
      lead: 'One account had to carry recruitment, member stories, team introductions and event recaps without looking like four accounts.',
      blocks: [
        {
          type: 'lead',
          html:
            'Each campaign wanted its own voice. The account still had to read as one account. Designing every post on its own terms would have given QSE four visual identities inside a single grid.',
        },
      ],
    },
    {
      id: 'method',
      label: 'method',
      lead: 'To judge a layout the way a visitor meets it, I tested every direction in rows of three, at grid size.',
      blocks: [
        {
          type: 'figure',
          src: '/img/case-studies/qse-instagram-redesign/exploration.png',
          alt: 'Figma file showing several QSE grid and template explorations',
          caption:
            'A post that works alone can still break the row it lands in, so nothing was judged alone.',
          plate: true,
          wide: true,
        },
        {
          type: 'figure',
          src: '/img/case-studies/qse-instagram-redesign/feed-before.jpg',
          alt: 'QSE Instagram grid with headers and contact details sitting at different heights',
          caption:
            'Before. Every post solved its own layout, so the repeated elements landed at a different height in each tile.',
          plate: true,
          wide: true,
        },
        {
          type: 'figure',
          src: '/img/case-studies/qse-instagram-redesign/feed-after.jpg',
          alt: 'QSE Instagram grid with brand and contact areas aligned across every tile',
          caption:
            'After. The repeated areas line up across the grid, and the profile reads as one surface.',
          plate: true,
          wide: true,
        },
      ],
    },
    {
      id: 'system',
      label: 'system',
      lead: 'Three zones stay fixed and the centre belongs to the campaign.',
      blocks: [
        {
          type: 'figure',
          src: '/img/case-studies/qse-instagram-redesign/template.png',
          alt: 'QSE master template with fixed top-left, top-right, and bottom areas',
          caption:
            'The master file. Photo-led, dark overlay, white type, and an open centre a new designer can fill without deciding anything else.',
          plate: true,
        },
        {
          type: 'cards',
          cols: 3,
          entries: [
            {
              num: '01',
              title: 'Brand area',
              body: 'Faculty and QSE marks, top left, same position on every post.',
            },
            {
              num: '02',
              title: 'Content pillar',
              body: 'A tag top right telling the reader what kind of post they just opened.',
            },
            {
              num: '03',
              title: 'Contact bar',
              body: 'Instagram and LinkedIn along the bottom, so no post spends its centre on them.',
            },
          ],
        },
        {
          type: 'tags',
          entries: [
            '#GrowWithQSE',
            '#LifeAtQSE',
            '#MeetQSE',
            '#MengenalQSE',
            '#FunFactQSE',
            '#TopModulePPB',
          ],
        },
      ],
    },
    {
      id: 'collections',
      label: 'collections',
      lead: 'Four campaigns, all cut from the same frame.',
      blocks: [
        {
          type: 'cards',
          cols: 2,
          entries: [
            {
              num: '01',
              title: 'Open recruitment',
              body: 'A teaser opens it, the details follow, the extension reuses the frame with one number changed.',
            },
            {
              num: '02',
              title: 'Internship stories',
              body: 'A fixed carousel so a long story stops making the reader re-learn each slide.',
            },
            {
              num: '03',
              title: 'Meet the team',
              body: 'One member card that holds a division of three and a division of fifteen.',
            },
            {
              num: '04',
              title: 'Induction recap',
              body: 'A contact sheet that carries forty photos without picking a hero.',
            },
          ],
        },
        {
          type: 'gallery',
          entries: [
            {
              src: '/img/case-studies/qse-instagram-redesign/oprec-teaser.jpg',
              label: 'Recruitment · teaser: a silhouette and a date',
              alt: 'QSE open recruitment teaser with a member in uniform',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/oprec-1.jpg',
              label: 'Recruitment · requirements and a QR code',
              alt: 'QSE recruitment post listing requirements beside a QR code',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/oprec-2.jpg',
              label: 'Recruitment · extension, one number changed',
              alt: 'QSE recruitment deadline extension post',
            },
          ],
        },
        {
          type: 'gallery',
          entries: [
            {
              src: '/img/case-studies/qse-instagram-redesign/testimoni-kp-1.jpg',
              label: 'Stories · cover: portrait, name, company',
              alt: 'QSE internship story carousel cover',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/testimoni-kp-2.jpg',
              label: 'Stories · the same text block every time',
              alt: 'QSE internship story slide with company and project details',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/testimoni-kp-3.jpg',
              label: 'Stories · only the content changes',
              alt: 'QSE second internship story slide',
            },
          ],
        },
        {
          type: 'gallery',
          entries: [
            {
              src: '/img/case-studies/qse-instagram-redesign/meet-team-cover-3.jpg',
              label: 'Team · cover: the full organisation',
              alt: 'QSE Meet Our Team cover with the full group',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/meet-team-cover-1.jpg',
              label: 'Team · cover: core team',
              alt: 'QSE Meet Our Team cover for the core team',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/meet-team-cover-2.jpg',
              label: 'Team · cover: Public Affair',
              alt: 'QSE Meet Our Team cover for the Public Affair division',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/meet-team-recap.jpg',
              label: 'Team · the whole roster, cut from one card',
              alt: 'QSE team roster built from the shared member-card layout',
              span: 'three',
            },
          ],
        },
        {
          type: 'gallery',
          entries: [
            {
              src: '/img/case-studies/qse-instagram-redesign/penerimaan-1.jpg',
              label: 'Recap · the contact sheet as composition',
              alt: 'QSE induction recap cover in a photo contact-sheet layout',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/penerimaan-2.jpg',
              label: 'Recap · the grid absorbs mixed photo quality',
              alt: 'QSE induction recap slide with event photos',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/penerimaan-3.jpg',
              label: 'Recap · more people, same rhythm',
              alt: 'QSE induction recap slide with more event photos',
            },
            {
              src: '/img/case-studies/qse-instagram-redesign/penerimaan-4.jpg',
              label: 'Recap · closing frame',
              alt: 'QSE induction recap slide with a final event photo set',
            },
          ],
        },
      ],
    },
    {
      id: 'outcome',
      label: 'outcome',
      lead: 'The division kept making posts from the file after I stopped touching it, and that is the only outcome I can show.',
      blocks: [
        {
          type: 'metrics',
          entries: [
            { count: 1, label: 'Master template', sub: 'Shared across the division' },
            { count: 6, label: 'Content pillars', sub: 'One tag system' },
            { count: 4, label: 'Campaign types', sub: 'Built from the same frame', tone: 'good' },
          ],
        },
        {
          type: 'text',
          html:
            'Members kept the brand area, the pillar tag and the contact bar where they were, and changed the photo and the words. That was the point of building a frame instead of a set of posts.',
        },
        {
          type: 'callout',
          title: 'What this page does not claim',
          body:
            'The account has no analytics export in this project, so I make no claim about reach, followers or engagement. What I can show is the system, the work made from it, and the fact that it outlived my involvement.',
        },
        {
          type: 'callout',
          title: 'Next improvement',
          body:
            'The rules live inside the Figma file and nowhere else. A one-page guide on photo treatment and type would tell a new member when they are allowed to break the system, which is the part a template cannot say on its own.',
        },
        {
          type: 'callout',
          title: 'Credit',
          body:
            'I created the visual system, the campaign layouts and the art direction as a member of the QSE Public Affair division.',
        },
      ],
    },
  ],
}
