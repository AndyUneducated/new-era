// K04: deeper Wikidata search for names whose top-5 hits did not settle the person: full-text search for
// humans of that label, with descriptions, birth, place and positions. Writes .probe/K04-find2.txt.
//   node research/scripts/K04-find2.ts 名字 ...
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// oxlint-disable-next-line typescript/no-explicit-any
async function api(params: Record<string, string>): Promise<any> {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', ...params })) u.searchParams.set(k, v)
  for (let a = 0; ; a++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    if (a >= 5) throw new Error(`${res.status}`)
    await sleep(10_000 * (a + 1))
  }
}
type Claim = { mainsnak: { datavalue?: { value: unknown } }; qualifiers?: Record<string, { datavalue?: { value: unknown } }[]> }
type Entity = { id: string; labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }>; claims?: Record<string, Claim[]> }
async function entities(ids: string[], props = 'labels|descriptions|claims'): Promise<Entity[]> {
  const out: Entity[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props, languages: 'zh-cn|zh-hans|zh|en' })
    out.push(...Object.values(r.entities as Record<string, Entity>))
  }
  return out
}
const zh = (m?: Record<string, { value: string }>) => m?.['zh-cn']?.value ?? m?.['zh-hans']?.value ?? m?.zh?.value ?? m?.en?.value
const item = (v: unknown) => (v as { id?: string } | undefined)?.id
const time = (v: unknown) => (v as { time?: string } | undefined)?.time?.replace(/^\+/, '').slice(0, 10)

const names = process.argv.slice(2)
const hits: Record<string, string[]> = {}
for (const name of names) {
  const r = await api({ action: 'query', list: 'search', srsearch: `${name} haswbstatement:P31=Q5 haswbstatement:P27=Q148`, srlimit: '20' })
  hits[name] = (r.query.search as { title: string }[]).map((x) => x.title)
  await sleep(1500)
}
const ents = new Map((await entities([...new Set(Object.values(hits).flat())])).map((e) => [e.id, e]))
const refs = new Set<string>()
for (const e of ents.values()) for (const p of ['P19', 'P39', 'P172']) for (const c of e.claims?.[p] ?? []) if (item(c.mainsnak.datavalue?.value)) refs.add(item(c.mainsnak.datavalue?.value)!)
const label = new Map((await entities([...refs], 'labels')).map((e) => [e.id, zh(e.labels) ?? e.id]))
const out: string[] = []
for (const name of names) {
  out.push(`## ${name}`)
  for (const id of hits[name]) {
    const e = ents.get(id)
    const c = e?.claims ?? {}
    const l = zh(e?.labels) ?? ''
    if (!l.replace(/\s*\(.*$/, '').replace(/[國偉軍劍剛寧華東]/g, (ch) => ({ 國: '国', 偉: '伟', 軍: '军', 劍: '剑', 剛: '刚', 寧: '宁', 華: '华', 東: '东' })[ch]!).startsWith(name)) continue
    const pos = (c.P39 ?? []).map((x) => `${label.get(item(x.mainsnak.datavalue?.value) ?? '') ?? '?'}${time(x.qualifiers?.P580?.[0]?.datavalue?.value)?.slice(0, 4) ?? ''}`)
    out.push(`${id}\t${l}\t${time(c.P569?.[0]?.mainsnak.datavalue?.value) ?? ''}\t${time(c.P570?.[0]?.mainsnak.datavalue?.value) ? `d.${time(c.P570?.[0]?.mainsnak.datavalue?.value)}` : ''}\t${label.get(item(c.P19?.[0]?.mainsnak.datavalue?.value) ?? '') ?? ''}\t${label.get(item(c.P172?.[0]?.mainsnak.datavalue?.value) ?? '') ?? ''}\t${zh(e?.descriptions) ?? ''}\t${pos.join('; ')}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'K04-find2.txt'), out.join('\n') + '\n')
console.log(`${names.length} names`)
