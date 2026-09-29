"use client";
import { useState, useEffect } from "react";
import { api } from "./api";
import { originalPalette } from "@/lib/cms/palette-defaults";
import { paletteIssues, paletteCss } from "@/lib/cms/palette";
export function PalettePanel({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const [mode, setMode] = useState<"light" | "dark">("light"),
    [preview, setPreview] = useState(false);
  const [presets, setPresets] = useState<
      { key: string; value: { name: string; data: Record<string, unknown> } }[]
    >([]),
    [presetName, setPresetName] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    void api<typeof presets>("presets")
      .then(setPresets)
      .catch((e) => setMessage(e.message));
  }, []);
  const colors = {
    ...originalPalette[mode],
    ...((data[mode] as Record<string, string>) ?? {}),
  };
  const issues = paletteIssues(data);
  return (
    <div className="cms-palette">
      <div className="cms-toolbar">
        <label>
          Nama preset
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
        </label>
        <button
          disabled={!presetName.trim()}
          onClick={async () => {
            try {
              await api("presets", "POST", { name: presetName, data });
              setPresets(await api("presets"));
              setMessage("Preset tersimpan");
              setPresetName("");
            } catch (e) {
              setMessage((e as Error).message);
            }
          }}
        >
          Simpan sebagai preset baru
        </button>
        <label>
          Preset tersimpan
          <select
            value=""
            onChange={(e) => {
              const selected = presets.find((p) => p.key === e.target.value);
              if (selected) onChange(structuredClone(selected.value.data));
            }}
          >
            <option value="">Pilih preset…</option>
            {presets.map((p) => (
              <option key={p.key} value={p.key}>
                {p.value.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">{message}</p>
      <div className="cms-toolbar">
        <div className="cms-tabs">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="cms-actions">
          <button onClick={() => setPreview(!preview)}>
            {preview ? "Tutup preview warna" : "Preview warna di admin"}
          </button>
          <button
            onClick={() => {
              if (confirm("Kembalikan draft palette ke warna asli?"))
                onChange(structuredClone(originalPalette));
            }}
          >
            Reset asli
          </button>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "portfolio-palette.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export preset
          </button>
          <label className="cms-upload-button">
            Import preset
            <input
              type="file"
              accept="application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const value = JSON.parse(await file.text());
                    const errors = paletteIssues(value);
                    if (errors.length) throw new Error(errors.join("\n"));
                    onChange(value);
                  } catch (error) {
                    alert((error as Error).message);
                  }
                }
              }}
            />
          </label>
        </div>
      </div>
      {preview && <style>{paletteCss(data)}</style>}
      <p className="cms-muted">
        Perubahan ini tetap berupa draft sampai Anda melakukan preview, review,
        dan publish. Pixel artwork/game tidak berubah.
      </p>
      <div className="cms-palette-grid">
        {Object.entries(colors).map(([key, value]) => (
          <label className="cms-color-field" key={key}>
            <span>{key}</span>
            {key !== "bg-wash" && (
              <input
                type="color"
                value={value}
                onChange={(e) =>
                  onChange({
                    ...data,
                    [mode]: { ...colors, [key]: e.target.value },
                  })
                }
              />
            )}
            <input
              aria-label={`${key} value`}
              value={value}
              onChange={(e) =>
                onChange({
                  ...data,
                  [mode]: { ...colors, [key]: e.target.value },
                })
              }
            />
          </label>
        ))}
      </div>
      {issues.length > 0 ? (
        <div className="cms-alert">
          <strong>Perbaiki sebelum publish</strong>
          <ul>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="cms-success">
          Kontras teks memenuhi pemeriksaan palette.
        </p>
      )}
    </div>
  );
}
