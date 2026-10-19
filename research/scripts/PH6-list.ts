// PH6 work list: people already in content/people (files of in-flight batches skipped) who have no portrait,
// in the round13.md order — 1. left over from PH5; 2. on the people list of a case (content/cases/*.yaml);
// 3. other tier-2 cards of Central Committee members, full generals and centrally managed cadres.
// Writes .probe/PH6-list.txt (id, name, headline, which cases).
//   node research/scripts/PH6-list.ts
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type P = { id: string; name: string; roles?: string[]; status?: string; headline?: string; tier?: number; bio?: string }
const inflight = new Set<string>((parse(readFileSync('research/round.yaml', 'utf8')) as { inflight: string[] }).inflight)
const people = new Map<string, P & { file: string }>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  if (inflight.has(f.replace(/\.yaml$/, ''))) continue
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) if (p?.id) people.set(p.id, { ...p, file: f })
}
const entries = new Set<string>()
if (existsSync('content/photos.yaml')) for (const id of Object.keys(parse(readFileSync('content/photos.yaml', 'utf8')) ?? {})) entries.add(id)
for (const f of readdirSync('content/photos').filter((f) => f.endsWith('.yaml') && f !== 'PH6.yaml'))
  for (const id of Object.keys(parse(readFileSync(`content/photos/${f}`, 'utf8')) ?? {})) entries.add(id)
const hasFile = (id: string) => ['jpg', 'png', 'webp'].some((x) => existsSync(`public/photos/${id}.${x}`))
const missing = (id: string) => !hasFile(id)

const cases = new Map<string, string[]>()
for (const f of readdirSync('content/cases').filter((f) => f.endsWith('.yaml'))) {
  if (inflight.has(f.replace(/\.yaml$/, ''))) continue
  for (const c of (parse(readFileSync(`content/cases/${f}`, 'utf8')) ?? []) as { id: string; people?: string[] }[])
    for (const id of c.people ?? []) cases.set(id, [...(cases.get(id) ?? []), c.id])
}

const RANK = ['psc', 'pb', 'cmc', 'sec', 'general', 'cc', 'prov', 'minister', 'ccdi', 'acc', 'tiger']
const rank = (p: P) => {
  const i = RANK.findIndex((k) => (p.roles ?? []).includes(k))
  return i < 0 ? RANK.length : i
}
const row = (p: P & { file: string }) =>
  `- ${p.id} ${p.name}（${(p.headline ?? '').slice(0, 60)}）[${(p.roles ?? []).join(',')}] ${p.file}${cases.has(p.id) ? ` cases=${cases.get(p.id)!.join(',')}` : ''}${entries.has(p.id) ? ' ENTRY-NO-FILE' : ''}`

const g1 = ['wang-wenquan', 'xu-xisheng', 'li-chuanguang', 'dong-hong', 'sun-bo-csic'].map((id) => people.get(id)!).filter(Boolean)
const done = new Set(g1.map((p) => p.id))
const g2 = [...cases.keys()]
  .filter((id) => !done.has(id) && missing(id))
  .map((id) => people.get(id))
  .filter((p): p is P & { file: string } => !!p)
  .sort((a, b) => rank(a) - rank(b))
const noCard = [...cases.keys()].filter((id) => !people.has(id))
for (const p of g2) done.add(p.id)
const central = (p: P) =>
  (p.roles ?? []).some((r) => ['psc', 'pb', 'cmc', 'sec', 'cc', 'prov', 'minister', 'ccdi', 'acc'].includes(r)) ||
  /上将/.test(`${p.headline} ${p.bio?.slice(0, 200)}`) ||
  ((p.roles ?? []).includes('tiger') && /中管|副部|部长|省委|董事长|总经理|行长|主席/.test(p.headline ?? ''))
const g3 = [...people.values()]
  .filter((p) => !done.has(p.id) && p.tier === 2 && missing(p.id) && central(p))
  .sort((a, b) => rank(a) - rank(b))
const restAll = [...people.values()].filter((p) => missing(p.id)).length

writeFileSync(
  '.probe/PH6-list.txt',
  [
    `people ${people.size}, without photo file ${restAll}`,
    `\n## 1 (${g1.length})`,
    ...g1.map(row),
    `\n## 2 case people without photo (${g2.length})`,
    ...g2.map(row),
    `\n## case people with no card (${noCard.length}): ${noCard.join(' ')}`,
    `\n## 3 tier 2 central (${g3.length})`,
    ...g3.map(row),
  ].join('\n') + '\n',
)
console.log(`g1 ${g1.length} g2 ${g2.length} g3 ${g3.length} nocard ${noCard.length}`)
