// BD2: where each listed person lives, what the card has, and birth dates already sitting in archived texts
//   node research/scripts/BD2-probe.ts  -> .probe/bd2-probe.txt, .probe/bd2-probe.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const list = readFileSync('research/lists/R17-no-born.txt', 'utf8').split('\n').filter((l) => l.trim()).map((l) => {
  const [id, name, roles, headline, bp] = l.replace(/\r$/, '').split('\t')
  return { id, name, roles, headline, bp }
})
const want = new Map(list.map((p) => [p.id, p]))

const cards = new Map<string, { file: string; p: any }>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const arr = parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []
  for (const p of arr) if (want.has(p.id)) cards.set(p.id, { file: f, p })
}

const texts = new Map<string, string>()
for (const f of readdirSync('sources/text')) texts.set(f.replace(/\.txt$/, ''), readFileSync(`sources/text/${f}`, 'utf8'))
const wd = new Map<string, any>()
for (const f of readdirSync('research/wikidata')) {
  try {
    const r = JSON.parse(readFileSync(`research/wikidata/${f}`, 'utf8'))
    wd.set(r.qid, r)
  } catch {}
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function births(name: string) {
  const hits: { src: string; snip: string }[] = []
  const re = new RegExp(
    `${esc(name)}[^。\\n]{0,60}?(\\d{4})年(\\d{1,2}月)?(\\d{1,2}日)?(出)?生|${esc(name)}[^。\\n]{0,60}?生于(\\d{4})年|${esc(name)}[（(](\\d{4})年|${esc(name)}[^。\\n]{0,40}?(\\d{4})\\.(\\d{1,2})`,
    'g',
  )
  for (const [id, t] of texts) {
    if (!t.includes(name)) continue
    for (const m of t.matchAll(re)) {
      hits.push({ src: id, snip: t.slice(m.index!, m.index! + m[0].length + 20).replace(/\s+/g, ' ') })
      if (hits.length > 8) return hits
    }
  }
  return hits
}

const out: string[] = []
const json: any[] = []
for (const x of list) {
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
    `${x.id}\t${x.name}\t${c.file}\tborn=${p.born ?? '-'}\tbp=${p.birthplace ?? '-'}\torigin=${p.origin ?? '-'}\twd=${q ?? '-'}${w ? `(born=${w.born ?? '-'} bp=${w.birthplace ?? '-'})` : q ? '(no rec)' : ''}\tverify=${p.verify ?? '-'}\tpos=${p.positions?.length ?? 0}`,
  )
  out.push(`   ${x.headline}`)
  out.push(`   cites: ${(p.cites ?? []).join(' ')}`)
  for (const h of b) out.push(`   HIT ${h.src}: ${h.snip}`)
  json.push({ id: x.id, name: x.name, file: c.file, born: p.born, wd: q, wdBorn: w?.born, cites: p.cites, births: b })
}
writeFileSync('.probe/bd2-probe.txt', out.join('\n') + '\n', 'utf8')
writeFileSync('.probe/bd2-probe.json', JSON.stringify(json, null, 1), 'utf8')
console.log('ok', cards.size)
