// K05: id collision check and the zh.wikipedia title of each person (from the Wikidata sitelink).
//   node research/scripts/K05-wiki.ts   -> .probe/K05-wiki.txt, .probe/K05-wiki-titles.json
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { PEOPLE } from './K05-ids.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const lines: string[] = []

const taken = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'people')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K05'))) {
  try {
    for (const p of parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) taken.set(p.id, `${p.name} ${f}`)
  } catch {
    lines.push(`skipping ${f}`)
  }
}
for (const f of ['roster.yaml', ...readdirSync(join(ROOT, 'research', 'roster')).filter((f) => !f.startsWith('K05')).map((f) => `roster/${f}`)]) {
  try {
    for (const p of parse(readFileSync(join(ROOT, 'research', f), 'utf8')) ?? []) if (!taken.has(p.id)) taken.set(p.id, `${p.name} ${f}`)
  } catch {
    lines.push(`skipping ${f}`)
  }
}
const seen = new Set<string>()
for (const [name, id] of PEOPLE) {
  if (taken.has(id)) lines.push(`ID TAKEN  ${id} (${name}) by ${taken.get(id)}`)
  if (seen.has(id)) lines.push(`ID TWICE  ${id}`)
  seen.add(id)
}

const qids = PEOPLE.map((p) => p[2]).filter(Boolean)
const titles: Record<string, string> = {}
for (let i = 0; i < qids.length; i += 50) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', action: 'wbgetentities', ids: qids.slice(i, i + 50).join('|'), props: 'sitelinks', sitefilter: 'zhwiki' })) u.searchParams.set(k, v)
  let r
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(u, { headers: { 'User-Agent': 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)' } })
    if (res.ok && res.headers.get('content-type')?.includes('json')) {
      r = await res.json()
      break
    }
    if (attempt >= 8) throw new Error(`${res.status} ${u}`)
    await new Promise((s) => setTimeout(s, (Number(res.headers.get('retry-after')) || 10 * (attempt + 1)) * 1000))
  }
  for (const [q, e] of Object.entries(r.entities as Record<string, { sitelinks?: { zhwiki?: { title: string } } }>)) if (e.sitelinks?.zhwiki) titles[q] = e.sitelinks.zhwiki.title
  await new Promise((s) => setTimeout(s, 1000))
}
for (const [name, id, q] of PEOPLE) if (!q || !titles[q]) lines.push(`NO ZHWIKI  ${name} ${id} ${q}`)
writeFileSync(join(ROOT, '.probe', 'K05-wiki-titles.json'), JSON.stringify(titles, null, 1))
writeFileSync(join(ROOT, '.probe', 'K05-wiki.txt'), lines.join('\n') + '\n')
console.log(`${PEOPLE.length} people, ${Object.keys(titles).length} zhwiki titles`)
