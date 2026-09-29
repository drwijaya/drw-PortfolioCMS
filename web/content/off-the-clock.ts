export const ROOM_IDS = ['homelab', 'music', 'film', 'games'] as const
export type RoomId = (typeof ROOM_IDS)[number]
export type MediaRoom = Exclude<RoomId, 'homelab'>
export const MEDIA_ROOMS: MediaRoom[] = ['music', 'film', 'games']

// Swap artwork or its framing without changing scene code. Ratios apply both
// to wall displays and collection pages: cinema 2:3, LP 1:1, game print A4.
export const mediaFormats = {
  music: { ratio: '1 / 1', width: 48, height: 48, top: 58, display: 'vinyl' },
  film: { ratio: '2 / 3', width: 48, height: 72, top: 45, display: 'poster' },
  games: { ratio: '210 / 297', width: 42, height: 42 * 297 / 210, top: 83, display: 'cabinet' },
} as const

export interface Favorite {
  id: string
  title: string
  creator: string
  year?: string
  note: string
  artwork?: string
  artworkAlt?: string
  artworkFit?: 'contain' | 'cover'
  artworkPosition?: string
  display?: 'vinyl' | 'poster' | 'cabinet'
  link?: string
}
export interface JournalEntry {
  slug: string
  title: string
  date: string
  excerpt: string
  paragraphs: string[]
  spoilers?: string[]
}

// Favorites supplied by David. Personal notes remain empty until authored.
// Artwork sources are recorded in reports/off-the-clock-artwork.json.
export const rooms: Record<RoomId, {
  name: string; place: string; eyebrow: string; description: string; empty: string
  favorites: Favorite[]
}> = {
  homelab: {
    name: 'Homelab', place: 'The workshop', eyebrow: 'Always a work in progress',
    description: 'A little space for machines, experiments, and figuring things out.',
    empty: 'The setup notes are still on the workbench. Hardware, services, and a look at how it all connects will live here.',
    favorites: [],
  },
  music: {
    name: 'Music', place: 'The record shop', eyebrow: 'For the repeat button',
    description: 'Four records, a turntable, and room to stay a while.',
    empty: 'The sleeves are waiting for their records. Four favorites and the stories behind them are coming soon.',
    favorites: [
      {
            "id": "agterplaas",
            "title": "Agterplaas",
            "creator": "The Adams",
            "year": "2019",
            "note": "",
            "artwork": "/img/off-the-clock/agterplaas.jpg",
            "link": "https://music.apple.com/us/album/agterplaas/1455877692?uo=4"
      },
      {
            "id": "abbey-road",
            "title": "Abbey Road",
            "creator": "The Beatles",
            "year": "1969",
            "note": "",
            "artwork": "/img/off-the-clock/abbey-road.jpg",
            "link": "https://music.apple.com/us/album/abbey-road-2019-mix/1474815798?uo=4"
      },
      {
            "id": "detourn",
            "title": "Detourn",
            "creator": "The SIGIT",
            "year": "2013",
            "note": "",
            "artwork": "/img/off-the-clock/detourn.jpg",
            "link": "https://music.apple.com/us/album/detourn/649931571?uo=4"
      },
      {
            "id": "sinestesia",
            "title": "Sinestesia",
            "creator": "Efek Rumah Kaca",
            "year": "2015",
            "note": "",
            "artwork": "/img/off-the-clock/sinestesia.jpg",
            "link": "https://music.apple.com/us/album/sinestesia/1451767721?uo=4"
      }
],
  },
  film: {
    name: 'Film', place: 'The little cinema', eyebrow: 'Stay through the credits',
    description: 'A wall for four favorites. A journal for everything else.',
    empty: 'The frames are ready. Four favorite films and a few words about each are coming soon.',
    favorites: [
      {
            "id": "jatuh-cinta",
            "title": "Jatuh Cinta Seperti di Film-Film",
            "creator": "Yandy Laurens",
            "year": "2023",
            "note": "",
            "artwork": "/img/off-the-clock/jatuh-cinta.jpg",
            "link": "https://en.wikipedia.org/wiki/Falling_in_Love_Like_in_Movies"
      },
      {
            "id": "the-odyssey",
            "title": "The Odyssey",
            "creator": "Christopher Nolan",
            "year": "2026",
            "note": "",
            "artwork": "/img/off-the-clock/the-odyssey.jpg",
            "link": "https://en.wikipedia.org/wiki/The_Odyssey_%282026_film%29"
      },
      {
            "id": "forrest-gump",
            "title": "Forrest Gump",
            "creator": "Robert Zemeckis",
            "year": "1994",
            "note": "",
            "artwork": "/img/off-the-clock/forrest-gump.jpg",
            "link": "https://en.wikipedia.org/wiki/Forrest_Gump"
      },
      {
            "id": "schindlers-list",
            "title": "Schindler’s List",
            "creator": "Steven Spielberg",
            "year": "1993",
            "note": "",
            "artwork": "/img/off-the-clock/schindlers-list.jpg",
            "link": "https://en.wikipedia.org/wiki/Schindler%27s_List"
      }
],
  },
  games: {
    name: 'Games', place: 'The arcade', eyebrow: 'One more save point',
    description: 'Four cabinets for the worlds worth coming back to.',
    empty: 'The cabinets are warming up. Four favorite games and their stories are coming soon.',
    favorites: [
      {
            "id": "cyberpunk-2077",
            "title": "Cyberpunk 2077",
            "creator": "CD Projekt Red",
            "year": "2020",
            "note": "",
            "artwork": "/img/off-the-clock/cyberpunk-2077.jpg",
            "link": "https://en.wikipedia.org/wiki/Cyberpunk_2077"
      },
      {
            "id": "harvest-moon",
            "title": "Harvest Moon: Back to Nature",
            "creator": "PlayStation",
            "year": "1999",
            "note": "",
            "artwork": "/img/off-the-clock/harvest-moon.jpg",
        "link": "https://en.wikipedia.org/wiki/Harvest_Moon%3A_Back_to_Nature"
      },
      {
            "id": "gta-san-andreas",
            "title": "Grand Theft Auto: San Andreas",
            "creator": "Rockstar Games",
            "year": "2004",
            "note": "",
            "artwork": "/img/off-the-clock/gta-san-andreas.jpg",
        "link": "https://en.wikipedia.org/wiki/Grand_Theft_Auto%3A_San_Andreas"
      },
      {
            "id": "final-fantasy-vi",
            "title": "Final Fantasy VI",
            "creator": "Square",
            "year": "1994",
            "note": "",
            "artwork": "/img/off-the-clock/final-fantasy-vi.jpg",
        "link": "https://en.wikipedia.org/wiki/Final_Fantasy_VI"
      }
],
  },
}

