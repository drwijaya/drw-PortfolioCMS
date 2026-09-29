import { PreviewReady } from "@/components/admin/PreviewReady";
import { markPreview } from '@/lib/cms/review'
import { requireOwner } from "@/lib/cms/security";
import { getEntry } from "@/lib/cms/repository";
import { readDocument, siteSettings } from "@/lib/cms/read";
import { DocumentRenderer } from "@/components/cms/DocumentRenderer";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileDock } from "@/components/mobile/MobileDock";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { RouteTransitionProvider } from "@/components/navigation/RouteTransition";
import { CursorProvider } from "@/components/cursor/CursorProvider";
import { SiteConfig, type MenuItem } from "@/components/cms/SiteConfig";
import { PreviewFrame } from "@/components/admin/PreviewFrame";
import { CollectionData } from "@/components/off-the-clock/CollectionData";
import { Collection } from "@/components/off-the-clock/Collection";
import { collectionRooms } from "@/lib/cms/collections";
import type { RoomId } from "@/content/off-the-clock";
export const dynamic = "force-dynamic";
export default async function Preview({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ frame?: string; theme?: string }>;
}) {
  const owner=await requireOwner();
  const { id } = await params,
    query = await searchParams,
    entry = await getEntry(id);
  if (!query.frame) return <PreviewFrame id={id} version={entry.version} />;
  await markPreview(owner.session.id,id,entry.version);
  const nav = await readDocument("navigation", "main"),
    settings = await siteSettings();
  const page = ["profile"].includes(entry.kind)
    ? "about"
    : entry.kind === "playground"
      ? "playground"
      : entry.kind === "settings"
        ? "contact"
        : "works";
  const doc = ["work", "post", "page", "pattern"].includes(entry.kind)
    ? entry.draft
    : await readDocument("page", page);
  return (
    <>
      <PreviewReady/>
      <style>{query.theme === "dark" ? "html{color-scheme:dark}" : ""}</style>
      <SiteConfig
        items={(nav?.data.items as MenuItem[]) ?? []}
        analyticsEnabled={false}
        analyticsPublic={settings?.analyticsPublic !== false}
      >
        <CursorProvider>
          <RouteTransitionProvider>
            <div className="shell">
              <Sidebar />
              <main className="canvas">
                {entry.kind === "collection" ? (
                  <CollectionData value={await collectionRooms()}>
                    <Collection room={entry.draft.slug as RoomId} />
                  </CollectionData>
                ) : doc ? (
                  <DocumentRenderer document={doc} />
                ) : (
                  <p>Halaman preview belum tersedia.</p>
                )}
              </main>
              <MobileHeader />
              <MobileDock />
            </div>
          </RouteTransitionProvider>
        </CursorProvider>
      </SiteConfig>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.dataset.theme=${JSON.stringify(query.theme === "dark" ? "dark" : "light")}`,
        }}
      />
      <style>
        {".cs-reveal{opacity:1!important;transform:none!important}"}
      </style>
    </>
  );
}
