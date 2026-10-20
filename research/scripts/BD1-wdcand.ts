// BD1: birth date, description and P39 of each Wikidata candidate in .probe/BD1.json, without writing records
//   node research/scripts/BD1-wdcand.ts -> .probe/bd1-wdcand.txt
import { readFileSync, writeFileSync } from 'node:fs'

const found = JSON.parse(readFileSync('.probe/BD1.json', 'utf8')) as Record<string, { id: string; label: string; description?: string }[]>
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
async function api(params: Record<string, string>) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', ...params })) u.searchParams.set(k, v)
  for (let a = 0; ; a++) {
    const r = await fetch(u, { headers: { 'User-Agent': UA } })
    if (r.ok) return r.json()
    if (a > 3) throw new Error(String(r.status))
    await new Promise((s) => setTimeout(s, 2000 * (a + 1)))
  }
}
const ids = [...new Set(Object.values(found).flatMap((l) => l.filter((x) => x.label && Object.keys(found).includes(x.label)).map((x) => x.id)))]
const ent: Record<string, any> = {}
for (let i = 0; i < ids.length; i += 50) {
  const r = await api({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'labels|descriptions|claims', languages: 'zh-cn|zh-hans|zh|en' })
  Object.assign(ent, r.entities)
}
const t = (c: any) => {
  const v = c?.mainsnak?.datavalue?.value
  if (!v?.time) return ''
  const s = v.time.replace(/^\+/, '').slice(0, 10)
  return v.precision >= 11 ? s : v.precision === 10 ? s.slice(0, 7) : s.slice(0, 4)
}
const out: string[] = []
for (const [name, list] of Object.entries(found)) {
  for (const x of list.filter((x) => x.label === name)) {
    const e = ent[x.id]
    const born = t(e?.claims?.P569?.[0])
    const wiki = e?.sitelinks ? '' : ''
    out.push(`${name}\t${x.id}\tborn=${born || '-'}\t${x.description ?? ''}${wiki}`)
  }
}
writeFileSync('.probe/bd1-wdcand.txt', out.join('\n') + '\n', 'utf8')
console.log(ids.length)
