import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people = parse(readFileSync('content/people/B15.yaml', 'utf8')) as any[]
const len = (s: string) => [...(s ?? '').replace(/\s+/g, '')].length
const out: string[] = []
for (const p of people) {
  const bio = len(p.bio)
  const life = (p.life ?? []).map((l: any) => len(l.text))
  const assess = (p.assess ?? []).reduce((n: number, a: any) => n + len(a.zh ?? a.text), 0)
  const family = (p.family ?? []).reduce((n: number, f: any) => n + len(f.text), 0)
  const total = bio + life.reduce((a: number, b: number) => a + b, 0) + assess + family
  const cites = new Set<string>([...(p.cites ?? []), ...(p.life ?? []).flatMap((l: any) => l.cites ?? []), ...(p.assess ?? []).map((a: any) => a.cite), ...(p.positions ?? []).map((x: any) => x.cite)])
  out.push(`${p.id} bio=${bio} life=[${life.join(',')}] assess=${assess} total=${total} sources=${cites.size}`)
}
writeFileSync('.probe/b15-count.txt', out.join('\n') + '\n')
