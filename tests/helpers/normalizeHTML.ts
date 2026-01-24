// tests/helpers/normalizeHTML.ts
export function normalizeHTML(html: string): string {
  return html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
}
