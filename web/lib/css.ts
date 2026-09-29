/**
 * A CSS `url()` value that cannot break out of its own parentheses.
 *
 * Interpolating a path straight into a template literal puts whatever the
 * content file says inside a CSS value: a space silently voids the whole
 * declaration, and a `)` ends the function early and leaves the rest to be
 * parsed as further CSS. Quoting removes the first, escaping the second.
 *
 * `logo` is schema-checked as well (lib/schema.ts pins it to an absolute
 * path with a known extension). Both, because the schema describes what is
 * expected and this describes what is safe.
 */
export function cssUrl(path: string): string {
  return `url("${path.replace(/["\\]/g, '\\$&')}")`
}
