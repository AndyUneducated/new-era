// Matches the 2026 SPP 权威发布 indictment list (R06-peek c15spq-*) and the court list (c15court-*) against the
// cards: flags people with a card whose fall has no charge / trial / verdict step yet.
//   node research/scripts/C15-spp.ts -> .probe/C15-spp.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Step = { date: string | number; text: string }
type P = { id: string; name: string; status: string; fall?: Step[]; roles?: string[] }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const recs = new Map<string, Step[]>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const [id, r] of Object.entries((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as Record<string, { fall?: Step[] }>))
    recs.set(id, r?.fall ?? [])
const items: { date: string; title: string; url: string; src: string }[] = []
for (const f of readdirSync('.probe').filter((f) => /^R06-peek-c15(spq|court)-/.test(f))) {
  for (const l of readFileSync(`.probe/${f}`, 'utf8').split('\n')) {
    const m = l.trim().match(/^\[([^\]]+)\]\s*(.+?)\s*(20\d\d-\d\d-\d\d)/)
    if (m && /公诉|宣判|判处|开庭|审理|二审|逮捕/.test(m[2])) items.push({ date: m[3], title: m[2], url: m[1], src: f })
  }
}
const seen = new Set<string>()
const out: string[] = []
for (const it of items.sort((a, b) => b.date.localeCompare(a.date))) {
  if (seen.has(it.title)) continue
  seen.add(it.title)
  const nm = it.title.match(/依法对(.+?)涉嫌/)?.[1] ?? ''
  const cands = people.filter((p) => (nm ? p.name === nm : it.title.includes(p.name) && p.name.length >= 2 && /[受贪滥行利挪等案非玩国内洗故]/.test(it.title[it.title.indexOf(p.name) + p.name.length] ?? '')))
  for (const c of cands) {
    const steps = [...(c.fall ?? []), ...(recs.get(c.id) ?? [])]
    const txt = steps.map((s) => `${s.date} ${s.text}`).join(' / ')
    const have = /宣判|判处|判决/.test(it.title) ? /判处|判决|宣判/.test(txt) : /开庭|审理/.test(it.title) ? /开庭|审理|判处/.test(txt) : /提起公诉|起诉书|公诉|开庭|判处/.test(txt.replace(/移送检察机关依法审查并?提起公诉/g, ''))
    out.push(`${have ? 'ok' : 'NEED'}\t${it.date}\t${c.name}\t${c.id}@${c.file}\t${c.status}\t${(c.roles ?? []).join(',')}\t${it.title}\t${it.url}`)
  }
  if (!cands.length) out.push(`-\t${it.date}\t${nm}\t\t\t\t${it.title}\t${it.url}`)
}
writeFileSync('.probe/C15-spp.txt', out.join('\n') + '\n', 'utf8')
console.log(items.length, out.filter((l) => l.startsWith('NEED')).length)
