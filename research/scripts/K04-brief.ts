// K04: per-person drafting brief and the mechanical card fields. Reads the picks, the zh.wikipedia texts in
// .probe/K04-wiki/, the Wikidata records, the English labels and the K02 list texts (gender / ethnicity notes).
//   node research/scripts/K04-brief.ts
// Writes .probe/K04-auto.json (fields per key) and .probe/K04-brief-<n>.txt (50 people per file).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Pick = { key: string; name: string; seats: string; qid?: string; title?: string }
const picks = Object.values(JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-picks.json'), 'utf8')) as Record<string, Pick>)
const en = JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-en.json'), 'utf8')) as Record<string, string>
const taken = new Set(readFileSync(join(ROOT, '.probe', 'K04-taken.txt'), 'utf8').split('# ids')[1].split(/\s+/).filter(Boolean))

// list notes: 马馼（女） / 刘慧（女，回族） / 王国生（军队）
const notes = new Map<string, { f?: boolean; eth?: string }>()
for (const f of ['2007-10-21-17-cc', '2007-10-21-17-cca', '2012-11-14-18-cc', '2012-11-14-18-cca', '2017-10-24-19-cc', '2017-10-24-19-cca', '2022-10-22-20-cc', '2022-10-22-20-cca']) {
  const t = readFileSync(join(ROOT, 'sources', 'text', `k02-xinhua-${f}.txt`), 'utf8')
  for (const m of t.matchAll(/([\u4e00-\u9fff·]{2,20})（([^）]+)）/g)) {
    const bits = m[2].split('，')
    const n = notes.get(m[1]) ?? {}
    if (bits.includes('女')) n.f = true
    const eth = bits.find((b) => b.endsWith('族'))
    if (eth) n.eth = eth
    notes.set(m[1], n)
  }
}

const ascii = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const auto: Record<string, unknown> = {}
const out: string[][] = [[]]
const used = new Set<string>()
for (const p of picks) {
  const text = readFileSync(join(ROOT, '.probe', 'K04-wiki', `${p.key}.txt`), 'utf8')
  const url = /^URL (\S+)/.exec(text)?.[1]
  const pageTitle = /\n([^\n]+?) - 维基百科，自由的百科全书/.exec(text)?.[1]
  const paras = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  const li = paras.findIndex((s) => /^[^，。\s]{1,16}（[^）]*\d{4}年/.test(s) && s.length > 30)
  const ei = paras.findIndex((s, i) => i > li && /^(参考文献|参考资料|参见|外部链接|注释|参考来源|延伸阅读)$/.test(s))
  const lead = li >= 0 ? paras[li].replace(/\[\d+\]/g, '') : ''
  const body = li >= 0 ? paras.slice(li + 1, ei > 0 ? ei : li + 60).map((s) => s.replace(/\[\d+\]/g, '')) : []
  const lb = /（(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?\s*[—\-－–]/.exec(lead)
  const born = lb ? [lb[1], lb[2]?.padStart(2, '0'), lb[3]?.padStart(2, '0')].filter(Boolean).join('-') : undefined
  const lbp = /(?:族|男|女)，([^，。（）]{2,14}?)人[，。]/.exec(lead)
  const wd = p.qid && existsSync(join(ROOT, 'research', 'wikidata', `${p.qid}.json`)) ? JSON.parse(readFileSync(join(ROOT, 'research', 'wikidata', `${p.qid}.json`), 'utf8')) : undefined
  const bare = p.name
  const note = notes.get(bare) ?? {}
  const female = note.f || /，女，/.test(lead.slice(0, 80))
  const eth = note.eth ?? /，([\u4e00-\u9fff]{1,5}族)，/.exec(lead.slice(0, 120))?.[1]
  let id = ascii(en[p.qid ?? ''] ?? '')
  const clash = !id || taken.has(id) || used.has(id)
  used.add(id)
  const seats = [...p.seats.matchAll(/(\d+)(中委|候补)/g)].map((m) => ({ term: Number(m[1]), cc: m[2] === '中委' }))
  auto[p.key] = { name: bare, id, qid: p.qid, wd: !!wd, wdBorn: wd?.born, wdDied: wd?.died, wdBp: wd?.birthplace, born, birthplace: lbp?.[1], female, eth: eth === '汉族' ? undefined : eth, seats, url, pageTitle, leadStart: lead.slice(0, 12), end: ei > 0 ? paras[ei] : undefined }
  // sentences naming a year, an appointment and a senior title, oldest first
  const TOP = /书记|省长|主席|部长|司令|政委|政治委员|主任|局长|署长|行长|董事长|总经理|院长|校长|社长|会长|秘书长|审计长|检察长|军长|参谋长|市长|主任委员|副委员长|理事长/
  const sents = body
    .flatMap((s) => s.split(/(?<=[。；])/))
    .map((s) => s.trim())
    .filter((s) => /(199\d|20\d\d)年/.test(s) && /任|当选|升|调|接替|兼/.test(s) && TOP.test(s) && !/^(\^|前任|继任)/.test(s))
  const seen = new Set<string>()
  const career = sents.map((s) => s.replace(/^(?:其后|此后|随后|同年|之后)[，,]?/, '').slice(0, 64)).filter((s) => !seen.has(s) && seen.add(s))
  const lines = [
    `### ${p.key} | ${id}${clash ? ' CLASH' : ''} | ${p.seats} | ${p.qid}${wd ? '' : ' NO-WD'} | b ${born ?? '?'} (wd ${wd?.born ?? '?'}${wd?.died ? ` d.${wd.died}` : ''}) | ${lbp?.[1] ?? '?'} (wd ${wd?.birthplace ?? '?'}) | ${female ? 'F' : 'M'} ${eth ?? ''}`,
    `L: ${lead.replace(/^[^（]*（[^）]*）[，,]?/, '').slice(0, 230)}`,
    ...career.slice(-9).map((s) => `C: ${s}`),
    '',
  ]
  if (out[out.length - 1].filter((l) => l.startsWith('###')).length >= 50) out.push([])
  out[out.length - 1].push(...lines)
}
writeFileSync(join(ROOT, '.probe', 'K04-auto.json'), JSON.stringify(auto, null, 1))
out.forEach((chunk, i) => writeFileSync(join(ROOT, '.probe', `K04-brief-${i}.txt`), chunk.join('\n') + '\n'))
console.log(`${picks.length} people, ${out.length} brief files`)
