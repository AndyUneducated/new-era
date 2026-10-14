// Reads the zhwiki pages of the 16th CC member and alternate lists: which article each name links to,
// and the bracketed notes (ethnicity, 女, later changes). A research aid for namesakes; the cards cite the Xinhua lists.
//   node research/scripts/K03-lists.ts   -> .probe/K03-lists.json
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const pages = ['中国共产党第十六届中央委员会委员列表', '中国共产党第十六届中央委员会候补委员列表']
const roster = JSON.parse(readFileSync(join(ROOT, '.probe/K03-roster.json'), 'utf8')) as { names: { name: string }[] }
const mine = new Set(roster.names.map((n) => n.name))

const out: Record<string, { target: string; note?: string; page: string }> = {}
const raw: Record<string, string> = {}
for (const page of pages) {
  const u = new URL('https://zh.wikipedia.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'parse', page, prop: 'wikitext', format: 'json', formatversion: '2', variant: 'zh-cn' })) u.searchParams.set(k, v)
  const r = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
  const text: string = r.parse?.wikitext ?? ''
  raw[page] = text
  // [[target|shown]] or [[target]], optionally followed by （note）
  for (const m of text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\](?:[（(]([^）)]*)[）)])?/g)) {
    const target = m[1].trim()
    const shown = (m[2] ?? m[1]).replace(/\s*[（(].*$/, '').trim()
    if (mine.has(shown) && !out[shown]) out[shown] = { target, note: m[3], page }
  }
}
writeFileSync(join(ROOT, '.probe/K03-lists.json'), JSON.stringify({ found: Object.keys(out).length, missing: [...mine].filter((n) => !out[n]), links: out }, null, 1))
writeFileSync(join(ROOT, '.probe/K03-lists-raw.txt'), Object.entries(raw).map(([p, t]) => `=== ${p}\n${t}`).join('\n\n'))
console.log(`${Object.keys(out).length} of ${mine.size} names linked -> .probe/K03-lists.json`)
