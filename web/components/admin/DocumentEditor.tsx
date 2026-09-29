"use client";
import { scheduledUtc } from "@/lib/cms/schedule";
import { BackIcon } from "./AdminBrand";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { CmsDocument } from "@/lib/cms/model";
import { FieldTree } from "./Fields";
import { api } from "./api";
import { PalettePanel } from "./PalettePanel";
const Gutenberg = dynamic(() => import("./Gutenberg"), {
  ssr: false,
  loading: () => <p role="status">Memuat Gutenberg…</p>,
});
export interface EntryRecord {
  id: string;
  kind: string;
  title: string;
  slug: string;
  draft: CmsDocument;
  published: CmsDocument | null;
  version: number;
  publishedVersion: number | null;
  scheduledAt: string | null;
  trashedAt: string | null;
  updatedAt: string;
}
function changes(before: unknown, after: unknown, path = ""): string[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    before &&
    after &&
    typeof before === "object" &&
    typeof after === "object" &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  )
    return [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].flatMap((k) =>
      changes(
        (before as Record<string, unknown>)[k],
        (after as Record<string, unknown>)[k],
        path ? `${path}.${k}` : k,
      ),
    );
  return [path || "dokumen"];
}
export function DocumentEditor({
  initial,
  timezone = "UTC",
}: {
  initial: EntryRecord;
  timezone?: string;
}) {
  const [pendingSchedule, setPendingSchedule] = useState<string | null>(null);
  const [entry, setEntry] = useState(initial),
    [doc, setDoc] = useState(initial.draft),
    [tab, setTab] = useState("content"),
    [state, setState] = useState("Saved"),
    [error, setError] = useState(""),
    [review, setReview] = useState(false),
    [revisions, setRevisions] = useState<
      {
        version: number;
        reason: string;
        createdAt: string;
        document: CmsDocument;
      }[]
    >([]),
    [scheduled, setScheduled] = useState(""),
    [editorKey, setEditorKey] = useState(0);
  const [savedSnapshot,setSavedSnapshot] = useState(JSON.stringify(initial.draft));
  const current = useRef(doc),
    saved = useRef(JSON.stringify(initial.draft)),
    inFlight = useRef(false),
    version = useRef(initial.version);
  const dirty = JSON.stringify(doc) !== savedSnapshot;
  const persist = useCallback(
    async function persistDocument(autosave = false) {
      if (inFlight.current) return null;
      inFlight.current = true;
      setState("Saving");
      setError("");
      const snapshot = current.current;
      let succeeded = false;
      try {
        const next = await api<EntryRecord>(`entries/${initial.id}`, "PUT", {
          document: snapshot,
          version: version.current,
          autosave,
        });
        version.current = next.version;
        saved.current = JSON.stringify(snapshot);
        setSavedSnapshot(saved.current);
        setEntry(next);
        succeeded = true;
        setState(
          JSON.stringify(current.current) === saved.current
            ? "Saved"
            : "Unsaved changes",
        );
        return next;
      } catch (e) {
        setState("Save failed");
        setError((e as Error).message);
        return null;
      } finally {
        inFlight.current = false;
        if (succeeded && JSON.stringify(current.current) !== saved.current)
          void persistDocument(true);
      }
    },
    [initial.id],
  );
  useEffect(() => {
    current.current = doc;
    if (JSON.stringify(doc) === saved.current) return;
    setState("Unsaved changes");
    const timer = setTimeout(() => void persist(true), 2500);
    return () => clearTimeout(timer);
  }, [doc, persist]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  async function action(name: string, extra: Record<string, unknown> = {}) {
    setError("");
    try {
      if (inFlight.current) throw new Error("Tunggu penyimpanan selesai");
      let latest = entry;
      if (JSON.stringify(current.current) !== saved.current) {
        const next = await persist();
        if (!next) return;
        latest = next;
      }
      const next = await api<EntryRecord>(
        `entries/${entry.id}/action`,
        "POST",
        { action: name, version: latest.version, ...extra },
      );
      if (next) {
        setEntry(next);
        version.current = next.version;
        saved.current = JSON.stringify(next.draft);
        setSavedSnapshot(saved.current);
        setDoc(next.draft);
        setEditorKey((k) => k + 1);
      }
      setReview(false);
      setState(name === "publish" ? "Published" : "Saved");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function openReview(at: string | null = null) {
    try {
      await api(`entries/${entry.id}/review`, "POST", {
        version: entry.version,
      });
      setPendingSchedule(at);
      setReview(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function preview() {
    const target=window.open('about:blank','_blank');
    if(!target){setError('Browser memblokir preview. Izinkan tab baru lalu coba lagi.');return;}
    target.opener=null;
    if(inFlight.current){target.close();setError('Tunggu penyimpanan selesai sebelum preview.');return;}
    if (dirty && !(await persist())) {target.close();return;}
    target.location.href=`/admin/preview/${entry.id}`;
  }
  useEffect(() => {
    const click = (e: MouseEvent) => {
      const link = (e.target as Element)?.closest("a");
      if (
        dirty &&
        link &&
        link.target !== "_blank" &&
        !link.hasAttribute("download") &&
        !confirm("Perubahan belum tersimpan. Tinggalkan editor?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [dirty]);
  useEffect(() => {
    if(new URLSearchParams(window.location.search).get('review') !== '1') return;
    let active = true;
    void api(`entries/${initial.id}/review`, 'POST', {version:initial.version}).then(()=>{if(active){setReview(true);window.history.replaceState(null,'',window.location.pathname)}}).catch(e=>{if(active)setError(e.message)});
    return()=>{active=false};
  },[initial.id,initial.version]);
  const blockKinds = ["work", "post", "page", "pattern"];
  return (
    <section>
      <div className="cms-toolbar cms-sticky">
        <div>
          <Link className="cms-back-link"
            href={`/admin/${({ work: "works", post: "posts", page: "pages", pattern: "patterns", collection: "collections" } as Record<string, string>)[entry.kind] ?? entry.kind}`}
          >
            <BackIcon/> Kembali ke daftar
          </Link>
          <p className="cms-muted" role="status">
            {state}
            {entry.scheduledAt
              ? ` · Terjadwal ${new Date(entry.scheduledAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        <div className="cms-actions">
          <button
            onClick={() => void persist()}
            disabled={state === "Saving" || !dirty}
          >
            Simpan draft
          </button>
          <button onClick={() => void preview()}>Preview ↗</button>
          <button
            className="cms-primary"
            disabled={dirty || state === "Saving"}
            onClick={() => void openReview()}
          >
            Review & publish
          </button>
        </div>
      </div>
      <p className="cms-publish-hint">{dirty ? "Simpan perubahan sebelum membuka preview." : state === "Published" ? "Perubahan sudah diterbitkan ke website." : "Draft tersimpan. Buka preview, lalu review perubahan sebelum publish."}</p>
      {error && (
        <p className="cms-alert" role="alert">
          {error}
        </p>
      )}
      <div className="cms-document-title">
        <label htmlFor="document-title">Judul</label>
        <input
          id="document-title"
          value={doc.title}
          onChange={(e) => setDoc({ ...doc, title: e.target.value })}
        />
        <div className="cms-slug">
          <label htmlFor="document-slug">Slug</label>
          <input
            id="document-slug"
            value={doc.slug}
            disabled={
              [
                "profile",
                "navigation",
                "appearance",
                "settings",
                "collection",
              ].includes(doc.kind) ||
              (doc.kind === "page" && doc.data.template === "existing")
            }
            onChange={(e) => setDoc({ ...doc, slug: e.target.value })}
          />
        </div>
      </div>
      <nav className="cms-tabs" aria-label="Pengaturan dokumen">
        {[
          ["content", "Konten"],
          ["fields", "Properti"],
          ["seo", "SEO"],
          ["history", "Revisi"],
          ["publish", "Publikasi"],
        ].map(([id, label]) => (
          <button
            aria-current={tab === id ? "page" : undefined}
            key={id}
            onClick={() => {
              setTab(id);
              if (id === "history")
                void api<typeof revisions>(`entries/${entry.id}/revisions`)
                  .then(setRevisions)
                  .catch((e) => setError(e.message));
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "content" &&
        (doc.kind === "appearance" ? (
          <PalettePanel
            data={doc.data}
            onChange={(data) => setDoc({ ...doc, data })}
          />
        ) : blockKinds.includes(doc.kind) ? (
          <Gutenberg
            key={editorKey}
            blocks={doc.blocks}
            onChange={(blocks) => setDoc((d) => ({ ...d, blocks }))}
          />
        ) : (
          <div className="cms-form">
            <FieldTree
              value={doc.data}
              label={doc.title}
              locked={doc.kind === "collection"}
              onChange={(data) =>
                setDoc({ ...doc, data: data as Record<string, unknown> })
              }
            />
          </div>
        ))}
      {tab === "fields" && (
        <div className="cms-form">
          <FieldTree
            value={doc.data}
            label="Properti dokumen"
            locked={doc.kind === "collection"}
            onChange={(data) =>
              setDoc({ ...doc, data: data as Record<string, unknown> })
            }
          />
        </div>
      )}
      {tab === "seo" && (
        <div className="cms-form">
          <FieldTree
            value={doc.seo}
            label="Search & social"
            onChange={(seo) =>
              setDoc({ ...doc, seo: seo as CmsDocument["seo"] })
            }
          />
          <article className="cms-search-preview">
            <h3>{doc.seo.title || doc.title}</h3>
            <p>
              /
              {doc.kind === "post"
                ? "blog/"
                : doc.kind === "work"
                  ? "works/"
                  : ""}
              {doc.slug}
            </p>
            <p>
              {doc.seo.description ||
                "Tambahkan deskripsi untuk preview pencarian."}
            </p>
          </article>
        </div>
      )}
      {tab === "history" && (
        <div className="cms-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Versi</th>
                <th>Waktu</th>
                <th>Perubahan</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((r) => (
                <tr key={r.version}>
                  <td>{r.version}</td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                  <td>
                    <details>
                      <summary>{r.reason}</summary>
                      <ul>
                        {changes(doc, r.document).map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Pulihkan revisi ini sebagai draft? Versi publik tidak berubah.",
                          )
                        )
                          void action("restore-revision", {
                            revision: r.version,
                          });
                      }}
                    >
                      Pulihkan ke draft
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "publish" && (
        <div className="cms-form">
          <h2>Status publikasi</h2>
          <p>
            {entry.published
              ? "Versi publik tersedia. Draft disimpan terpisah."
              : "Dokumen belum dipublikasikan."}
          </p>
          <label>
            Jadwalkan ({timezone})
            <input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
            />
          </label>
          <div className="cms-actions">
            <button
              disabled={!scheduled || dirty || state === "Saving"}
              onClick={() => {
                try {
                  void openReview(scheduledUtc(scheduled, timezone));
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Jadwalkan
            </button>
            {entry.scheduledAt && (
              <button onClick={() => void action("cancel-schedule")}>
                Batalkan jadwal
              </button>
            )}
            {entry.published && (
              <button
                onClick={() => {
                  if (confirm("Tarik konten ini dari website publik?"))
                    void action("unpublish");
                }}
              >
                Unpublish
              </button>
            )}
          </div>
        </div>
      )}
      {review && (
        <div className="cms-modal-backdrop">
          <section
            className="cms-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <h2 id="review-title">Review perubahan</h2>
            <p>
              Perubahan berikut akan diterapkan pada website publik.
              {pendingSchedule
                ? ` Dijadwalkan: ${new Date(pendingSchedule).toLocaleString("id-ID", { timeZone: timezone })} (${timezone})`
                : ""}
            </p>
            <details>
              <summary>Perbandingan dokumen lengkap</summary>
              <h3>Published</h3>
              <pre style={{ maxHeight: 240, overflow: "auto" }}>
                {JSON.stringify(entry.published, null, 2)}
              </pre>
              <h3>Draft</h3>
              <pre style={{ maxHeight: 240, overflow: "auto" }}>
                {JSON.stringify(doc, null, 2)}
              </pre>
            </details>
            <ul>
              {changes(entry.published, doc).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            {["appearance", "navigation", "profile", "settings"].includes(
              doc.kind,
            ) && <p>Pengaturan ini berdampak pada seluruh halaman website.</p>}
            <div className="cms-actions">
              <button onClick={() => setReview(false)}>Kembali</button>
              <button
                className="cms-primary"
                onClick={() =>
                  void action(
                    pendingSchedule ? "schedule" : "publish",
                    pendingSchedule ? { at: pendingSchedule } : {},
                  )
                }
              >
                {pendingSchedule ? "Konfirmasi jadwal" : "Publish sekarang"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
