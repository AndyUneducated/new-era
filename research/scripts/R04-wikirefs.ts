// Parse the wikitext of 中共十九大至二十大期间落马官员列表 (.probe/R04-wiki-raw.txt) into rows with their references,
// and mark references whose URL is already registered in research/manifests/*.yaml.
//   node research/scripts/R04-wikirefs.ts 2018 2019 2020   -> .probe/R04-refs.txt and .probe/R04-refs.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const years = process.argv.slice(2)
const raw = readFileSync('.probe/R04-wiki-raw.txt', 'utf8')

export function norm(u: string): string {
  return u
    .replace(/^https?:\/\/web\.archive\.org\/web\/\d+(id_)?\//, '')
    .replace(/^https?:\/\//, '')
    .replace(/^(www|m)\./, '')
    .replace(/:80\//, '/')
    .replace(/[?#].*$/, '')
    .replace(/\/$/, '')
}

const known = new Map<string, string>()
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const e of parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) known.set(norm(e.url), e.id)
  } catch {}
}

type Ref = { url: string; title?: string; date?: string; work?: string; archive?: string; known?: string; knownArchive?: string }
type Row = { name: string; post: string; date: string; status: string; refs: Ref[] }
const rows: Row[] = []
for (const block of raw.split(/\n\|-\s*\n/)) {
  const lines = block.split('\n').filter((l) => l.startsWith('|') && !l.startsWith('|}') && !l.startsWith('|+'))
  if (lines.length < 4) continue
  const cell = (l: string) => l.replace(/^\|\s*/, '')
  const link = (s: string) => s.replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
  const name = link(cell(lines[0])).replace(/[\s　]/g, '')
  const post = link(cell(lines[1]))
  const dm = cell(lines[2]).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!dm) continue
  const date = `${dm[1]}-${dm[2].padStart(2, '0')}-${dm[3].padStart(2, '0')}`
  const rest = lines.slice(3).join('\n')
  const status = rest.replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/<ref[^>]*\/>/g, '').trim()
  const refs: Ref[] = []
  for (const m of rest.matchAll(/\{\{\s*Cite (?:web|news)\s*\|([\s\S]*?)\}\}/gi)) {
    const p: Record<string, string> = {}
    for (const kv of m[1].split('|')) {
      const k = kv.indexOf('=')
      if (k > 0) p[kv.slice(0, k).trim().toLowerCase()] = kv.slice(k + 1).trim()
    }
    const r: Ref = { url: p.url, title: p.title, date: p.date || p.accessdate, work: p.work || p.publisher, archive: p.archiveurl || p['archive-url'] }
    if (!r.url) continue
    r.known = known.get(norm(r.url))
    if (r.archive) r.knownArchive = known.get(norm(r.archive))
    refs.push(r)
  }
  rows.push({ name, post, date, status, refs })
}
const sel = rows.filter((r) => !years.length || years.includes(r.date.slice(0, 4)))
writeFileSync('.probe/R04-refs.json', JSON.stringify(sel, null, 1))
writeFileSync(
  '.probe/R04-refs.txt',
  sel
    .map(
      (r) =>
        `## ${r.name} | ${r.date} | ${r.post} | ${r.status}\n` +
        r.refs.map((f) => `  - ${f.title} [${f.date} ${f.work ?? ''}]\n    ${f.url}\n    ${f.archive ?? ''}${f.known || f.knownArchive ? `\n    KNOWN: ${f.known ?? f.knownArchive}` : ''}`).join('\n'),
    )
    .join('\n'),
)
console.log(`${sel.length} rows`)
