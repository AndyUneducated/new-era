// RL2: second pass for the R15 no-relation list — succession chains ("A → B → C" lines in archived pages),
// and every source sentence that names the person, another person on file and a succession/partner/kin keyword.
// Ambiguous names are kept (marked with ?), so the pair has to be checked by hand.
// Run: node research/scripts/RL2-chain.ts --batch=RL2 → .probe/RL2-chain.txt (UTF-8)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
const byId = new Map(d.people.map((p) => [p.id, p]))
const src = new Map(d.sources.map((s) => [s.id, s]))
const have = new Set(d.relations.map((r) => [r.a, r.b].sort().join('|')))
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const nameIds = new Map<string, string[]>()
for (const p of d.people) for (const n of [p.name, ...p.aka]) if (n && n.length >= 2) nameIds.set(n, [...new Set([...(nameIds.get(n) ?? []), p.id])])
const names = [...nameIds].sort((a, b) => b[0].length - a[0].length)
const kw =
  /接替|接任|接棒|继任|前任|后任|搭档|搭班子|共事|副手|下属|部下|老部下|旧部|亲信|心腹|嫡系|秘书|提拔|提携|重用|妻子|丈夫|夫人|之妻|之子|之女|儿子|女儿|女婿|弟弟|哥哥|情妇|举报|恩怨|对垒|政委|司令员|老上级|同事|上司|门生|举荐|推荐|引荐|靠山|庇护|攀附|团伙|圈子|兄弟|姐姐|妹妹|父亲|岳父|干爹|结拜|一手|主政|班子|书记.{0,6}市长|市长.{0,6}书记|揭发|检举|实名/
const tag = (oid: string) => `${byId.get(oid)?.name}(${oid}${(nameIds.get(byId.get(oid)?.name ?? '')?.length ?? 1) > 1 ? '?' : ''}${related.has(oid) ? ' R' : ''})`

const out: string[] = []
const lines: [string, string][] = []
for (const [id, t] of d.texts) for (const l of t.split(/\n/)) if (l.includes('→')) lines.push([id, l])
const sentences: [string, string][] = []
for (const [id, t] of d.texts) for (const s of t.split(/(?<=[。；！？\n])/)) if (s.trim().length > 4 && s.length < 400 && kw.test(s)) sentences.push([id, s.trim()])

const endName = (tok: string) => {
  const t = tok.replace(/[\s\u3000（）()]/g, '').replace(/（.*$/, '')
  for (const [n, ids] of names) if (t.endsWith(n)) return ids
  return []
}
for (const [id, name] of list) {
  const p = byId.get(id)
  if (!p || (process.argv.includes('--missing') && related.has(id))) continue
  const mine = [p.name, ...p.aka].filter((x) => x.length >= 2)
  const rows: string[] = []
  // chains
  for (const [sid, l] of lines) {
    const toks = l.split('→')
    for (let i = 0; i < toks.length; i++) {
      const ids = endName(toks[i])
      if (!ids.includes(id)) continue
      for (const j of [i - 1, i + 1]) {
        if (j < 0 || j >= toks.length) continue
        for (const o of endName(toks[j])) {
          if (o === id) continue
          const key = [id, o].sort().join('|')
          rows.push(`  CHAIN ${j < i ? 'after' : 'before'} ${tag(o)}${have.has(key) ? ' HAVE' : ''} [${sid}] ${toks[0].trim().slice(0, 30)}… ${toks.slice(Math.max(0, i - 1), i + 2).join('→').trim().slice(0, 120)}`)
        }
      }
    }
  }
  // keyword sentences
  const seen = new Set<string>()
  for (const [sid, s] of sentences) {
    if (!mine.some((x) => s.includes(x))) continue
    let rest = s
    for (const x of mine) rest = rest.split(x).join('〇')
    const others = new Set<string>()
    for (const [n, ids] of names) if (rest.includes(n)) { for (const o of ids) if (o !== id) others.add(o); rest = rest.split(n).join('〇') }
    if (!others.size || others.size > 8) continue
    const k = s.slice(0, 80)
    if (seen.has(k)) continue
    seen.add(k)
    rows.push(`  KW {${[...others].map(tag).join(' ')}} [${sid}${src.get(sid)?.rumor ? ' rumor' : ''}] ${s.slice(0, 300)}`)
  }
  out.push(`######## ${name} (${id})`, ...[...new Set(rows)].slice(0, 50))
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', process.argv.includes('--missing') ? 'RL2-chain2.txt' : 'RL2-chain.txt'), out.join('\n') + '\n')
console.log('ok', out.length)
