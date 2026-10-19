// E14: compare text/cite of E14 policies with the same-key policy in other concept-more batches (E14 loads first and wins)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type P = { date: unknown; name: string; text: string; cite: string }
const key = (c: string, p: P) => `${c} ${String(p.date instanceof Date ? p.date.toISOString().slice(0, 10) : p.date)} ${p.name.replace(/[\s“”"《》]/g, '')}`
const mine = parse(readFileSync('content/concept-more/E14.yaml', 'utf8')) as Record<string, { policies: P[] }>
const others = new Map<string, P & { file: string }>()
for (const f of readdirSync('content/concept-more').filter((x) => x !== 'E14.yaml' && x.endsWith('.yaml'))) {
  const y = (parse(readFileSync(`content/concept-more/${f}`, 'utf8')) ?? {}) as Record<string, { policies?: P[] }>
  for (const [c, m] of Object.entries(y)) for (const p of m.policies ?? []) others.set(key(c, p), { ...p, file: f })
}
const out: string[] = []
for (const [c, m] of Object.entries(mine))
  for (const p of m.policies) {
    const o = others.get(key(c, p))
    if (!o) out.push(`NONE ${key(c, p)}`)
    else if (o.text !== p.text || o.cite !== p.cite) out.push(`DIFF ${key(c, p)} [${o.file}]\n  mine: ${p.cite} ${p.text}\n  orig: ${o.cite} ${o.text}`)
    else out.push(`SAME ${key(c, p)} [${o.file}]`)
  }
writeFileSync('.probe/e14-diff.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)
