"use client";
/* Authenticated media and locally generated QR codes must bypass the public image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useState, useId, useEffect } from "react";
import { api } from "./api";
const LABELS: Record<string, string> = {
  html: "Isi teks",
  src: "Gambar / file",
  alt: "Teks alternatif",
  caption: "Caption",
  title: "Judul",
  body: "Isi",
  description: "Deskripsi",
  label: "Label",
  note: "Catatan",
  entries: "Item",
  fullName: "Nama lengkap",
  shortBio: "Bio singkat",
  photo: "Foto",
  cvUrl: "Link CV",
  from: "Email pengirim",
  to: "Email penerima",
  senderName: "Nama pengirim",
  receipt: "Kirim konfirmasi kepada pengirim",
  retentionDays: "Retensi pesan (hari)",
  portfolioRank: "Urutan portfolio",
  playgroundRank: "Urutan playground",
  artwork: "Cover",
  artworkAlt: "Teks alternatif cover",
  artworkFit: "Framing cover",
  artworkPosition: "Posisi cover",
  intro: "Pengantar",
  entryId:"Slug synced pattern",
  takeaway: "Kesimpulan",
};
const OPTIONS: Record<string, string[]> = {
  profileMode:["full","identity"],
  layout: [
    "context-stack",
    "narrative-split",
    "paired-evidence",
    "sequence-gallery",
    "data-ledger",
    "signal-band",
  ],
  tone: ["plain", "soft", "accent", "dark"],
  mediaWidth: ["compact", "medium", "full"],
  interaction: ["none", "comparison", "experiment"],
  presentationType: ["case-study", "project", "design-portfolio"],
  categoryColor: ["sage", "dusty-blue", "mustard", "terracotta"],
  provider: ["smtp", "resend"],
  artworkFit: ["cover", "contain"],
  destinationType: ["internal", "external"],
  location: ["main", "footer"],
  template: ["existing", "standard"],
  variant: ["plain", "numbered"],
};
export function FieldTree({
  value,
  onChange,
  label = "",
  field = "",
  locked = false,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  label?: string;
  field?: string;
  locked?: boolean;
}) {
  const id = useId(),
    name = label || LABELS[field] || field.replace(/([A-Z])/g, " $1");
  const [mediaOpen, setMediaOpen] = useState(false);
  if (Array.isArray(value))
    return (
      <fieldset className="cms-fieldset">
        <legend>{name}</legend>
        {value.map((v, i) => (
          <div className="cms-array-row" key={i}>
            <FieldTree
              value={v}
              onChange={(next) =>
                onChange(value.map((old, j) => (j === i ? next : old)))
              }
              label={`${name} ${i + 1}`}
              locked={locked}
            />
            {!locked && (
              <div className="cms-row-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  aria-label={`Naikkan ${name} ${i + 1}`}
                  onClick={() => {
                    const next = [...value];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    onChange(next);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Hapus ${name} ${i + 1}`}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
        {!locked && (
          <button
            type="button"
            onClick={() =>
              onChange([
                ...value,
                value.length ? structuredClone(value[value.length - 1]) : "",
              ])
            }
          >
            + Tambah {name}
          </button>
        )}
      </fieldset>
    );
  if (value && typeof value === "object")
    return (
      <fieldset className="cms-fieldset">
        <legend>{name}</legend>
        {Object.entries(value)
          .filter(([key]) => key !== "sections")
          .map(([key, v]) => (
            <FieldTree
              key={key}
              field={key}
              value={v}
              locked={locked && (key === "id" || Array.isArray(v))}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          ))}
      </fieldset>
    );
  if (typeof value === "boolean")
    return (
      <label className="cms-check">
        <input
          type="checkbox"
          checked={value}
          disabled={locked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {name}
      </label>
    );
  if(field==="entryId")return <PatternField value={String(value??"")} onChange={onChange}/>;
  const isMedia = [
    "src",
    "artwork",
    "thumb",
    "hero",
    "photo",
    "sidebarPhoto",
    "sidebarMark",
    "cvUrl",
    "cover",
    "image",
    "ogImage",
    "favicon",
    "preview",
    "logo",
  ].includes(field);
  return (
    <div className="cms-field">
      <label htmlFor={id}>{name}</label>
      {OPTIONS[field] ? (
        <select
          id={id}
          disabled={locked}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          {!OPTIONS[field].includes(String(value ?? "")) && (
            <option value={String(value ?? "")}>{String(value ?? "—")}</option>
          )}
          {OPTIONS[field].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : typeof value === "number" ? (
        <input
          id={id}
          type="number"
          value={value}
          disabled={locked}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      ) : [
          "body",
          "html",
          "description",
          "bio",
          "shortBio",
          "note",
          "intro",
          "lead",
          "takeaway",
          "summary",
          "excerpt",
        ].includes(field) || String(value ?? "").length > 140 ? (
        <textarea
          id={id}
          rows={4}
          value={String(value ?? "")}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          value={String(value ?? "")}
          disabled={locked}
          onChange={(e) => onChange(e.target.value)}
        />
      )}{" "}
      {isMedia && (
        <button type="button" onClick={() => setMediaOpen(true)}>
          Pilih dari media
        </button>
      )}
      {mediaOpen && (
        <MediaPicker
          onSelect={(src) => {
            onChange(src);
            setMediaOpen(false);
          }}
          onClose={() => setMediaOpen(false)}
        />
      )}
    </div>
  );
}
export function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (src: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<
      { id: string; name: string; mime: string }[]
    >([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="cms-modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Pilih media"
        className="cms-dialog"
      >
        <div className="cms-toolbar">
          <h2>Media library</h2>
          <button type="button" onClick={onClose}>
            Tutup
          </button>
        </div>
        {!loaded && (
          <button
            type="button"
            onClick={() =>
              api<typeof items>("media")
                .then((v) => {
                  setItems(v);
                  setLoaded(true);
                })
                .catch((e) => setError(e.message))
            }
          >
            Muat media
          </button>
        )}
        <p role="status">{error}</p>
        <div className="cms-media-grid">
          {items.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => onSelect(`/media/${m.id}/original`)}
            >
              {m.mime.startsWith("image/") && (
                <img src={`/media/${m.id}/w320.webp`} alt="" />
              )}
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function PatternField({value,onChange}:{value:string;onChange:(value:string)=>void}){const [items,setItems]=useState<{id:string;title:string;published:unknown}[]>([]),[error,setError]=useState('');useEffect(()=>{void api<typeof items>('entries?kind=pattern').then(setItems).catch(e=>setError(e.message))},[]);return <label>Synced pattern<select value={value} onChange={e=>onChange(e.target.value)}><option value="">Pilih pattern published…</option>{value&&!items.some(i=>i.id===value)&&<option value={value}>{value}</option>}{items.filter(i=>i.published).map(i=><option key={i.id} value={i.id}>{i.title}</option>)}</select>{error&&<span role="alert">{error}</span>}</label>}
