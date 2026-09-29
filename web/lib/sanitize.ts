import DOMPurify from 'isomorphic-dompurify'

/**
 * The `text`, `lead`, `callout` and table-cell blocks carry inline HTML
 * (<strong>, <em>) straight from the ported Python source. Content is
 * authored by the site owner and validated at build, so this runs at
 * render time on the server and never against untrusted input. It is a
 * belt-and-braces pass, not the primary defence.
 */
export function clean(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'br', 'span', 'sup', 'sub', 'code', 'a'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  })
}
