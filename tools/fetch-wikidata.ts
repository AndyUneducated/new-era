// Wikidata (CC0) as the source for the basic facts on dossier cards.
//   node tools/fetch-wikidata.ts                 fetch every ids.wikidata in content/people that has no record yet
//   node tools/fetch-wikidata.ts --force         refetch all of them
//   node tools/fetch-wikidata.ts --find 名字 ...  look up QIDs by Chinese name -> .probe/wd-find.json
// Records go to research/wikidata/<QID>.json: label, description, birth, death, birthplace, image, positions (P39).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const API = 'https://www.wikidata.org/w/api.php'
const OUT = join(ROOT, 'research', 'wikidata')
mkdirSync(OUT, { recursive: true })
mkdirSync(join(ROOT, '.probe'), { recursive: true })

type Claim = { mainsnak: { datavalue?: { value: unknown } }; qualifiers?: Record<string, { datavalue?: { value: unknown } }[]>; rank: string }
type Entity = { id: string; labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }>; claims?: Record<string, Claim[]> }

// oxlint-disable-next-line typescript/no-explicit-any
async function api(params: Record<string, string>): Promise<any> {
  const u = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', ...params })) u.searchParams.set(k, v)
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    if (attempt >= 3) throw new Error(`${res.status} ${u}`)
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
  }
}

const zh = (m?: Record<string, { value: string }>) => m?.['zh-cn']?.value ?? m?.['zh-hans']?.value ?? m?.zh?.value ?? m?.['zh-hant']?.value ?? m?.en?.value

async function entities(ids: string[]): Promise<Entity[]> {
  const out: Entity[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'labels|descriptions|claims', languages: 'zh-cn|zh-hans|zh|zh-hant|en' })
    out.push(...Object.values(r.entities as Record<string, Entity>))
  }
  return out
}

const time = (v: unknown) => {
  const t = (v as { time?: string; precision?: number } | undefined)
  if (!t?.time) return undefined
  const s = t.time.replace(/^\+/, '').slice(0, 10)
  return t.precision! >= 11 ? s : t.precision === 10 ? s.slice(0, 7) : s.slice(0, 4)
}
const item = (v: unknown) => (v as { id?: string } | undefined)?.id
const best = (cs?: Claim[]) => cs?.find((c) => c.rank === 'preferred') ?? cs?.find((c) => c.rank !== 'deprecated')

const args = process.argv.slice(2)
if (args[0] === '--find') {
  const found: Record<string, { id: string; label: string; description?: string }[]> = {}
  for (const name of args.slice(1).filter((a) => !a.startsWith('--'))) {
    const r = await api({ action: 'wbsearchentities', search: name, language: 'zh', uselang: 'zh-cn', type: 'item', limit: '5' })
    found[name] = (r.search as { id: string; label: string; description?: string }[]).map(({ id, label, description }) => ({ id, label, description }))
  }
  // --out=B04 names the file, so batches looking up names in parallel do not overwrite each other's
  const out = args.find((a) => a.startsWith('--out='))?.slice(6) ?? 'wd-find'
  writeFileSync(join(ROOT, '.probe', `${out}.json`), JSON.stringify(found, null, 1))
  console.log(`${Object.keys(found).length} names -> .probe/${out}.json`)
  process.exit(0)
}

const force = args.includes('--force')
const wanted = new Set<string>()
const peopleDir = join(ROOT, 'content', 'people')
// QIDs named on the command line are fetched alone; otherwise every person file is scanned
const named = args.filter((a) => /^Q\d+$/.test(a))
for (const a of named) wanted.add(a)
if (!named.length)
  for (const f of readdirSync(peopleDir).filter((f) => f.endsWith('.yaml'))) {
    let list: { ids?: { wikidata?: string } }[] = []
    try {
      list = parse(readFileSync(join(peopleDir, f), 'utf8')) ?? []
    } catch {
      continue
    }
    for (const p of list) if (p.ids?.wikidata && (force || !existsSync(join(OUT, `${p.ids.wikidata}.json`)))) wanted.add(p.ids.wikidata)
  }

const people = await entities([...wanted])
// second pass: labels of the places and offices the records point at
const refs = new Set<string>()
for (const e of people) {
  const bp = item(best(e.claims?.P19)?.mainsnak.datavalue?.value)
  if (bp) refs.add(bp)
  for (const c of e.claims?.P39 ?? []) {
    const id = item(c.mainsnak.datavalue?.value)
    if (id) refs.add(id)
  }
}
const labels = new Map((await entities([...refs])).map((e) => [e.id, zh(e.labels) ?? e.id]))

for (const e of people) {
  const c = e.claims ?? {}
  const positions = (c.P39 ?? [])
    .filter((x) => x.rank !== 'deprecated')
    .map((x) => ({
      label: labels.get(item(x.mainsnak.datavalue?.value) ?? '') ?? '',
      from: time(x.qualifiers?.P580?.[0]?.datavalue?.value),
      to: time(x.qualifiers?.P582?.[0]?.datavalue?.value),
    }))
    .filter((p) => p.label)
    .sort((a, b) => (a.from ?? '9').localeCompare(b.from ?? '9'))
  const rec = {
    qid: e.id,
    label: zh(e.labels),
    description: zh(e.descriptions),
    born: time(best(c.P569)?.mainsnak.datavalue?.value),
    died: time(best(c.P570)?.mainsnak.datavalue?.value),
    birthplace: labels.get(item(best(c.P19)?.mainsnak.datavalue?.value) ?? ''),
    image: best(c.P18)?.mainsnak.datavalue?.value as string | undefined,
    positions,
  }
  writeFileSync(join(OUT, `${e.id}.json`), JSON.stringify(rec, null, 1) + '\n')
}
console.log(`${people.length} records written to research/wikidata/`)
