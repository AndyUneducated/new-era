// One-off: report E09 keep strings that did not make it into sources/text.
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

const { web } = parse(readFileSync(new URL('../manifests/E09.yaml', import.meta.url), 'utf8'))
const norm = (s: string) => s.replace(/[“”"「」『』]/g, '"').replace(/\s+/g, '')
for (const w of web) {
  const text = norm(readFileSync(new URL(`../../sources/text/${w.id}.txt`, import.meta.url), 'utf8'))
  for (const k of w.keep ?? []) if (!text.includes(norm(k))) console.log('MISSING', w.id, k)
}
console.log('checked', web.length)

const events = parse(readFileSync(new URL('../../content/events/E09.yaml', import.meta.url), 'utf8'))
const years: Record<string, number> = {}
for (const e of events) {
  const n = [...e.summary].length
  if (n < 80 || n > 200) console.log('LENGTH', e.id, n)
  const y = String(e.date).slice(0, 4)
  years[y] = (years[y] ?? 0) + 1
}
console.log('events', events.length, 'major', events.filter((e: { major?: boolean }) => e.major).length)
console.log(Object.entries(years).sort().map(([y, n]) => `${y}:${n}`).join(' '))
