// Lists fallen people whose case is still open on file (last step an investigation, expulsion, arrest, charge or
// trial, no verdict yet), with the date of that step, to look for 2026 steps the cards do not have.
//   node research/scripts/C15-pending.ts -> .probe/C15-pending.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Step = { date: string | number; text: string }
type P = { id: string; name: string; status: string; fall?: Step[]; roles?: string[]; headline?: string }
const recs = new Map<string, { fall?: Step[]; outcome?: string; grade?: string; sys?: string }>()
const recFile = new Map<string, string>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const [id, r] of Object.entries((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as Record<string, never>)) {
    recs.set(id, r ?? {})
    recFile.set(id, f)
  }
const kind = (t: string) =>
  /判处|判决|宣判|死刑|无期|有期徒刑|二审|维持原判|驳回上诉/.test(t)
    ? 'verdict'
    : /开庭|公开审理|受审/.test(t)
      ? 'trial'
      : /提起公诉|起诉/.test(t)
        ? 'charge'
        : /逮捕/.test(t)
          ? 'arrest'
          : /开除|撤销.*职务|处分/.test(t)
            ? 'expel'
            : /审查|调查|留置|立案/.test(t)
              ? 'probe'
              : /去世|死亡|自杀/.test(t)
                ? 'death'
                : 'other'
const out: string[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) {
    const r = recs.get(p.id)
    const steps = [...(p.fall ?? []), ...(r?.fall ?? [])].map((s) => ({ d: String(s.date), k: kind(s.text), t: s.text }))
    if (!steps.length) continue
    steps.sort((a, b) => a.d.localeCompare(b.d))
    if (steps.some((s) => s.k === 'verdict' || s.k === 'death')) continue
    const last = steps.at(-1)!
    if (last.d < '2023') continue
    if (r && !['local', 'central', 'law', 'finance', 'soe', 'edu', 'culture', 'health', 'army'].includes(String(r.sys))) continue
    out.push(`${last.d}\t${last.k}\t${p.name}\t${p.id}\t${f}\t${p.status}\trec=${recFile.get(p.id) ?? '-'}\t${r?.grade ?? ''}\t${(p.headline ?? '').slice(0, 40)}`)
  }
out.sort()
writeFileSync('.probe/C15-pending.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)
