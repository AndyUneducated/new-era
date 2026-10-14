// K04: look up the roster names on Wikidata with the project tool, then pull the candidates' birth, place,
// ethnicity and positions so the right namesake can be picked. Writes .probe/K04-candidates.txt.
//   node research/scripts/K04-find.ts            (search, then describe)
//   node research/scripts/K04-find.ts --describe (reuse .probe/K04.json)
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const names = readFileSync(join(ROOT, '.probe', 'K04-names.txt'), 'utf8').trim().split(/\s+/)
// Wikidata answers 429 when several batches search at once, so the names go in small chunks, resumable
const CHUNK = 25
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
if (!process.argv.includes('--describe'))
  for (let i = 0; i * CHUNK < names.length; i++) {
    if (existsSync(join(ROOT, '.probe', `K04-wd-${i}.json`))) continue
    for (let attempt = 0; ; attempt++)
      try {
        execFileSync('node', ['tools/fetch-wikidata.ts', '--find', `--out=K04-wd-${i}`, ...names.slice(i * CHUNK, (i + 1) * CHUNK)], { cwd: ROOT, stdio: 'inherit' })
        break
      } catch {
        if (attempt >= 5) throw new Error(`chunk ${i} keeps failing`)
        await sleep(60_000)
      }
    await sleep(15_000)
  }
const found: Record<string, { id: string; label: string; description?: string }[]> = {}
for (let i = 0; i * CHUNK < names.length; i++) Object.assign(found, JSON.parse(readFileSync(join(ROOT, '.probe', `K04-wd-${i}.json`), 'utf8')))
writeFileSync(join(ROOT, '.probe', 'K04.json'), JSON.stringify(found, null, 1))

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
type Claim = { mainsnak: { datavalue?: { value: unknown } }; qualifiers?: Record<string, { datavalue?: { value: unknown } }[]>; rank: string }
type Entity = { id: string; labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }>; claims?: Record<string, Claim[]> }
async function entities(ids: string[], props = 'labels|descriptions|claims'): Promise<Entity[]> {
  const out: Entity[] = []
  for (let i = 0; i < ids.length; i += 50) {
    const u = new URL('https://www.wikidata.org/w/api.php')
    for (const [k, v] of Object.entries({ format: 'json', action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props, languages: 'zh-cn|zh-hans|zh|en' })) u.searchParams.set(k, v)
    for (let a = 0; ; a++) {
      const res = await fetch(u, { headers: { 'User-Agent': UA } })
      if (res.ok) {
        out.push(...Object.values((await res.json()).entities as Record<string, Entity>))
        break
      }
      if (a >= 3) throw new Error(`${res.status}`)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
  return out
}
const zh = (m?: Record<string, { value: string }>) => m?.['zh-cn']?.value ?? m?.['zh-hans']?.value ?? m?.zh?.value ?? m?.en?.value
const item = (v: unknown) => (v as { id?: string } | undefined)?.id
const time = (v: unknown) => (v as { time?: string } | undefined)?.time?.replace(/^\+/, '').slice(0, 10)

const cand = [...new Set(Object.values(found).flatMap((l) => l.map((x) => x.id)))]
const ents = new Map((await entities(cand)).map((e) => [e.id, e]))
const refs = new Set<string>()
for (const e of ents.values())
  for (const p of ['P19', 'P39', 'P172', 'P21']) for (const c of e.claims?.[p] ?? []) if (item(c.mainsnak.datavalue?.value)) refs.add(item(c.mainsnak.datavalue?.value)!)
const label = new Map((await entities([...refs], 'labels')).map((e) => [e.id, zh(e.labels) ?? e.id]))

const out: string[] = []
const json: Record<string, unknown[]> = {}
for (const name of names) {
  out.push(`## ${name}`)
  json[name] = []
  for (const { id } of found[name] ?? []) {
    const e = ents.get(id)
    if (!e) continue
    const c = e.claims ?? {}
    const human = c.P31?.some((x) => item(x.mainsnak.datavalue?.value) === 'Q5')
    if (!human) continue
    const pos = (c.P39 ?? []).map((x) => `${label.get(item(x.mainsnak.datavalue?.value) ?? '') ?? '?'}${time(x.qualifiers?.P580?.[0]?.datavalue?.value)?.slice(0, 7) ?? ''}`)
    const cc = pos.filter((p) => /中央委员会|Central Committee/.test(p)).join('; ')
    const rec = {
      id,
      label: zh(e.labels),
      desc: zh(e.descriptions),
      born: time(c.P569?.[0]?.mainsnak.datavalue?.value),
      died: time(c.P570?.[0]?.mainsnak.datavalue?.value),
      place: label.get(item(c.P19?.[0]?.mainsnak.datavalue?.value) ?? ''),
      eth: label.get(item(c.P172?.[0]?.mainsnak.datavalue?.value) ?? ''),
      sex: label.get(item(c.P21?.[0]?.mainsnak.datavalue?.value) ?? ''),
      cc,
      pos: pos.length,
    }
    json[name].push(rec)
    out.push(`${id}\t${rec.label}\t${rec.born ?? ''}\t${rec.died ? `d.${rec.died}` : ''}\t${rec.place ?? ''}\t${rec.eth ?? ''}\t${rec.desc ?? ''}\tCC: ${cc}\t(${rec.pos} pos)`)
  }
}
writeFileSync(join(ROOT, '.probe', 'K04-candidates.txt'), out.join('\n') + '\n')
writeFileSync(join(ROOT, '.probe', 'K04-candidates.json'), JSON.stringify(json, null, 1))
console.log(`${names.length} names, ${cand.length} candidates`)