export const homelab: { updated?: string; sections: { title: string; body: string }[] } = {
  "updated": "2026-09-11",
  "sections": [
    {
      "title": "The machine",
      "body": "Lenovo ThinkPad L13 Yoga Gen 1. Intel Core i5-10310U, 4 cores / 8 threads, with 6.7 GiB of usable memory and a 238.5 GiB NVMe drive."
    },
    {
      "title": "The foundation",
      "body": "Ubuntu 26.04 LTS, with services running in Docker containers. Portainer provides a home for container management."
    },
    {
      "title": "What lives here",
      "body": "This portfolio and its analytics service, Immich for photos, and a collection of development projects and dashboards."
    },
    {
      "title": "Getting connected",
      "body": "Cloudflare Tunnel for publishing web services, with Tailscale also running on the host. A small machine with a lot going on."
    }
  ]
}
export const journals: Record<MediaRoom, JournalEntry[]> = { music: [], film: [], games: [] }
export const journalCopy: Record<MediaRoom, { title: string; heading: string; empty: string }> = {
  music: { title: 'Music journal', heading: 'Listening notes', empty: 'No entries just yet. Notes on the other records I listen to will find their way here.' },
  film: { title: 'Film journal', heading: 'After the credits', empty: 'No entries just yet. Notes on the other films I watch will find their way here.' },
  games: { title: 'Games journal', heading: 'Notes from the save point', empty: 'No entries just yet. Notes on the other games I play will find their way here.' },
}

export function isRoom(value: string | null | undefined): value is RoomId {
  return ROOM_IDS.some(id => id === value)
}

export function isMediaRoom(value: string | null | undefined): value is MediaRoom {
  return isRoom(value) && value !== 'homelab'
}
