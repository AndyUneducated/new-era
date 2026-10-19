// RL1: mine candidate relations — sentences in archived source texts that contain a relation keyword
// and name two or more people (by name or alias). Pairs already in content/relations are skipped.
// Run: node research/scripts/RL1-mine.ts --batch=RL1 [--kw=秘书|妻子] [--out=name] [--only=id,id]
// → .probe/RL1-mine-<name>.txt (UTF-8), pairs sorted by hit count. Rumour sources are marked [rumor].
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const outName = arg('out') ?? 'x'
const kw = new RegExp(
  arg('kw') ??
    '秘书|提拔|提携|门生|亲信|嫡系|老部下|心腹|爱将|旧部|妻子|丈夫|夫人|之妻|之子|之女|儿子|女儿|女婿|岳父|岳母|弟弟|哥哥|姐姐|妹妹|侄子|外甥|父亲|母亲|胞弟|胞兄|儿媳|前妻|搭档|搭班子|恩师|举报|政敌|宿敌|对手|不和|恩怨|结怨|secretary|protégé|protege|patron|mentor|wife|husband|son of|daughter|brother|sister|father-in-law|son-in-law|rival',
  'i',
)
const only = arg('only')?.split(',')
const d = loadAll()
const have = new Set(d.relations.map((r) => [r.a, r.b].sort().join('|')))
const names: [string, string][] = []
for (const p of d.people) for (const n of [p.name, ...p.aka]) if (n && n.length >= 2) names.push([n, p.id])
const src = new Map(d.sources.map((s) => [s.id, s]))
const hits = new Map<string, [string, string][]>()
for (const [id, t] of d.texts) {
  for (const raw of t.split(/(?<=[。；！？\n]|\. )/)) {
    const s = raw.trim()
    if (s.length > 260 || !kw.test(s)) continue
    const ids = new Set<string>()
    for (const [n, pid] of names) if (s.includes(n)) ids.add(pid)
    if (ids.size < 2 || ids.size > 5) continue
    const list = [...ids].sort()
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const key = `${list[i]}|${list[j]}`
        if (have.has(key)) continue
        if (only && !only.includes(list[i]) && !only.includes(list[j])) continue
        const arr = hits.get(key) ?? []
        if (!arr.some(([, x]) => x === s)) arr.push([id, s])
        hits.set(key, arr)
      }
  }
}
const byId = new Map(d.people.map((p) => [p.id, p]))
const out: string[] = []
for (const [key, arr] of [...hits].sort((x, y) => y[1].length - x[1].length)) {
  const [a, b] = key.split('|')
  out.push(`==== ${byId.get(a)?.name}(${a}) — ${byId.get(b)?.name}(${b})  ${arr.length}`)
  for (const [id, s] of arr.slice(0, 3)) out.push(`  [${id}${src.get(id)?.rumor ? ' rumor' : ''}] ${s}`)
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `RL1-mine-${outName}.txt`), out.join('\n') + '\n')
console.log('ok', hits.size)
