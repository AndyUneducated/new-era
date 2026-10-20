// Round 15 worklists, read from the built public/data/db.json: node research/scripts/R15-lists.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
const d = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const dir = 'research/lists'
mkdirSync(dir, { recursive: true })
const line = (p, extra = '') => `${p.id}\t${p.name}\t${p.status}\t${p.headline ?? ''}${extra ? `\t${extra}` : ''}`
const write = (name, rows) => writeFileSync(`${dir}/${name}`, rows.join('\n') + '\n', 'utf8')

const inRel = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const byCase = new Map()
for (const c of d.cases) for (const id of c.people) byCase.set(id, [...(byCase.get(id) ?? []), c.id])
const people = new Map(d.people.map((p) => [p.id, p]))
write('R15-case-people-no-relation.txt', [...byCase].filter(([id]) => !inRel.has(id) && people.has(id)).map(([id, cs]) => line(people.get(id), cs.join(','))))

write('R15-no-born.txt', d.people.filter((p) => !p.born).map((p) => line(p, p.roles.join(','))))
write('R15-no-positions.txt', d.people.filter((p) => !p.positions.length).map((p) => line(p, p.roles.join(','))))

const fallen = new Set(['purged', 'detained', 'missing', 'dead', 'exiled'])
const noPhoto = d.people.filter((p) => !p.photo)
const rank = (p) => (byCase.has(p.id) ? 0 : p.case ? 1 : fallen.has(p.status) ? 2 : p.roles.some((r) => ['cc', 'general', 'minister', 'prov', 'ccdi'].includes(r)) ? 3 : 4)
write('R15-no-photo.txt', noPhoto.sort((a, b) => rank(a) - rank(b)).map((p) => line(p, `rank${rank(p)} ${p.roles.join(',')}`)))

const OFFICIAL = new Set(['tiger', 'psc', 'pb', 'cc', 'cmc', 'general', 'minister', 'prov', 'ccdi', 'sec'])
const official = (p) => p.roles.some((r) => OFFICIAL.has(r))
write('R15-outside-cases.txt', d.people.filter((p) => p.case && !official(p)).map((p) => line(p, `${p.roles.join(',')} politics=${p.case.politics?.level ?? '-'} trigger=${p.case.trigger?.kind ?? '-'}`)))

const sentenced = d.people.filter((p) => p.case?.term)
write('R15-sentenced-no-plea.txt', sentenced.filter((p) => !p.case.pleas.length).map((p) => line(p, p.case.sentenced ?? '')))

const turns = d.people.filter((p) => p.turn)
write('R15-turns.txt', turns.map((p) => line(p, p.turn.routes.join(','))))
console.log('done')
