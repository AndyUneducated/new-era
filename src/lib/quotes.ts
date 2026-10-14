// Verbatim quote checking, shared by the data build and the browser.

// Tolerated: any quotation mark for any other (“” ‘’ 「」 『』 and straight quotes), runs of whitespace,
// and a sentence-final mark where the source continues.
const norm = (s: string) =>
  s
    .replace(/[“”‘’「」『』"'\u2032]/g, '"')
    .replace(/\s+/g, ' ')

// the parts of `quote` (split at …… or ...) that do not occur in `body`; empty when the quote checks out
export function quoteMisses(body: string, quote: string): string[] {
  const hay = norm(body)
  return quote
    .split(/……|\.\.\.|…/)
    .map((s) => norm(s.trim()).replace(/[。！？，；.,;!?]$/, '').trim())
    .filter((part) => part && !hay.includes(part))
}
