// Runs tools/fetch-wikidata.ts --find on the K03 roster (names passed as argv, not through the shell),
// then fetches every candidate's English label, description, birth and death dates, so the right QID can be picked.
//   node research/scripts/K03-find.ts          -> .probe/K03.json (tool output), .probe/K03-candidates.json
//   node research/scripts/K03-find.ts --skip   only redo the candidate details
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const roster = JSON.parse(readFileSync(join(ROOT, '.probe/K03-roster.json'), 'utf8')) as { names: { name: string }[] }
const names = roster.names.map((n) => n.name)

type Found = Record<string, { id: string; label: string; description?: string }[]>
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Wikidata answers 429 when several batches search at once: small chunks, a pause between, retried
if (!process.argv.includes('--skip')) {
  const merged: Found = existsSync(join(ROOT, '.probe/K03.json')) ? JSON.parse(readFileSync(join(ROOT, '.probe/K03.json'), 'utf8')) : {}
  const todo = names.filter((n) => !merged[n])
  for (let i = 0; i < todo.length; i += 20) {
    const chunk = todo.slice(i, i + 20)
    for (let attempt = 0; attempt < 6; attempt++) {
      const r = spawnSync(process.execPath, ['tools/fetch-wikidata.ts', '--find', '--out=K03-chunk', ...chunk], { cwd: ROOT, stdio: 'inherit' })
      if (!r.status) break
      await sleep(30_000 * (attempt + 1))
    }
    if (existsSync(join(ROOT, '.probe/K03-chunk.json'))) Object.assign(merged, JSON.parse(readFileSync(join(ROOT, '.probe/K03-chunk.json'), 'utf8')))
    writeFileSync(join(ROOT, '.probe/K03.json'), JSON.stringify(merged, null, 1))
    await sleep(5_000)
  }
}
const found = JSON.parse(readFileSync(join(ROOT, '.probe/K03.json'), 'utf8')) as Found

// oxlint-disable-next-line typescript/no-explicit-any
async function entities(ids: string[]): Promise<Record<string, any>> {
  const out: Record<string, unknown> = {}
  for (let i = 0; i < ids.length; i += 50) {
    const u = new URL('https://www.wikidata.org/w/api.php')
    const q = { action: 'wbgetentities', format: 'json', ids: ids.slice(i, i + 50).join('|'), props: 'labels|descriptions|claims', languages: 'en|zh-cn|zh' }
    for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v)
    let res = await fetch(u, { headers: { 'User-Agent': UA } })
    for (let a = 1; !res.ok && a < 6; a++) {
      await sleep(15_000 * a)
      res = await fetch(u, { headers: { 'User-Agent': UA } })
    }
    Object.assign(out, (await res.json()).entities)
  }
  // oxlint-disable-next-line typescript/no-explicit-any
  return out as Record<string, any>
}
// oxlint-disable-next-line typescript/no-explicit-any
const t = (c: any) => c?.[0]?.mainsnak?.datavalue?.value?.time?.slice(1, 11)
const all = [...new Set(Object.values(found).flatMap((l) => l.map((c) => c.id)))]
const ents = await entities(all)
const out: Record<string, unknown[]> = {}
for (const name of names)
  out[name] = (found[name] ?? []).map((c) => {
    const e = ents[c.id]
    return {
      id: c.id,
      label: c.label,
      en: e?.labels?.en?.value,
      desc: e?.descriptions?.['zh-cn']?.value ?? e?.descriptions?.zh?.value ?? c.description,
      enDesc: e?.descriptions?.en?.value,
      born: t(e?.claims?.P569),
      died: t(e?.claims?.P570),
      human: e?.claims?.P31?.some((x: { mainsnak: { datavalue?: { value: { id: string } } } }) => x.mainsnak.datavalue?.value.id === 'Q5'),
    }
  })
writeFileSync(join(ROOT, '.probe/K03-candidates.json'), JSON.stringify(out, null, 1))
console.log(`${names.length} names, ${all.length} candidates -> .probe/K03-candidates.json`)
