// FX2: how cards of people outside the system who are held without a verdict are labelled, to .probe/fx2-peers.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { stepOf } from '../../src/lib/caseparse.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Any = Record<string, any>
const recs = new Map<string, Any>()
for (const f of readdirSync(join(ROOT, 'content/falls')).filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const [k, r] of Object.entries((parse(readFileSync(join(ROOT, 'content/falls', f), 'utf8')) ?? {}) as Any)) recs.set(k, r)
  } catch {}
}
const out: string[] = []
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml'))) {
  let data: Any[] = []
  try {
    data = parse(readFileSync(join(ROOT, 'content/people', f), 'utf8')) ?? []
  } catch {}
  for (const p of Array.isArray(data) ? data : []) {
    const r = recs.get(p.id)
    const fall = [...(p.fall ?? []), ...(r?.fall ?? [])]
    if (!fall.length) continue
    const kinds = fall.map((s: Any) => stepOf(String(s.text)))
    if (kinds.includes('sentenced')) continue
    const outside = (p.roles ?? []).some((x: string) => ['biz', 'dissent', 'family', 'media', 'scholar'].includes(x)) && !(p.roles ?? []).includes('tiger')
    if (!outside) continue
    out.push(`${r?.status ?? p.status}\t${p.id}\t${p.name}\t${f}\t${kinds.join(',')}\t${(r?.statusNote ?? p.statusNote ?? '').slice(0, 80)}`)
  }
}
writeFileSync(join(ROOT, '.probe/fx2-peers.txt'), out.sort().join('\n') + '\n')
