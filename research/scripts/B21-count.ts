import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people = parse(readFileSync('content/people/B21.yaml', 'utf8')) as Record<string, any>[] | Record<string, any>
const quotes = parse(readFileSync('content/quotes/B21.yaml', 'utf8')) as Record<string, any[]>
const list: any[] = Array.isArray(people) ? people : Object.entries(people).map(([id, p]) => ({ id, ...p }))
const han = (s: string) => (s.match(/[\u3400-\u9fff]/g) ?? []).length
const out: string[] = []
for (const p of list) {
  const parts: string[] = [p.bio ?? '']
  for (const l of p.life ?? []) parts.push(l.text ?? '')
  for (const a of p.assess ?? []) parts.push(a.text ?? '')
  for (const f of p.family ?? []) parts.push(f.text ?? f.note ?? '')
  const qs = quotes[p.id] ?? []
  for (const q of qs) parts.push(q.zh ?? q.text ?? '')
  const lifeLens = (p.life ?? []).map((l: any) => han(l.text ?? ''))
  const srcs = new Set<string>([...(p.cites ?? [])])
  for (const l of p.life ?? []) for (const c of l.cites ?? []) srcs.add(c)
  for (const a of p.assess ?? []) srcs.add(a.cite)
  for (const q of qs) srcs.add(q.cite)
  out.push(`${p.id}: total ${han(parts.join(''))} bio ${han(p.bio ?? '')} life ${lifeLens.join('/')} assess ${(p.assess ?? []).length} quotes ${qs.length} sources ${srcs.size}`)
}
writeFileSync('.probe/b21-count.txt', out.join('\n') + '\n')
