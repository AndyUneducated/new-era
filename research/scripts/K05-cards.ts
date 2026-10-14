// K05: write content/people/K05.yaml and research/roster/K05.yaml from the hand-written cards (K05-data.ts),
// the picked ids (K05-ids.ts), the lead facts (.probe/K05-facts.json) and the K01 lists. Field conflicts and
// derived values go to .probe/K05-cards.txt.
//   node research/scripts/K05-cards.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { D } from './K05-data.ts'
import { PEOPLE } from './K05-ids.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8')
type Fact = { born?: string; birthplace?: string; desc?: string; lead?: string; leadBorn?: string }
const facts = JSON.parse(read('.probe', 'K05-facts.json')) as Record<string, Fact>
const reuse = JSON.parse(read('.probe', 'K05-reuse.json')) as Record<string, string>
const hasText = (id: string) => existsSync(join(ROOT, 'sources', 'text', `${id}.txt`))
const q = (s: string) => (/^[\p{Script=Han}\w·（）、，。；（）—\- ]+$/u.test(s) && !/^[-\d]/.test(s) && !/[:#]/.test(s) ? s : JSON.stringify(s))
const SYS: Record<string, string> = { p: 'party', g: 'gov', a: 'army', o: 'other' }
const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const cn = (n: number) => (n < 20 ? '十' + NUM[n - 10] : NUM[Math.floor(n / 10)] + '十' + NUM[n % 10])
const LIST: Record<string, string> = {
  '19cc': 'k02-xinhua-2017-10-24-19-cc', '19cca': 'k02-xinhua-2017-10-24-19-cca', '20cc': 'k02-xinhua-2022-10-22-20-cc', '20cca': 'k02-xinhua-2022-10-22-20-cca',
}
const plain = (s: string) => s.replace(/（.*?）/g, '')

// the cc / cca lists of terms 19 and 20 from K01
const k01 = read('content', 'congresses', 'K01.yaml')
const lists: Record<string, Set<string>> = {}
for (const term of [19, 20]) {
  const block = k01.slice(k01.indexOf(`- n: ${term}\n`)).split(/\n- n: /)[0]
  for (const key of ['cc', 'cca']) {
    const m = block.match(new RegExp(`\\n  ${key}: \\[([^\\]]*)\\]`))
    lists[`${term}${key}`] = new Set((m ? m[1] : '').split(',').map((s) => s.trim()).filter(Boolean))
  }
}
const plain20: Record<string, string[]> = {}
for (const key of ['20cc', '20cca']) for (const n of lists[key]) (plain20[plain(n)] ??= []).push(key)
// homonyms on the 20th lists that are not the K05 person
const NOT20 = new Set(['deng-xiaogang-pla', 'deng-xiaogang-sichuan', 'wang-hai', 'wang-hong'])

// gender and ethnicity from the annotated list texts: 布小林（女，蒙古族）
const ann = new Map<string, { f: boolean; eth?: string }>()
for (const id of [LIST['20cc'], LIST['20cca'], LIST['19cc'], LIST['19cca']]) {
  for (const m of read('sources', 'text', `${id}.txt`).matchAll(/([\p{Script=Han}·]{2,12})（([^）]*)）/gu)) {
    const parts = m[2].split('，')
    const rest = parts.filter((p) => p !== '女' && !/族$/.test(p))
    const key = m[1] + (rest.length ? `（${rest.join('，')}）` : '')
    ann.set(key, { f: parts.includes('女'), eth: parts.find((p) => /族$/.test(p)) })
  }
}

const PROV = '北京 天津 上海 重庆 河北 山西 辽宁 吉林 黑龙江 江苏 浙江 安徽 福建 江西 山东 河南 湖北 湖南 广东 海南 四川 贵州 云南 陕西 甘肃 青海 台湾 内蒙古 广西 西藏 宁夏 新疆'.split(' ')
// 江苏省常州市 -> 江苏常州, but 四川渠县 keeps its one-character county as 四川渠县
const normBp = (s: string) => {
  const t = s.replace(/(维吾尔|壮族|回族)?自治区/g, '')
  const p = PROV.find((x) => t.startsWith(x)) ?? ''
  const rest = t.slice(p.length).replace(/^(省|市)/, '')
  return p + rest.replace(/([\p{Script=Han}]+?)(地区|省|市|县|区)/gu, (m, a: string) => (a.length >= 2 ? a : m))
}
const leadBp = (lead?: string) => {
  const m = lead?.split('。')[0].match(/[，、]([\p{Script=Han}]{2,14}?)人(?:[，。；]|$)/u)
  return m ? normBp(m[1]) : undefined
}

const notes: string[] = []
const cards: string[] = []
const roster: string[] = []
const listed = new Set<string>()
for (const [listName, id, qid] of PEOPLE) {
  listed.add(id)
  const c = D[id]
  if (!c) { notes.push(`NO CARD ${id} ${listName}`); continue }
  const name = plain(listName)
  const fa = facts[id] ?? {}
  const seats: string[] = []
  for (const k of ['19cc', '19cca']) if (lists[k].has(listName)) seats.push(k)
  if (!seats.length) notes.push(`NOT ON 19TH LIST ${id} ${listName}`)
  if (!NOT20.has(id)) for (const k of plain20[name] ?? []) seats.push(k)
  if ((plain20[name] ?? []).length && NOT20.has(id)) notes.push(`20TH HOMONYM SKIPPED ${id} ${name}`)
  const cc = seats.filter((k) => k.endsWith('cc')).map((k) => Number(k.slice(0, 2)))
  const cca = seats.filter((k) => k.endsWith('cca')).map((k) => Number(k.slice(0, 2)))
  const seatText = [
    cca.length ? `${cca.map(cn).join('、')}届中央候补委员` : '',
    cc.length ? `${cc.map(cn).join('、')}届中央委员` : '',
  ].filter(Boolean).join('、')
  const a = ann.get(listName) ?? ann.get(name)
  const born = c.born ?? fa.leadBorn ?? fa.born
  if (fa.leadBorn && fa.born && fa.leadBorn.slice(0, 4) !== fa.born.slice(0, 4)) notes.push(`BORN ${id}: lead ${fa.leadBorn} / wd ${fa.born} -> ${born}`)
  if (c.born && fa.leadBorn && c.born !== fa.leadBorn) notes.push(`BORN override ${id}: lead ${fa.leadBorn} -> ${c.born}`)
  const lb = leadBp(fa.lead)
  const bp = c.bp ?? lb
  notes.push(`BP ${id}: ${bp ?? '-'} (lead ${lb ?? '-'} / wd ${fa.birthplace ?? '-'}${c.bp ? ' / hand' : ''})`)
  const reused = reuse[id] && hasText(reuse[id]) ? reuse[id] : undefined
  const main = c.main ?? reused ?? `k05-wiki-${id}`
  if (!hasText(main)) notes.push(`MAIN HAS NO TEXT ${id} ${main}`)
  const r = c.r ?? []
  const roles = [...new Set([cc.length || r.includes('cc') ? 'cc' : 'acc', ...r.filter((x) => x !== 'cc')])]
  const fall = (c.f ?? []).map(([date, text, cite]) => `    - { date: ${date}, text: ${q(text)}, cite: ${cite} }`)
  if (c.p.length < 3) notes.push(`FEW POSITIONS ${id}: ${c.p.length}`)
  const posCites: string[] = []
  const pos = c.p.map((s) => {
    const [title, sys, place, from, to, cite] = s.split('|')
    if (!SYS[sys]) notes.push(`BAD SYS ${id} ${s}`)
    const pc = cite || main
    posCites.push(pc)
    return `    - { title: ${q(title)}, sys: ${SYS[sys]}${place ? `, place: ${place}` : ''}${from ? `, from: ${from}` : ''}${to ? `, to: ${to}` : ''}, cite: ${pc} }`
  })
  const cites = [...new Set([
    ...(qid ? [`wd-${qid}`] : []), main,
    ...seats.map((k) => LIST[k]),
    ...(c.f ?? []).map((x) => x[2]), ...(c.c ?? []), ...posCites,
  ])]
  const lead = `${bp ? `${bp}人，` : ''}${a?.eth ? `${a.eth}，` : ''}${seatText}。`
  cards.push([
    `- id: ${id}`,
    `  name: ${name}`,
    `  gender: ${a?.f ? 'f' : 'm'}`,
    ...(a?.eth ? [`  ethnicity: ${a.eth}`] : []),
    ...(born ? [`  born: ${born}`] : []),
    ...(c.died ? [`  died: ${c.died}`] : []),
    ...(bp ? [`  birthplace: ${bp}`] : []),
    ...(c.origin ? [`  origin: ${c.origin}`] : []),
    `  roles: [${roles.join(', ')}]`,
    `  status: ${c.s}`,
    ...(c.sn ? [`  statusNote: ${q(c.sn)}`] : []),
    ...(fall.length ? ['  fall:', ...fall] : []),
    '  tier: 2',
    `  headline: ${q(c.h)}`,
    ...(qid ? [`  ids: { wikidata: ${qid} }`] : []),
    '  bio: >-',
    `    ${lead}${c.b}`,
    '  positions:', ...pos,
    `  cites: [${cites.join(', ')}]`,
    '',
  ].join('\n'))
  roster.push(`- { id: ${id}, name: ${name}, batch: K05, tier: 2 }`)
  notes.push(`SEATS ${id} ${name}: ${seats.join(' ')}${a?.f ? ' f' : ''}${a?.eth ? ` ${a.eth}` : ''}`)
}
for (const id of Object.keys(D)) if (!listed.has(id)) notes.push(`CARD NOT IN IDS ${id}`)

const head = '# K05 dossier cards (tier 2): people first on the 19th Central Committee lists, full or alternate\n# generated by research/scripts/K05-cards.ts; hand-written parts live in research/scripts/K05-data.ts\n\n'
writeFileSync(join(ROOT, 'content', 'people', 'K05.yaml'), head + cards.join('\n'), 'utf8')
writeFileSync(join(ROOT, 'research', 'roster', 'K05.yaml'), '# K05: people first on the 19th Central Committee lists\n\n' + roster.join('\n') + '\n', 'utf8')
writeFileSync(join(ROOT, '.probe', 'K05-cards.txt'), notes.join('\n') + '\n', 'utf8')
console.log(`${cards.length} cards, ${notes.length} notes`)
