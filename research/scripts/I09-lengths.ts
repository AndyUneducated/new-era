// Character counts for I09 cards against the howto limits (tier 1: bio 150–300, life 100–300 each; tier 2: bio 60–150).
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type P = { id: string; tier: number; bio: string; life?: { h: string; text: string }[]; assess?: unknown[] }
const n = (s: string) => [...s.replace(/\s+/g, '')].length
const out: string[] = []
for (const p of parse(readFileSync('content/people/I09.yaml', 'utf8')) as P[]) {
  const life = (p.life ?? []).map((l) => n(l.text))
  const total = n(p.bio) + life.reduce((a, b) => a + b, 0)
  out.push(`${p.id} tier${p.tier} bio=${n(p.bio)} life=[${life.join(',')}] total=${total} assess=${p.assess?.length ?? 0}`)
}
writeFileSync('.probe/i09-lengths.txt', out.join('\n') + '\n')
