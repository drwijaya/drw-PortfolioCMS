"use client";
/* Authenticated media and locally generated QR codes must bypass the public image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useState, useRef } from "react";
import {
  registerBlockType,
  getBlockType,
  createBlock,
  setDefaultBlockName,
  type Block,
} from "@wordpress/blocks";
import {
  BlockEditorProvider,
  BlockList,
  BlockTools,
  WritingFlow,
  ObserveTyping,
  BlockInspector,
  Inserter,
  __experimentalListView as ListView,
  InspectorControls,
  RichText,
  InnerBlocks,
  useBlockProps,
} from "@wordpress/block-editor";
import { Popover } from "@wordpress/components";
import { BLOCK_NAMES, emptyBlock, type CmsBlock } from "@/lib/cms/model";
import { FieldTree } from "./Fields";
import "@wordpress/components/build-style/style.css";
import "@wordpress/block-editor/build-style/style.css";
import "@wordpress/format-library";
import "./gutenberg.css";
const titles: Record<string, string> = {
  text: "Paragraf",
  lead: "Lead",
  figure: "Gambar",
  section: "Section",
  beat: "Layout cerita",
  quote: "Kutipan",
  list: "Daftar",
  gallery: "Galeri",
  stats: "Statistik",
  metrics: "Metrik",
  cards: "Kartu",
  table: "Tabel",
  pipeline: "Tahapan",
  compare: "Perbandingan",
  personas: "Persona",
  callout: "Callout",
  tags: "Tags",
  heading: "Heading",
  button: "Tombol",
  separator: "Pemisah",
  group: "Group",
  columns: "Kolom",
  profile: "Profil",
  experience: "Pengalaman",
  education: "Pendidikan",
  certifications: "Sertifikasi",
  skills: "Skills & tools",
  works: "Daftar works",
  playground: "Daftar playground",
  blog: "Daftar artikel",
  contact: "Contact",
  video: "Video",
  audio: "Audio",
  file: "File",
  pattern: "Synced pattern",
};
const containers = new Set(["section", "beat", "group", "columns"]);
function register() {
  setDefaultBlockName("portfolio/text");
  for (const type of BLOCK_NAMES) {
    const name = `portfolio/${type}`;
    if (getBlockType(name)) continue;
    registerBlockType(name, {
      name,
      apiVersion: 3,
      title: titles[type] ?? type,
      category: "text",
      icon: "edit",
      attributes: {
        cmsId: { type: "string" },
        lock:{type:"object"},
        payload: { type: "object", default: emptyBlock(type).attributes },
      },
      supports: {
        html: false,
        customClassName: false,
        color: { text: false, background: false },
        typography: {},
        spacing: {},
      },
      edit: function PortfolioBlock({ attributes, setAttributes }) {
        const props = useBlockProps({
          className: `cms-block cms-block-${type}`,
        });
        const data = (attributes.payload ?? {}) as Record<string, unknown>;
        return (
          <div {...props}>
            <InspectorControls>
              <div className="cms-block-settings"><label className="cms-check"><input type="checkbox" checked={data.hidden!==true} onChange={e=>setAttributes({payload:{...data,hidden:!e.target.checked}})}/>Tampilkan blok</label>
                <FieldTree
                  value={data}
                  label={titles[type]}
                  onChange={(next) => setAttributes({ payload: next })}
                />
              </div>
            </InspectorControls>
            <div className="cms-block-label">{titles[type]}</div>
            {type === "text" || type === "lead" ? (
              <RichText
                tagName="p"
                value={String(data.html ?? "")}
                onChange={(html) =>
                  setAttributes({ payload: { ...data, html } })
                }
                placeholder="Mulai menulis…"
                allowedFormats={["core/bold", "core/italic", "core/link"]}
              />
            ) : type === "heading" ? (
              <RichText
                tagName={`h${data.level ?? 2}`}
                value={String(data.text ?? "")}
                onChange={(text) =>
                  setAttributes({ payload: { ...data, text } })
                }
                placeholder="Heading"
              />
            ) : containers.has(type) ? (
              <>
                <div className="cms-block-summary">
                  {String(
                    data.heading ??
                      data.label ??
                      data.intro ??
                      "Susun blok di sini",
                  )}
                </div>
                <InnerBlocks
                  allowedBlocks={
                    type === "section"
                      ? ["portfolio/beat"]
                      : BLOCK_NAMES.filter(
                          (t) =>
                            (t !== "section" && t !== "beat") ||
                            type !== "beat",
                        ).map((t) => `portfolio/${t}`)
                  }
                />
              </>
            ) : type === "figure" ? (
              <>
                {data.src ? (
                  <img src={String(data.src)} alt={String(data.alt ?? "")} />
                ) : (
                  <p>Pilih gambar melalui pengaturan blok.</p>
                )}
                <p>{String(data.caption ?? "")}</p>
              </>
            ) : (
              <div className="cms-block-summary">
                <FieldTree
                  value={data}
                  onChange={(next) => setAttributes({ payload: next })}
                />
              </div>
            )}
          </div>
        );
      },
      save: () => null,
    });
  }
}
function toWP(nodes: CmsBlock[]): Block[] {
  return nodes.map((n) =>
    createBlock(
      `portfolio/${n.type}`,
      { cmsId: n.id, payload: n.attributes,lock:n.lock },
      toWP(n.children),
    ),
  );
}
function fromWP(nodes: Block[], seen = new Set<string>()): CmsBlock[] {
  return nodes.map((n) => {
    let id = String(n.attributes.cmsId ?? "");
    if (!id || seen.has(id)) id = crypto.randomUUID();
    seen.add(id);
    return {
      id,
      type: n.name.replace("portfolio/", ""),
      attributes: (n.attributes.payload as Record<string, unknown>) ?? {},
      children: fromWP(n.innerBlocks, seen),
      ...(n.attributes.lock?{lock:n.attributes.lock as {move:boolean;remove:boolean}}:{}),
    };
  });
}
export default function Gutenberg({
  blocks,
  onChange,
}: {
  blocks: CmsBlock[];
  onChange: (blocks: CmsBlock[]) => void;
}) {
  register();
  const [value, setValue] = useState(() => toWP(blocks));
  const history = useRef<Block[][]>([]),
    future = useRef<Block[][]>([]);
  function update(next: Block[]) {
    const parsed = fromWP(next);
    if (JSON.stringify(parsed) === JSON.stringify(fromWP(value))) return;
    const withIds = (nodes: Block[], data: CmsBlock[]): Block[] =>
      nodes.map((n, i) => ({
        ...n,
        attributes: { ...n.attributes, cmsId: data[i].id },
        innerBlocks: withIds(n.innerBlocks, data[i].children),
      }));
    next = withIds(next, parsed);
    history.current.push(value);
    if (history.current.length > 100) history.current.shift();
    future.current = [];
    setValue(next);
    onChange(fromWP(next));
  }
  function undo() {
    const next = history.current.pop();
    if (next) {
      future.current.push(value);
      setValue(next);
      onChange(fromWP(next));
    }
  }
  function redo() {
    const next = future.current.pop();
    if (next) {
      history.current.push(value);
      setValue(next);
      onChange(fromWP(next));
    }
  }
  return (
    <div className="cms-gutenberg">
      <BlockEditorProvider
        value={value}
        onInput={update}
        onChange={update}
        settings={{
          allowedBlockTypes: BLOCK_NAMES.map((t) => `portfolio/${t}`),
          hasFixedToolbar: true,
          canLockBlocks: true,
          __experimentalCanUserUseUnfilteredHTML: false,
          disableCustomColors: true,
          disableCustomFontSizes: true,
        }}
      >
        <div className="cms-editor-actions">
          <Inserter />
          <button type="button" onClick={undo}>
            Undo
          </button>
          <button type="button" onClick={redo}>
            Redo
          </button>
        </div>
        <div className="cms-editor-grid">
          <aside aria-label="Struktur dokumen">
            <h3>Outline</h3>
            <ListView />
          </aside>
          <div className="cms-writing">
            <BlockTools>
              <WritingFlow>
                <ObserveTyping>
                  <BlockList />
                </ObserveTyping>
              </WritingFlow>
            </BlockTools>
          </div>
          <aside aria-label="Pengaturan blok">
            <h3>Blok</h3>
            <BlockInspector />
          </aside>
        </div>
        <Popover.Slot />
      </BlockEditorProvider>
    </div>
  );
}
