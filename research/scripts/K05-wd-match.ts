// K05: match each name on .probe/K05-roster.json to a Wikidata item.
//   node research/scripts/K05-wd-match.ts   -> .probe/K05-wd-match.json and .probe/K05-wd-match.txt
// Candidates come from a zh label search; the one holding a 19th Central Committee seat (P39) is taken.
// Everything else is listed for a hand check (birth year, birthplace, offices).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const API = 'https://www.wikidata.org/w/api.php'

// oxlint-disable-next-line typescript/no-explicit-any
async function api(params: Record<string, string>): Promise<any> {
  const u = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', ...params })) u.searchParams.set(k, v)
  await new Promise((r) => setTimeout(r, 700))
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    if (attempt >= 8) throw new Error(`${res.status} ${u}`)
    const wait = Number(res.headers.get('retry-after')) || 5 * (attempt + 1)
    await new Promise((r) => setTimeout(r, wait * 1000))
  }
}
// search results survive a rerun after a rate limit
const CACHE = join(ROOT, '.probe', 'K05-wd-search.json')
const cache: Record<string, string[]> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
type Claim = { mainsnak: { datavalue?: { value: unknown } }; rank: string }
type Entity = { id: string; labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }>; claims?: Record<string, Claim[]> }
const zh = (m?: Record<string, { value: string }>) => m?.['zh-cn']?.value ?? m?.['zh-hans']?.value ?? m?.zh?.value ?? m?.['zh-hant']?.value ?? m?.en?.value
const item = (v: unknown) => (v as { id?: string } | undefined)?.id
async function entities(ids: string[], props = 'labels|descriptions|claims'): Promise<Entity[]> {
  const out: Entity[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props, languages: 'zh-cn|zh-hans|zh|zh-hant|en' })
    out.push(...Object.values(r.entities as Record<string, Entity>))
  }
  return out
}

const roster = JSON.parse(readFileSync(join(ROOT, '.probe', 'K05-roster.json'), 'utf8')) as { raw: string; name: string; list: string }[]
const cands = new Map<string, string[]>()
for (const name of new Set(roster.map((r) => r.name))) {
  if (!cache[name]) {
    const r = await api({ action: 'wbsearchentities', search: name, language: 'zh', uselang: 'zh-cn', type: 'item', limit: '8' })
    cache[name] = (r.search as { id: string }[]).map((s) => s.id)
    writeFileSync(CACHE, JSON.stringify(cache))
  }
  cands.set(name, cache[name])
}
const all = await entities([...new Set([...cands.values()].flat())])
const byId = new Map(all.map((e) => [e.id, e]))
const refs = new Set<string>()
for (const e of all) {
  for (const c of e.claims?.P39 ?? []) if (item(c.mainsnak.datavalue?.value)) refs.add(item(c.mainsnak.datavalue?.value)!)
  const bp = item(e.claims?.P19?.[0]?.mainsnak.datavalue?.value)
  if (bp) refs.add(bp)
}
const labels = new Map((await entities([...refs], 'labels')).map((e) => [e.id, zh(e.labels) ?? e.id]))

const out: Record<string, { qid?: string; how: string; cands: string[] }> = {}
const lines: string[] = []
for (const r of roster) {
  const rows = (cands.get(r.name) ?? [])
    .map((id) => byId.get(id)!)
    .filter((e) => e && e.claims?.P31?.some((c) => item(c.mainsnak.datavalue?.value) === 'Q5'))
    .map((e) => {
      const born = ((e.claims?.P569?.[0]?.mainsnak.datavalue?.value as { time?: string } | undefined)?.time ?? '').slice(1, 5)
      const pos = (e.claims?.P39 ?? []).map((c) => labels.get(item(c.mainsnak.datavalue?.value) ?? '') ?? '')
      return { id: e.id, label: zh(e.labels) ?? '', desc: zh(e.descriptions) ?? '', born, bp: labels.get(item(e.claims?.P19?.[0]?.mainsnak.datavalue?.value) ?? '') ?? '', pos, c19: pos.some((p) => /第十九届中央/.test(p)) }
    })
    .filter((x) => x.label.replace(/[·・]/g, '') === r.name.replace(/[·・]/g, '') || x.c19)
  const hits = rows.filter((x) => x.c19)
  const qid = hits.length === 1 ? hits[0].id : undefined
  out[r.raw] = { qid, how: hits.length === 1 ? 'c19' : hits.length ? 'several-c19' : 'none', cands: rows.map((x) => x.id) }
  lines.push(`${qid ? 'OK ' : '?? '} ${r.list} ${r.raw}  ${qid ?? ''}`)
  for (const x of rows) lines.push(`      ${x.c19 ? '*' : ' '} ${x.id} ${x.label} ${x.born} ${x.bp} | ${x.desc} | ${x.pos.filter(Boolean).slice(0, 6).join('；')}`)
}
writeFileSync(join(ROOT, '.probe', 'K05-wd-match.json'), JSON.stringify(out, null, 1))
writeFileSync(join(ROOT, '.probe', 'K05-wd-match.txt'), lines.join('\n') + '\n')
console.log(`${Object.values(out).filter((o) => o.qid).length}/${roster.length} matched`)
