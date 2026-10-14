// One-off: character counts and source tallies for the B17 biographies.
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people = parse(readFileSync('content/people/B17.yaml', 'utf8')) as any[]
const len = (s?: string) => (s ? [...s.replace(/\s+/g, '')].length : 0)
const out: string[] = []
for (const p of people) {
  const life = p.life.map((l: any) => len(l.text))
  const total = len(p.bio) + life.reduce((a: number, b: number) => a + b, 0) + (p.family ?? []).reduce((a: number, f: any) => a + len(f.text), 0)
  const ids = new Set<string>([...p.cites, ...p.life.flatMap((l: any) => l.cites), ...(p.assess ?? []).map((a: any) => a.cite), ...(p.family ?? []).flatMap((f: any) => f.cites)])
  const cjk = (s?: string) => (s && /[\u4e00-\u9fff]/.test(s) ? len(s) : 0)
  const assess = (p.assess ?? []).reduce((a: number, x: any) => a + (cjk(x.text) || len(x.zh)), 0)
  const quotes = ((parse(readFileSync('content/quotes/B17.yaml', 'utf8')) as any)[p.id] as any[]).reduce((a: number, q: any) => a + (cjk(q.text) || len(q.zh)), 0)
  out.push(`${p.id}: bio ${len(p.bio)}, life ${life.join('/')}, total ${total}, assess ${assess}, quotes ${quotes}, sources ${ids.size}`)
  out.push(`  ${[...ids].join(' ')}`)
}
writeFileSync('.probe/b17-count.txt', out.join('\n') + '\n')
