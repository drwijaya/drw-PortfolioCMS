"use client";
/* Authenticated media and locally generated QR codes must bypass the public image optimizer. */
import { useDialogFocus } from "./useDialogFocus";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CmsDocument, EntryKind } from "@/lib/cms/model";
import { defaultDocument, emptyBlock } from "@/lib/cms/model";
import { AdminBrand } from "./AdminBrand";
import { ThemeToggle } from "@/components/sidebar/ThemeToggle";
import { DocumentEditor, type EntryRecord } from "./DocumentEditor";
import { MediaLibrary } from "./MediaLibrary";
import { api, authApi } from "./api";
const sections = [
  ["", "Dashboard"],
  ["works", "Works"],
  ["posts", "Posts"],
  ["pages", "Pages"],
  ["playground", "Playground"],
  ["media", "Media"],
  ["profile", "Profil"],
  ["appearance", "Appearance"],
  ["navigation", "Navigasi"],
  ["contact", "Contact"],
  ["integrations", "Integrations"],
  ["analytics", "Analytics"],
  ["settings", "Settings"],
  ["security", "Security"],
  ["tools", "Tools"],
] as const;
const kinds: Record<string, EntryKind> = {
  works: "work",
  posts: "post",
  pages: "page",
  playground: "playground",
  profile: "profile",
  appearance: "appearance",
  navigation: "navigation",
  settings: "settings",
  collections: "collection",
  patterns: "pattern",
};
export function AdminWorkspace({
  path,
  initialEntries,
  initialEditor,
  children,
}: {
  path: string[];
  initialEntries: EntryRecord[];
  initialEditor?: EntryRecord;
  children?: React.ReactNode;
}) {
  useDialogFocus();
  const router = useRouter(),
    section = path[0] ?? "";
  const [error, setError] = useState(""),
    [expired, setExpired] = useState(false),
    [reauth, setReauth] = useState<{
      resolve: () => void;
      reject: (e: Error) => void;
    } | null>(null),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState(""),
    [drawer, setDrawer] = useState(false);
  useEffect(() => {
    const expired = () => setExpired(true);
    const reauthenticate = (e: Event) => setReauth((e as CustomEvent).detail);
    const command = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("cms-session-expired", expired);
    window.addEventListener("cms-reauth", reauthenticate);
    window.addEventListener("keydown", command);
    let last = 0;
    const active = () => {
      if (Date.now() - last > 60000) {
        last = Date.now();
        void api("heartbeat", "POST", {}).catch(() => {});
      }
    };
    window.addEventListener("pointerdown", active);
    window.addEventListener("keydown", active);
    return () => {
      window.removeEventListener("cms-session-expired", expired);
      window.removeEventListener("cms-reauth", reauthenticate);
      window.removeEventListener("keydown", command);
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("keydown", active);
    };
  }, []);
  const title =
    sections.find(([id]) => id === section)?.[1] ??
    (section === "collections"
      ? "Off the Clock"
      : section === "patterns"
        ? "Patterns"
        : "Editor");
  return (
    <div className="cms-shell">
      <aside className={`cms-sidebar ${drawer ? "is-open" : ""}`}>
        <Link className="cms-wordmark" href="/admin">
          <AdminBrand/><span>studio / admin</span>
        </Link>
        <nav aria-label="Admin navigation">
          {sections.map(([id, label], i) => (
            <Link
              key={id}
              href={`/admin${id ? `/${id}` : ""}`}
              aria-current={section === id ? "page" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="cms-sidebar-foot">
          <Link href="/works" target="_blank" rel="noreferrer">
            Lihat website ↗
          </Link>
          <button
            onClick={() =>
              void authApi("sign-out", {})
                .then(() => router.push("/admin/login"))
                .catch((e) => setError(e.message))
            }
          >
            Keluar
          </button>
        </div>
      </aside>
      <main className="cms-main">
        <header className="cms-topbar">
          <button
            className="cms-mobile-menu"
            onClick={() => setDrawer(!drawer)}
            aria-expanded={drawer}
          >
            Menu
          </button>
          <span>
            Portfolio <span aria-hidden="true">/</span> {title}
          </span>
          <div className="cms-actions">
            <button onClick={() => setSearchOpen(true)}>
              Cari <kbd>⌘ K</kbd>
            </button>
            <ThemeToggle />
            <span className="cms-owner">Owner</span>
          </div>
        </header>
        {error && (
          <p role="alert" className="cms-alert">
            {error}
          </p>
        )}
        {initialEditor ? (
          <DocumentEditor
            key={initialEditor.id}
            initial={initialEditor}
            timezone={String(
              initialEntries.find((e) => e.kind === "settings")?.published?.data
                .timezone ?? "UTC",
            )}
          />
        ) : (
          <>
            <div className="cms-page-heading">
              <span className="cms-eyebrow">Your publishing space</span>
              <h1>{title}</h1>
            </div>
            {section === "" ? (
              <Dashboard entries={initialEntries} />
            ) : kinds[section] ? (
              <EntryList
                kind={kinds[section]}
                section={section}
                initial={initialEntries}
              />
            ) : section === "media" ? (
              <MediaLibrary />
            ) : section === "contact" ? (
              <Inbox />
            ) : section === "integrations" ? (
              <Integrations entries={initialEntries} />
            ) : section === "security" ? (
              <Security />
            ) : section === "tools" ? (
              <Tools />
            ) : section === "analytics" ? (
              children
            ) : null}
          </>
        )}
      </main>
      {expired && (
        <div className="cms-modal-backdrop">
          <section
            className="cms-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Session berakhir"
          >
            <h2>Session berakhir</h2>
            <p>
              Draft yang belum tersimpan tetap ada di tab ini. Login kembali
              melalui tab baru, lalu lanjutkan menyimpan.
            </p>
            <Link href="/admin/login" target="_blank" rel="noreferrer">
              Login kembali ↗
            </Link>
            <button
              onClick={() => {
                setExpired(false);
                router.refresh();
              }}
            >
              Saya sudah login
            </button>
          </section>
        </div>
      )}
      {reauth && (
        <div className="cms-modal-backdrop">
          <form
            className="cms-dialog"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("reauth", "POST", { password, code });
                reauth.resolve();
                setReauth(null);
                setPassword("");
                setCode("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Autentikasi ulang"
          >
            <h2>Konfirmasi identitas</h2>
            {error && (
              <p role="alert" className="cms-alert">
                {error}
              </p>
            )}
            <p>
              Tindakan ini memerlukan password dan kode authenticator terbaru.
            </p>
            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Kode authenticator
              <input
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
            <div className="cms-actions">
              <button
                type="button"
                onClick={() => {
                  reauth.reject(new Error("Tindakan dibatalkan"));
                  setReauth(null);
                }}
              >
                Batal
              </button>
              <button className="cms-primary">Verifikasi</button>
            </div>
          </form>
        </div>
      )}
      {searchOpen && (
        <div className="cms-modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Cari admin"
            className="cms-dialog"
          >
            <div className="cms-toolbar">
              <h2>Cari</h2>
              <button onClick={() => setSearchOpen(false)}>Tutup</button>
            </div>
            <input
              autoFocus
              aria-label="Cari konten atau pengaturan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Konten, pengaturan, halaman…"
            />
            <ul className="cms-search-results">
              {sections
                .filter(([, l]) =>
                  l.toLowerCase().includes(search.toLowerCase()),
                )
                .map(([id, l]) => (
                  <li key={id}>
                    <Link href={`/admin/${id}`}>{l}</Link>
                  </li>
                ))}
              {initialEntries
                .filter((e) =>
                  e.title.toLowerCase().includes(search.toLowerCase()),
                )
                .slice(0, 15)
                .map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/edit/${e.id}`}>
                      {e.title}
                      <small>{e.kind}</small>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
function Dashboard({ entries }: { entries: EntryRecord[] }) {
  const [data, setData] = useState<{
      unread: number;
      failed: number;
      recent: { id: string; action: string; createdAt: string }[];
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    void api<typeof data>("dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <div className="cms-stats">
        {[
          ["Works", entries.filter((e) => e.kind === "work").length],
          ["Artikel", entries.filter((e) => e.kind === "post").length],
          ["Draft", entries.filter((e) => !e.published).length],
          ["Pesan baru", data?.unread ?? "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="cms-dashboard-grid">
        <section>
          <div className="cms-section-heading">
            <h2>Terakhir dikerjakan</h2>
            <Link href="/admin/posts">Kelola konten →</Link>
          </div>
          <div className="cms-lines">
            {entries.slice(0, 8).map((e) => (
              <Link href={`/admin/edit/${e.id}`} key={e.id}>
                <span>{e.title}</span>
                <small>
                  {e.kind} · {e.published ? "Published" : "Draft"}
                </small>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2>Aktivitas</h2>
          {error && <p role="alert">{error}</p>}
          {data?.failed ? (
            <p className="cms-alert">
              {data.failed} pekerjaan perlu diperiksa di Tools.
            </p>
          ) : null}
          <ul className="cms-activity">
            {data?.recent.map((e) => (
              <li key={e.id}>
                <span>{e.action}</span>
                <time>{new Date(e.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ul>
          <Link href="/admin/tools">Status layanan & backup →</Link>
        </section>
      </div>
    </>
  );
}
function EntryList({
  kind,
  section,
  initial,
}: {
  kind: EntryKind;
  section: string;
  initial: EntryRecord[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial.filter((e) => e.kind === kind)),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [order, setOrder] = useState("updated"),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState(""),
    [showCreate, setShowCreate] = useState(false),
    [title, setTitle] = useState(""),
    [slug, setSlug] = useState(""),
    [columns, setColumns] = useState(true);
  const reload = () => api<EntryRecord[]>(`entries?kind=${kind}`).then(setRows);
  const filtered = rows
    .filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) &&
        (status === "trash" ? !!e.trashedAt : !e.trashedAt) &&
        (status === "published"
          ? !!e.published
          : status === "draft"
            ? !e.published
            : status === "scheduled"
              ? !!e.scheduledAt
              : true),
    )
    .sort((a, b) =>
      order === "title"
        ? a.title.localeCompare(b.title)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  async function create() {
    try {
      const templates = await api<CmsDocument[]>("templates");
      let doc = structuredClone(
        templates.find((t) => t.kind === kind) ?? defaultDocument(kind),
      );
      doc.title = title;
      doc.slug = slug;
      if (kind === "post" || kind === "page" || kind === "pattern") {
        doc = {
          ...defaultDocument(kind),
          title,
          slug,
          blocks: [emptyBlock("text")],
        };
        if (kind === "page") doc.data = { template: "standard", visible: true };
      }
      const e = await api<EntryRecord>("entries", "POST", doc);
      router.push(`/admin/edit/${e.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function act(e: EntryRecord, action: string) {
    try {
      if (
        !confirm(
          `${action === "trash" ? "Pindahkan ke trash" : action === "delete" ? "Hapus permanen" : "Pulihkan"} “${e.title}”?`,
        )
      )
        return;
      await api(`entries/${e.id}/action`, "POST", {
        action,
        version: e.version,
      });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="cms-toolbar">
        <div className="cms-actions">
          <input
            aria-label="Cari konten"
            placeholder="Cari konten…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            {["all", "draft", "published", "scheduled", "trash"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Urutkan"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          >
            <option value="updated">Terakhir diubah</option>
            <option value="title">Judul A–Z</option>
          </select>
          <button onClick={() => setColumns(!columns)}>Kolom</button>
        </div>
        <div className="cms-actions">
          {kind === "playground" && (
            <Link href="/admin/collections">Off the Clock →</Link>
          )}
          {["work", "post", "page", "playground", "pattern"].includes(kind) && (
            <button className="cms-primary" onClick={() => setShowCreate(true)}>
              + Tambah baru
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="cms-alert" role="alert">
          {error}
        </p>
      )}
      {selected.length > 0 && (
        <div className="cms-selection">
          <span>{selected.length} dipilih</span>
          <button
            onClick={async () => {
              if (!confirm(`Pindahkan ${selected.length} konten ke trash?`))
                return;
              try {
                for (const id of selected) {
                  const e = rows.find((r) => r.id === id)!;
                  await api(`entries/${id}/action`, "POST", {
                    action: "trash",
                    version: e.version,
                  });
                }
                setSelected([]);
                await reload();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Pindah ke trash
          </button>
        </div>
      )}
      <div className="cms-table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  aria-label="Pilih semua hasil"
                  type="checkbox"
                  checked={
                    filtered.length > 0 &&
                    filtered.every((e) => selected.includes(e.id))
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? filtered.map((e) => e.id) : [],
                    )
                  }
                />
              </th>
              <th>Judul</th>
              <th>Status</th>
              {columns && (
                <>
                  <th>Revisi</th>
                  <th>Diubah</th>
                </>
              )}
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(page * 20, page * 20 + 20).map((e) => (
              <tr key={e.id}>
                <td>
                  <input
                    aria-label={`Pilih ${e.title}`}
                    type="checkbox"
                    checked={selected.includes(e.id)}
                    onChange={(v) =>
                      setSelected(
                        v.target.checked
                          ? [...selected, e.id]
                          : selected.filter((id) => id !== e.id),
                      )
                    }
                  />
                </td>
                <td>
                  <Link className="cms-title-link" href={`/admin/edit/${e.id}`}>
                    {e.title}
                  </Link>
                  <small>/{e.slug}</small>
                </td>
                <td>
                  <span className="cms-badge">
                    {e.trashedAt
                      ? "Trash"
                      : e.scheduledAt
                        ? "Scheduled"
                        : e.published
                          ? "Published"
                          : "Draft"}
                  </span>
                  {e.published && e.version !== e.publishedVersion && (
                    <small>Ada perubahan draft</small>
                  )}
                </td>
                {columns && (
                  <>
                    <td>{e.version}</td>
                    <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
                  </>
                )}
                <td>
                  <div className="cms-row-actions">
                    {e.trashedAt ? (
                      <>
                        <button onClick={() => void act(e, "restore")}>
                          Pulihkan
                        </button>
                        <button onClick={() => void act(e, "delete")}>
                          Hapus permanen
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href={`/admin/edit/${e.id}`}>Edit</Link>
                        {[
                          "work",
                          "post",
                          "page",
                          "playground",
                          "pattern",
                        ].includes(kind) && (
                          <>
                            <button
                              onClick={() =>
                                void api<EntryRecord>(
                                  `entries/${e.id}/duplicate`,
                                  "POST",
                                  {},
                                )
                                  .then((v) =>
                                    router.push(`/admin/edit/${v.id}`),
                                  )
                                  .catch((e) => setError(e.message))
                              }
                            >
                              Duplikat
                            </button>
                            <button onClick={() => void act(e, "trash")}>
                              Trash
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="cms-empty">
            <h2>Belum ada konten</h2>
            <p>Tambahkan konten baru atau ubah filter pencarian.</p>
          </div>
        )}
      </div>
      <div className="cms-pagination">
        <span>{filtered.length} item</span>
        <button disabled={page === 0} onClick={() => setPage(page - 1)}>
          ← Sebelumnya
        </button>
        <span>{page + 1}</span>
        <button
          disabled={(page + 1) * 20 >= filtered.length}
          onClick={() => setPage(page + 1)}
        >
          Berikutnya →
        </button>
      </div>
      {showCreate && (
        <div className="cms-modal-backdrop">
          <form
            className="cms-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Tambah konten"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <h2>Tambah {section}</h2>
            <label>
              Judul
              <input
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  );
                }}
              />
            </label>
            <label>
              Slug
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </label>
            <p>
              Konten dibuat sebagai draft. Template awal memakai komponen
              website Anda.
            </p>
            <div className="cms-actions">
              <button type="button" onClick={() => setShowCreate(false)}>
                Batal
              </button>
              <button className="cms-primary">Buat draft</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
interface Message {
  id: string;
  name: string;
  email: string;
  body: string;
  status: string;
  notes: string;
  createdAt: string;
}
interface Delivery {
  id: string;
  type: string;
  status: string;
  attempts: number;
  error: string | null;
  updatedAt: string;
}
function MessageDeliveries({ id }: { id: string }) {
  const [rows, setRows] = useState<Delivery[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void api<Delivery[]>(`messages/${id}/deliveries`)
      .then((value) => {
        if (active) setRows(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <section>
      <h3>Riwayat notifikasi email</h3>
      {error && <p role="alert">{error}</p>}
      {!rows.length && !error && <p>Belum ada catatan pengiriman.</p>}
      <ul className="cms-lines">
        {rows.map((row) => (
          <li key={row.id}>
            <strong>
              {row.type === "contact-owner"
                ? "Notifikasi owner"
                : "Receipt pengirim"}{" "}
              · {row.status}
            </strong>
            <p>
              {row.attempts} percobaan ·{" "}
              {new Date(row.updatedAt).toLocaleString()}
            </p>
            {row.error && <p>{row.error}</p>}
            {row.status === "unknown" && (
              <p>
                Hasil pengiriman belum pasti. Periksa provider sebelum mengirim
                ulang melalui Tools.
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
function Inbox() {
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState<Message[]>([]),
    [selected, setSelected] = useState<Message | null>(null),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  const reload = useCallback(
    () => api<Message[]>("messages").then(setItems),
    [],
  );
  useEffect(() => {
    void reload().catch((e) => setError(e.message));
  }, [reload]);
  return (
    <>
      <div className="cms-toolbar">
        <input
          aria-label="Cari pesan"
          placeholder="Cari pesan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter status pesan"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Semua status</option>
          {["unread", "read", "archived", "spam", "trash"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Link href="/admin/integrations">Pengaturan pengiriman →</Link>
      </div>
      {error && (
        <p role="alert" className="cms-alert">
          {error}
        </p>
      )}
      <div className="cms-inbox">
        <section className="cms-lines">
          {items
            .filter(
              (m) =>
                (!statusFilter || m.status === statusFilter) &&
                `${m.name} ${m.email} ${m.body} ${m.status}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
            )
            .map((m) => (
              <button key={m.id} onClick={() => setSelected(m)}>
                <strong>{m.name}</strong>
                <span>{m.body.slice(0, 120)}</span>
                <small>
                  {m.status} · {new Date(m.createdAt).toLocaleDateString()}
                </small>
              </button>
            ))}
          {!items.length && <p>Belum ada pesan masuk.</p>}
        </section>
        {selected ? (
          <section className="cms-message">
            <h2>{selected.name}</h2>
            <Link href={`mailto:${selected.email}`}>{selected.email}</Link>
            <p className="cms-message-body">{selected.body}</p>
            <label>
              Status
              <select
                value={selected.status}
                onChange={(e) =>
                  setSelected({ ...selected, status: e.target.value })
                }
              >
                {["unread", "read", "archived", "spam", "trash"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Catatan internal
              <textarea
                value={selected.notes}
                onChange={(e) =>
                  setSelected({ ...selected, notes: e.target.value })
                }
              />
            </label>
            <MessageDeliveries key={selected.id} id={selected.id} />
            <div className="cms-actions">
              <button
                onClick={async () => {
                  try {
                    await api(`messages/${selected.id}`, "PUT", {
                      status: selected.status,
                      notes: selected.notes,
                    });
                    await reload();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Simpan
              </button>
              <Link
                href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: Portfolio contact")}`}
              >
                Balas melalui email ↗
              </Link>
            </div>
          </section>
        ) : (
          <section className="cms-empty">
            <p>Pilih pesan untuk membaca detail.</p>
          </section>
        )}
      </div>
    </>
  );
}
function Integrations({ entries }: { entries: EntryRecord[] }) {
  const settings = entries.find((e) => e.kind === "settings");
  const [secret, setSecret] = useState(""),
    [key, setKey] = useState("smtp-password"),
    [status, setStatus] = useState("");
  return (
    <div className="cms-form">
      <h2>Contact delivery</h2>
      <p>
        Konfigurasi aktif:{" "}
        {String(
          (settings?.published?.data.contact as Record<string, unknown>)
            ?.provider ?? "SMTP",
        )}
        . Kredensial disimpan terenkripsi dan tidak dapat ditampilkan kembali.
      </p>
      {settings && (
        <Link href={`/admin/edit/${settings.id}`}>
          Edit provider, penerima, template, dan rate limit →
        </Link>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("secrets", "PUT", { key, value: secret });
            setSecret("");
            setStatus(
              "Credential draft tersimpan. Test koneksi, lalu publish Settings untuk mengaktifkan.",
            );
          } catch (e) {
            setStatus((e as Error).message);
          }
        }}
      >
        <label>
          Credential
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            <option value="smtp-password">SMTP password</option>
            <option value="resend-key">Resend API key</option>
          </select>
        </label>
        <label>
          Nilai baru
          <input
            type="password"
            autoComplete="new-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required
          />
        </label>
        <button>Ganti secret</button>
      </form>
      <div className="cms-actions">
        {[false, true].map((testEmail) => (
          <button
            key={String(testEmail)}
            onClick={async () => {
              if (
                testEmail &&
                !confirm(
                  `Kirim test email ke ${(settings?.draft.data.contact as Record<string, unknown>)?.to || "penerima konfigurasi"}?`,
                )
              )
                return;
              try {
                await api("integrations", "POST", {
                  settings: settings?.draft.data.contact,
                  testEmail,
                });
                setStatus(
                  testEmail ? "Test email terkirim" : "Koneksi berhasil",
                );
              } catch (e) {
                setStatus((e as Error).message);
              }
            }}
          >
            {testEmail ? "Kirim test email" : "Test connection"}
          </button>
        ))}
      </div>
      <p role="status">{status}</p>
    </div>
  );
}
function Security() {
  const router = useRouter();
  const [codes, setCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<
      { id: string; token: string; userAgent?: string; createdAt: string }[]
    >([]),
    [password, setPassword] = useState(""),
    [nextPassword, setNextPassword] = useState(""),
    [status, setStatus] = useState("");
  useEffect(() => {
    void authApi<typeof sessions>("list-sessions")
      .then(setSessions)
      .catch((e) => setStatus(e.message));
  }, []);
  return (
    <div className="cms-form">
      <h2>Akun owner</h2>
      <p>
        Password + authenticator wajib. Registrasi publik dan trusted-device
        bypass dinonaktifkan.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api("heartbeat", "POST", {});
            await authApi("change-password", {
              currentPassword: password,
              newPassword: nextPassword,
              revokeOtherSessions: true,
            });
            setPassword("");
            setNextPassword("");
            setStatus("Password berhasil diganti");
          } catch (e) {
            setStatus((e as Error).message);
          }
        }}
      >
        <label>
          Password saat ini
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Password baru
          <input
            type="password"
            minLength={16}
            autoComplete="new-password"
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
            required
          />
        </label>
        <button>Ganti password</button>
      </form>
      <h2>Authenticator & recovery</h2>
      <div className="cms-actions">
        <button
          onClick={async () => {
            if (
              !confirm(
                "Ganti authenticator dan cabut session lain? Anda harus menyelesaikan enrollment baru.",
              )
            )
              return;
            try {
              await api("security/rotate-authenticator", "POST", {});
              router.push("/admin/setup");
              router.refresh();
            } catch (e) {
              setStatus((e as Error).message);
            }
          }}
        >
          Ganti authenticator
        </button>
        <button
          onClick={async () => {
            try {
              const result = await authApi<{ backupCodes: string[] }>(
                "two-factor/generate-backup-codes",
                { password },
              );
              setCodes(result.backupCodes);
              setStatus(
                "Recovery codes lama tidak berlaku. Simpan kode baru ini.",
              );
            } catch (e) {
              setStatus((e as Error).message);
            }
          }}
        >
          Buat recovery codes baru
        </button>
      </div>
      {codes.length > 0 && (
        <>
          <p>
            Kode hanya ditampilkan pada sesi ini. Masing-masing berlaku sekali.
          </p>
          <pre>{codes.join("\n")}</pre>
          <button onClick={() => setCodes([])}>Saya sudah menyimpan</button>
        </>
      )}
      <h2>Session aktif</h2>
      <button
        onClick={() =>
          void authApi("revoke-sessions", {})
            .then(() => {
              router.push("/admin/login");
              router.refresh();
            })
            .catch((e) => setStatus(e.message))
        }
      >
        Cabut seluruh session
      </button>
      {sessions.map((s) => (
        <div className="cms-session" key={s.id}>
          <p>{s.userAgent || "Perangkat"}</p>
          <small>{new Date(s.createdAt).toLocaleString()}</small>
          <button
            onClick={() =>
              void authApi("revoke-session", { token: s.token })
                .then(() => setSessions(sessions.filter((x) => x.id !== s.id)))
                .catch((e) => setStatus(e.message))
            }
          >
            Cabut session
          </button>
        </div>
      ))}
      <p role="status">{status}</p>
    </div>
  );
}
function Tools() {
  const [data, setData] = useState<unknown>(null),
    [tab, setTab] = useState("diagnostics"),
    [status, setStatus] = useState(""),
    [importData, setImportData] = useState<unknown>(null);
  const [source, setSource] = useState(""),
    [destination, setDestination] = useState("");
  useEffect(() => {
    void api(tab)
      .then(setData)
      .catch((e) => setStatus(e.message));
  }, [tab]);
  return (
    <>
      <nav className="cms-tabs">
        {[
          ["diagnostics", "Status sistem"],
          ["audit", "Audit log"],
          ["jobs", "Pengiriman & jobs"],
          ["redirects", "Redirects"],
          ["backups", "Backups"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="cms-form">
        <div className="cms-actions">
          <button
            onClick={() =>
              void api("backups", "POST", {})
                .then(() => setStatus("Backup masuk antrean worker"))
                .catch((e) => setStatus(e.message))
            }
          >
            Buat backup terenkripsi
          </button>
          <Link href="/api/admin/export" download="portfolio-content.json">
            Export konten
          </Link>
          <button
            onClick={() =>
              void api("cache", "POST", {})
                .then(() => setStatus("Cache diperbarui"))
                .catch((e) => setStatus(e.message))
            }
          >
            Perbarui cache
          </button>
          <Link href="/admin/patterns">Reusable patterns →</Link>
          <label className="cms-upload-button">
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={async (e) => {
                try {
                  const file = e.target.files?.[0];
                  if (file) {
                    const value = JSON.parse(await file.text());
                    setImportData(value);
                    const result = await api("import", "POST", {
                      ...value,
                      dryRun: true,
                    });
                    setStatus(JSON.stringify(result));
                  }
                } catch (e) {
                  setStatus((e as Error).message);
                }
              }}
            />
          </label>
          {importData !== null && (
            <button
              onClick={async () => {
                if (!confirm("Import konten baru sebagai draft?")) return;
                try {
                  const result = await api("import", "POST", {
                    ...(importData as object),
                    dryRun: false,
                  });
                  setStatus(JSON.stringify(result));
                  setImportData(null);
                } catch (e) {
                  setStatus((e as Error).message);
                }
              }}
            >
              Terapkan import
            </button>
          )}
        </div>
        <p role="status">{status}</p>
        {tab === "redirects" && (
          <form
            className="cms-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("redirects", "POST", { source, destination });
                setData(await api("redirects"));
                setSource("");
                setDestination("");
                setStatus("Redirect tersimpan");
              } catch (e) {
                setStatus((e as Error).message);
              }
            }}
          >
            <label>
              URL lama
              <input
                required
                placeholder="/halaman-lama"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
            <label>
              URL tujuan
              <input
                required
                placeholder="/halaman-baru"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </label>
            <button>Simpan redirect permanen</button>
          </form>
        )}
        {Array.isArray(data) ? (
          <div className="cms-table-wrap">
            <table>
              <thead>
                <tr>
                  {Object.keys(data[0] ?? {}).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                  {tab === "jobs" && <th>Tindakan</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row as Record<string, unknown>).map(
                      (v, j) => (
                        <td key={j}>
                          {typeof v === "object"
                            ? JSON.stringify(v)
                            : String(v ?? "—")}
                        </td>
                      ),
                    )}
                    {tab === "jobs" && (
                      <td>
                        {["failed", "unknown"].includes(String(row.status)) && (
                          <button
                            onClick={async () => {
                              const uncertain = row.status === "unknown";
                              if (
                                !confirm(
                                  uncertain
                                    ? "Hasil pengiriman tidak pasti. Sudah periksa provider dan tetap ingin mengirim ulang?"
                                    : "Coba jalankan kembali job ini?",
                                )
                              )
                                return;
                              try {
                                await api(`jobs/${row.id}/retry`, "POST", {
                                  confirmUnknown: uncertain,
                                });
                                setData(await api("jobs"));
                              } catch (e) {
                                setStatus((e as Error).message);
                              }
                            }}
                          >
                            Coba ulang
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.length && <p>Belum ada data.</p>}
          </div>
        ) : (
          <dl className="cms-diagnostics">
            {data && typeof data === "object" ? (
              Object.entries(data).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </dd>
                </div>
              ))
            ) : (
              <p>Memuat…</p>
            )}
          </dl>
        )}
        <p className="cms-muted">
          Backup/restore dijalankan melalui worker dan CLI lokal. Master
          encryption key disimpan terpisah dari export konten.
        </p>
      </div>
    </>
  );
}
