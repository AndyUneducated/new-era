// One-off: character counts (CJK + Latin letters/digits, no spaces) per B22 biography.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const people = parse(readFileSync('content/people/B22.yaml', 'utf8'));
const quotes = parse(readFileSync('content/quotes/B22.yaml', 'utf8'));
const n = (s = '') => s.replace(/\s/g, '').length;
const out: string[] = [];
for (const p of people) {
  const bio = n(p.bio);
  const life = p.life.map((l: { text: string }) => n(l.text));
  const assess = p.assess.reduce((a: number, x: { text: string; zh?: string }) => a + n(x.zh ?? x.text), 0);
  const family = (p.family ?? []).reduce((a: number, x: { text: string }) => a + n(x.text), 0);
  const q = (quotes[p.id] ?? []).reduce((a: number, x: { text: string }) => a + n(x.text), 0);
  const cites = new Set<string>([...p.cites, ...p.life.flatMap((l: { cites: string[] }) => l.cites), ...p.assess.map((x: { cite: string }) => x.cite), ...(p.family ?? []).flatMap((x: { cites: string[] }) => x.cites)]);
  const total = bio + life.reduce((a: number, b: number) => a + b, 0) + assess + family;
  out.push(`${p.id}: total ${total} (+quotes ${q}) bio ${bio} life [${life.join(', ')}] assess ${assess} family ${family} sources ${cites.size}`);
}
writeFileSync('.probe/b22-count.txt', out.join('\n'));
