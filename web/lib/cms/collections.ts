import { cmsEnabled } from './db'
import { rooms, MEDIA_ROOMS, type Favorite } from "@/content/off-the-clock";
import { readDocuments } from "./read";
export async function collectionRooms() {
  const docs = await readDocuments("collection");
  if (!cmsEnabled())return rooms;
  if(docs.length!==MEDIA_ROOMS.length)throw new Error("CMS collections are incomplete. Complete migration before activation.");
  const next = structuredClone(rooms);
  for (const room of MEDIA_ROOMS) {
    const doc = docs.find((d) => d.slug === room);
    if (!doc) continue;
    next[room].description = String(doc.data.description);
    const overrides = doc.data.favorites as Partial<Favorite>[];
    next[room].favorites = rooms[room].favorites.map((f, i) => ({
      ...f,
      ...overrides[i],
      id: f.id,
      title: f.title,
      creator: f.creator,
      year: f.year,
      link: f.link,
    }));
  }
  return next;
}
