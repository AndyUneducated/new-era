// K04: settle one Wikidata item and one zh.wikipedia article per roster entry, from the CC list-page links
// (K04-wplinks.ts) and the name search (K04-find.ts), with the namesakes fixed by hand. Writes .probe/K04-picks.json.
//   node research/scripts/K04-pick.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (f: string) => JSON.parse(readFileSync(join(ROOT, '.probe', f), 'utf8'))
const { mine } = read('K04-roster.json') as { mine: { name: string; key: string; first: number; seats: string }[] }
const links = read('K04-wplinks.json') as Record<string, { title: string; qid: string }[]>
const cands = read('K04-candidates.json') as Record<string, { id: string; born?: string; desc?: string }[]>

// items that are not the person: the province 吉林, empty duplicates, a namesake page
const NOT = new Set(['Q45208', 'Q117436048', 'Q117436323', 'Q98478712'])
// by roster key: the item, checked against birth year, birthplace and career (see the report)
const HAND: Record<string, string> = {
  '王国生（军队）': 'Q5939977',
  '王国生（江苏）': 'Q2548218',
  李斌: 'Q440516',
  陈雷: 'Q3369517',
  孙建国: 'Q8292032',
  王荣: 'Q7928975',
  汤涛: 'Q8292310',
  曹清: 'Q8291809',
  王晓初: 'Q8292314',
  王勇: 'Q2548285',
  王志刚: 'Q16906030',
  巴特尔: 'Q2213172',
  李伟: 'Q8294084',
  张毅: 'Q7928429',
  王敏: 'Q18650976',
  吉林: 'Q8292278',
  王作安: 'Q8292784',
  陈志荣: 'Q8292412',
  李云峰: 'Q8292531',
}
const picks: Record<string, { key: string; name: string; seats: string; qid?: string; title?: string; why: string }> = {}
const flags: string[] = []
for (const m of mine) {
  const l = (links[m.name] ?? []).filter((x) => !NOT.has(x.qid))
  // 王国生 has two people under one name; take the page whose item matches the hand pick
  const qid = HAND[m.key] ?? [...new Set(l.map((x) => x.qid).filter((q) => /^Q\d+$/.test(q)))].at(0)
  let why = HAND[m.key] ? 'hand' : 'wplink'
  let pick = qid
  if (!pick) {
    const c = (cands[m.name] ?? []).filter((x) => x.born && +x.born.slice(0, 4) >= 1935 && +x.born.slice(0, 4) <= 1975)
    if (c.length === 1) ((pick = c[0].id), (why = 'search'))
    else flags.push(`${m.key}: ${c.length} candidates ${c.map((x) => `${x.id} ${x.born} ${x.desc}`).join(' | ')}`)
  }
  const distinct = new Set(l.map((x) => x.qid).filter((q) => /^Q\d+$/.test(q)))
  if (!HAND[m.key] && distinct.size > 1) flags.push(`${m.key}: several linked items ${[...distinct].join(' ')}`)
  const title = l.find((x) => x.qid === pick)?.title ?? l.find((x) => x.qid === '?')?.title ?? l[0]?.title
  picks[m.key] = { key: m.key, name: m.name, seats: m.seats, qid: pick, title, why }
}
writeFileSync(join(ROOT, '.probe', 'K04-picks.json'), JSON.stringify(picks, null, 1))
writeFileSync(join(ROOT, '.probe', 'K04-picks.txt'), [...flags, '', ...Object.values(picks).map((p) => `${p.key}\t${p.qid ?? '-'}\t${p.title ?? '-'}\t${p.why}`)].join('\n') + '\n')
console.log(`${Object.values(picks).filter((p) => p.qid).length}/${mine.length} picked, ${flags.length} flags`)
