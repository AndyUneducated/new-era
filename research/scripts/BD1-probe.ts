// BD1: where each listed person lives, what the card has, and birth dates already sitting in archived texts
//   node research/scripts/BD1-probe.ts  -> .probe/bd1-probe.txt, .probe/bd1-probe.json
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'

const list = (f: string) =>
  readFileSync(`research/lists/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => {
    const [id, name, status, headline] = l.split('\t')
    return { id, name, status, headline }
  })
const noBorn = list('R15-no-born.txt')
const noPos = list('R15-no-positions.txt')
const want = new Map([...noBorn, ...noPos].map((p) => [p.id, p]))

const cards = new Map<string, { file: string; p: any }>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const arr = parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []
  for (const p of arr) if (want.has(p.id)) cards.set(p.id, { file: f, p })
}

const textDir = 'sources/text'
const textFiles = readdirSync(textDir)
const texts = new Map<string, string>()
for (const f of textFiles) texts.set(f.replace(/\.txt$/, ''), readFileSync(`${textDir}/${f}`, 'utf8'))
const wd = new Map<string, any>()
for (const f of readdirSync('research/wikidata')) {
  const r = JSON.parse(readFileSync(`research/wikidata/${f}`, 'utf8'))
  wd.set(r.qid, r)
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function births(name: string) {
  const hits: { src: string; snip: string }[] = []
  const re = new RegExp(`${esc(name)}[^。\\n]{0,40}?(\\d{4})年(\\d{1,2}月)?(出)?生|${esc(name)}[^。\\n]{0,40}?生于(\\d{4})年(\\d{1,2}月)?|${esc(name)}[（(](\\d{4})年`, 'g')
  for (const [id, t] of texts) {
    if (!t.includes(name)) continue
    for (const m of t.matchAll(re)) {
      hits.push({ src: id, snip: t.slice(m.index!, m.index! + m[0].length + 20).replace(/\s+/g, ' ') })
      if (hits.length > 6) return hits
    }
  }
  return hits
}

const out: string[] = []
const json: any[] = []
for (const [tag, arr] of [['NOBORN', noBorn], ['NOPOS', noPos]] as const) {
  out.push(`### ${tag} ${arr.length}`)
  for (const x of arr) {
    const c = cards.get(x.id)
    if (!c) {
      out.push(`${x.id}\t${x.name}\tNO CARD`)
      continue
    }
    const p = c.p
    const q = p.ids?.wikidata
    const w = q ? wd.get(q) : undefined
    const b = births(x.name)
    out.push(
      `${x.id}\t${x.name}\t${c.file}\tborn=${p.born ?? '-'}\tbp=${p.birthplace ?? '-'}\tpos=${p.positions?.length ?? 0}\twd=${q ?? '-'}${w ? `(born=${w.born ?? '-'} bp=${w.birthplace ?? '-'})` : q ? '(no rec)' : ''}\tverify=${p.verify ?? '-'}`,
    )
    out.push(`   cites: ${(p.cites ?? []).join(' ')}`)
    for (const h of b) out.push(`   HIT ${x.id} ${h.src}: ${h.snip}`)
    json.push({ tag, id: x.id, name: x.name, file: c.file, born: p.born, birthplace: p.birthplace, npos: p.positions?.length ?? 0, wd: q, wdBorn: w?.born, wdBp: w?.birthplace, cites: p.cites, births: b })
  }
}
writeFileSync('.probe/bd1-probe.txt', out.join('\n') + '\n', 'utf8')
writeFileSync('.probe/bd1-probe.json', JSON.stringify(json, null, 1), 'utf8')
console.log('ok', cards.size, existsSync('.probe'))
