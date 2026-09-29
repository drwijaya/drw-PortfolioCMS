import { z } from "zod";
import { originalPalette } from "./palette-defaults";
const gradient =
  /^radial-gradient\(circle at 0% 0%, #[a-f0-9]{6} 0%, #[a-f0-9]{6} 100%\)$/i;
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const c = hex
      .slice(1)
      .match(/../g)!
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  };
  const x = lum(a),
    y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function paletteIssues(data: Record<string, unknown>) {
  const errors: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const palette = data[mode] as Record<string, string> | undefined;
    if (!palette) {
      errors.push(`${mode}: palette tidak lengkap`);
      continue;
    }
    for (const key of Object.keys(originalPalette[mode])) {
      if (key === "bg-wash") {
        if (
          !/^radial-gradient\(circle at 0% 0%, #[a-f0-9]{6} 0%, #[a-f0-9]{6} 100%\)$/i.test(
            palette[key] ?? "",
          )
        )
          errors.push(`${mode}: gradient tidak valid`);
      } else if (!hex.safeParse(palette[key]).success)
        errors.push(`${mode}: ${key} tidak valid`);
    }
    for (const fg of ["text-primary", "text-secondary", "accent"])
      for (const bg of ["bg", "surface", "bg-alternate"])
        if (
          hex.safeParse(palette[fg]).success &&
          hex.safeParse(palette[bg]).success &&
          contrast(palette[fg], palette[bg]) < 4.5
        )
          errors.push(`${mode}: ${fg}/${bg} kurang dari 4.5:1`);
    for (const tag of ["sage", "dusty-blue", "mustard", "terracotta"])
      if (
        hex.safeParse(palette[`tag-${tag}`]).success &&
        hex.safeParse(palette[`tag-${tag}-text`]).success &&
        contrast(palette[`tag-${tag}`], palette[`tag-${tag}-text`]) < 4.5
      )
        errors.push(`${mode}: tag ${tag} kurang kontras`);
  }
  return errors;
}
export function paletteCss(data: Record<string, unknown>) {
  const rules = [];
  for (const mode of ["light", "dark"] as const) {
    const p = data[mode] as Record<string, string>;
    if (!p) continue;
    const declarations = Object.keys(originalPalette[mode]).map(
      (k) =>
        `--${k}:${(k === "bg-wash" ? gradient.test(p[k] ?? "") : hex.safeParse(p[k]).success) ? p[k] : originalPalette[mode][k as keyof (typeof originalPalette)[typeof mode]]};`,
    );
    const accent = p.accent;
    if (/^#[0-9a-f]{6}$/i.test(accent))
      declarations.push(
        `--accent-rgb:${accent
          .slice(1)
          .match(/../g)!
          .map((n) => parseInt(n, 16))
          .join(",")};`,
      );
    rules.push(
      `${mode === "light" ? ":root" : "[data-theme='dark']"}{${declarations.join("")}}`,
    );
  }
  return rules.join("\n");
}
