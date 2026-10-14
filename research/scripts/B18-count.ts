import { readFileSync } from 'node:fs'
import { parse } from 'yaml'

const len = (s?: string) => (s ?? '').replace(/\s/g, '').length
const people = parse(readFileSync('content/people/B18.yaml', 'utf8'))
const quotes = parse(readFileSync('content/quotes/B18.yaml', 'utf8'))
for (const p of people) {
  const bio = len(p.bio)
  const life = p.life.map((l: any) => len(l.text))
  const assess = p.assess.reduce((n: number, a: any) => n + len(a.text), 0)
  const family = (p.family ?? []).reduce((n: number, f: any) => n + len(f.text), 0)
  const q = (quotes[p.id] ?? []).reduce((n: number, x: any) => n + len(x.text), 0)
  const body = bio + life.reduce((a: number, b: number) => a + b, 0) + family
  const ids = new Set<string>([...p.cites, ...p.life.flatMap((l: any) => l.cites), ...p.assess.map((a: any) => a.cite), ...(quotes[p.id] ?? []).map((x: any) => x.cite)])
  console.log(p.id, 'bio', bio, 'life', life.join('/'), 'family', family, 'body', body, 'assess', assess, 'quotes', q, 'total', body + assess + q, 'sources', ids.size)
}
