// R10: who already has a case record (content/falls/*.yaml), and which central-SOE / central-finance rows of the
// CCDI fall lists (research/falls-list/R01–R06) still lack one, with cards of the same name and roster entries.
//   node research/scripts/R10-have.ts [names...]   -> .probe/R10-have.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Row = { name: string; date?: string; post?: string; id?: string; done?: boolean; from?: string }
type P = { id: string; name: string; status: string; roles: string[]; fall?: unknown[]; headline?: string; aka?: string[] }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const roster: { id: string; name: string; batch: string }[] = []
for (const f of readdirSync('research/roster').filter((f) => f.endsWith('.yaml')))
  roster.push(...((parse(readFileSync(`research/roster/${f}`, 'utf8')) ?? []) as typeof roster))
roster.push(...((parse(readFileSync('research/roster.yaml', 'utf8')) ?? []) as typeof roster))
const falls = new Map<string, string>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const id of Object.keys((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as object)) falls.set(id, f)

const show = (name: string) => {
  const cands = people.filter((p) => p.name === name || p.aka?.includes(name))
  const ros = roster.filter((x) => x.name === name && !cands.some((c) => c.id === x.id))
  const c = cands.map((p) => `${p.id}@${p.file}[${p.status};${p.roles.join(',')};fall=${(p.fall ?? []).length};${p.headline ?? ''}]${falls.has(p.id) ? ' FALL@' + falls.get(p.id) : ' NOFALL'}`)
  return `${c.join(' | ') || 'NOCARD'}${ros.length ? ` ROSTER:${ros.map((x) => `${x.id}/${x.batch}`).join(',')}` : ''}`
}

const out: string[] = []
const extra = process.argv.slice(2)
if (extra.length) {
  for (const n of extra) out.push(`Q\t${n}\t${show(n)}`)
} else {
  const SOE = /集团|公司|银行|保险|证券|资产|投资|金融|信托|证监会|银监会|保监会|银保监|金融监管|外汇|人民银行|央行|国资委|中粮|中石油|中石化|中海油|华润|中信|国开行|开发银行|电网|烟草|中投|汇金|交易所|期货/
  for (const f of readdirSync('research/falls-list').filter((f) => f.endsWith('.yaml'))) {
    const rows = (parse(readFileSync(`research/falls-list/${f}`, 'utf8')) ?? []) as Row[]
    for (const r of rows) {
      if (!SOE.test(r.post ?? '')) continue
      const has = (r.id && falls.has(r.id)) || people.some((p) => p.name === r.name && falls.has(p.id))
      out.push(`${has ? 'HAS ' : 'MISS'}\t${f.replace('.yaml', '')}\t${r.date ?? ''}\t${r.name}\t${r.post}\t${has ? '' : show(r.name)}`)
    }
  }
  out.push(`## cards with a fall or a fallen status but no case record (SOE / finance headlines)`)
  for (const p of people)
    if (!falls.has(p.id) && ((p.fall ?? []).length || ['purged', 'detained', 'missing'].includes(p.status)) && SOE.test(p.headline ?? ''))
      out.push(`CARD\t${p.id}\t${p.name}\t${p.file}\t${p.status}\tfall=${(p.fall ?? []).length}\t${p.headline}`)
  out.push(`## case records: ${falls.size}`)
  const byFile = new Map<string, string[]>()
  for (const [id, f] of falls) byFile.set(f, [...(byFile.get(f) ?? []), id])
  for (const [f, ids] of byFile) out.push(`${f}\t${ids.length}\t${ids.join(' ')}`)
}
writeFileSync('.probe/R10-have.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)
