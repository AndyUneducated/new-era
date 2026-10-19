// RL1: what relations exist, which full biographies have none, and which sentences in the biographies, case
// essays and faction pages name two people together with a word for patronage, secretaries, kin or rivalry.
// Run: node research/scripts/RL1-dump.ts --batch=RL1   → .probe/RL1-dump.txt (UTF-8)
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const name = new Map(d.people.map((p) => [p.id, p.name]))
const nm = (id: string) => `${name.get(id) ?? '?'}(${id})`
const out: string[] = []
const linked = new Map<string, number>()
for (const r of d.relations) for (const x of [r.a, r.b]) linked.set(x, (linked.get(x) ?? 0) + 1)
out.push(`people ${d.people.length}; in relations ${linked.size}; relations ${d.relations.length}`)

const KEY = /秘书|提拔|提携|门生|亲信|嫡系|心腹|大管家|妻|丈夫|夫人|之子|儿子|女儿|女婿|岳父|弟弟|哥哥|胞弟|兄|姐|妹|侄|外甥|亲属|堂|表|举报|对手|对立|政敌|宿敌|搭档|搭班子|老部下|旧部|下属|恩师|导师|学生|弟子|伯乐|器重|赏识|重用|保护伞|靠山|裙带|攻击|批评|交恶|不和|恩怨|反目/
// names of two characters match too often inside other words; keep them but only with a keyword in the same sentence
const names = d.people.filter((p) => p.name.length >= 2).map((p) => [p.name, p.id] as const)
function mentions(text: string, self?: string) {
  const out: string[] = []
  for (const s of text.split(/(?<=[。；！？\n])/)) {
    if (!KEY.test(s)) continue
    const hit = names.filter(([n, id]) => id !== self && s.includes(n)).map(([, id]) => id)
    if (!hit.length) continue
    out.push(`    [${[...new Set(hit)].map(nm).join(' ')}] ${s.trim()}`)
  }
  return out
}

const BIOS = 'wu-bangguo wu-guanzheng he-guoqiang zhang-dejiang peng-liyuan liu-yunshan zhang-gaoli wang-huning qin-gang wang-yi liu-he liu-xiaobo xu-zhiyong ma-yun ren-zhiqiang jimmy-lai carrie-lam ai-weiwei li-wenliang yang-jiechi su-rong lu-wei lai-xiaomin xu-qiliang ren-zhengfei xu-jiayin yin-li li-zuocheng yu-keping lin-yifu zheng-yongnian'.split(' ')
out.push('', '## tier-1 without relations (computed)')
const t1none = d.people.filter((p) => p.tier === 1 && !linked.has(p.id))
out.push(t1none.map((p) => nm(p.id)).join(' '))
out.push('', '## the 31 (ids guessed; ? = not found)')
for (const id of BIOS) out.push(`${nm(id)} rel=${linked.get(id) ?? 0}`)

out.push('', '## biography sentences')
for (const p of t1none) {
  out.push(`== ${nm(p.id)}  cites: ${p.cites.join(' ')}`)
  for (const l of p.life) {
    const m = mentions(l.text, p.id)
    if (m.length) out.push(`  -- ${l.h} {${l.cites.join(' ')}}`, ...m)
  }
  for (const f of p.family) out.push(`  family ${f.name} ${f.rel}: ${f.text} {${f.cites.join(' ')}}`)
  const m = mentions(p.bio, p.id)
  if (m.length) out.push('  -- bio', ...m)
}

out.push('', '## case sentences')
for (const c of d.cases) {
  out.push(`== case ${c.id} ${c.title} people=${c.people.length}`)
  for (const s of c.sections) {
    const m = mentions(s.text)
    if (m.length) out.push(`  -- ${s.h} {${s.cites.join(' ')}}`, ...m)
  }
}

out.push('', '## faction cores')
for (const f of d.factions) {
  out.push(`== ${f.id} ${f.name} patron=${f.patron ?? ''} core: ${f.core.map(nm).join(' ')}`)
  const core = new Set([f.patron, ...f.core].filter(Boolean) as string[])
  const have = d.relations.filter((r) => core.has(r.a) && core.has(r.b)).map((r) => `${name.get(r.a)}-${name.get(r.b)}:${r.kind}`)
  out.push(`  core relations: ${have.join(' ')}`)
  for (const id of core) if (!linked.has(id)) out.push(`  core member with no relation: ${nm(id)}`)
}

out.push('', '## existing relations')
for (const r of d.relations) out.push(`${r.kind}\t${nm(r.a)}\t${nm(r.b)}\t${r.from ?? ''}\t${r.cite}`)

mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL1-dump.txt'), out.join('\n') + '\n')
console.log('ok', out.length)
