// Writes research/photo-PH3.md and photo-PH4.md: people still without a portrait, highest rank first.
// PH3 opens with PH1's unfinished rows and the black-and-white portraits that could still be swapped.
import { readFileSync, writeFileSync } from 'node:fs'

type P = { id: string; name: string; roles?: string[]; status?: string; headline?: string; photo?: unknown; tier?: number }
const db = JSON.parse(readFileSync('public/data/db.json', 'utf8')) as { people: P[] }
const byId = new Map(db.people.map((p) => [p.id, p]))

const ph1 = readFileSync('research/photo-PH1.md', 'utf8').split('\n').filter((l) => l.startsWith('- '))
const leftover = ph1.slice(129).map((l) => l.match(/^- ([\w-]+)/)?.[1]).filter((id): id is string => !!id && !byId.get(id)?.photo)
const grey = ['wu-changshun', 'zhou-jiangyong']

const RANK = ['psc', 'pb', 'cmc', 'sec', 'general', 'cc', 'prov', 'minister', 'ccdi', 'acc', 'tiger']
const rank = (p: P) => {
  const r = p.roles ?? []
  const i = RANK.findIndex((k) => r.includes(k))
  return i < 0 ? RANK.length : i
}
const fallen = (p: P) => ['purged', 'detained', 'missing'].includes(p.status ?? '') || (p.roles ?? []).includes('tiger')
const taken = new Set([...leftover, ...grey])
const rest = db.people
  .filter((p) => !p.photo && !taken.has(p.id))
  .sort((a, b) => Number(fallen(b)) - Number(fallen(a)) || rank(a) - rank(b))

const line = (id: string, note = '') => {
  const p = byId.get(id)
  return p ? `- ${id} ${p.name}（${p.headline ?? ''}）${note}` : ''
}
const ph3 = [...leftover.map((id) => line(id)), ...grey.map((id) => line(id, ' [现为黑白，换彩色]')), ...rest.slice(0, 180 - leftover.length - grey.length).map((p) => line(p.id))]
const ph4 = rest.slice(180 - leftover.length - grey.length, 360 - leftover.length - grey.length).map((p) => line(p.id))

const head = (b: string) => `# ${b} 照片清单（按优先级）\n\n落马者在前，按职级排；百度百科按名字只返回默认词条，同名者务必核对职务。\n\n`
writeFileSync('research/photo-PH3.md', head('PH3') + ph3.filter(Boolean).join('\n') + '\n')
writeFileSync('research/photo-PH4.md', head('PH4') + ph4.filter(Boolean).join('\n') + '\n')
console.log(`PH3 ${ph3.length} (leftover ${leftover.length}), PH4 ${ph4.length}, without photo ${rest.length}`)
