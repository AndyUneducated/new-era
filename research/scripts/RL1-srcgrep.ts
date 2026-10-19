// RL1: for each listed person, the sentences in the texts of their own cited sources (and any extra
// source ids given) that carry a word for patronage, secretaries, kin or rivalry, with the other people
// named in them. Run: node research/scripts/RL1-srcgrep.ts --batch=RL1 --out=name id1 id2 ... [+src1 +src2]
// → .probe/RL1-src-<name>.txt (UTF-8)
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const outName = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'x'
const ids = args.filter((a) => !a.startsWith('+'))
const extra = args.filter((a) => a.startsWith('+')).map((a) => a.slice(1))
const d = loadAll()
const KEY =
  /秘书|提拔|提携|门生|亲信|嫡系|心腹|大管家|妻|丈夫|夫人|之子|儿子|女儿|女婿|岳父|岳母|弟弟|哥哥|胞弟|兄弟|姐姐|妹妹|侄|外甥|亲属|举报|对手|政敌|宿敌|搭档|搭班子|老部下|旧部|下属|恩师|导师|学生|弟子|伯乐|器重|赏识|重用|保护伞|靠山|攻击|批评|交恶|不和|恩怨|反目|好友|朋友|同学|发小|助手|副手|接班|protégé|protege|mentor|patron|ally|allies|confidant|secretary|aide|rival|wife|husband|son|daughter|brother|sister|father-in-law|son-in-law|friend|loyalist|close to|right-hand/i
const names = d.people.filter((p) => p.name.length >= 2).map((p) => [p.name, p.id] as const)
const out: string[] = []
for (const id of ids) {
  const p = d.people.find((x) => x.id === id)
  if (!p) {
    out.push(`?? ${id}`)
    continue
  }
  const srcs = [...new Set([...p.cites, ...p.life.flatMap((l) => l.cites), ...p.family.flatMap((f) => f.cites), ...p.assess.map((a) => a.cite), ...p.factions.map((f) => f.cite), ...extra])].map((c) => c.split('@')[0])
  out.push(`==== ${p.name}(${id})`)
  const self = [p.name, ...p.aka]
  for (const s of srcs) {
    const t = d.texts.get(s)
    if (!t) {
      out.push(`  [no text] ${s}`)
      continue
    }
    const hits: string[] = []
    for (const sen of t.split(/(?<=[。；！？\n]|\. )/)) {
      if (sen.length > 600 || !KEY.test(sen)) continue
      const mine = self.some((n) => sen.includes(n)) || /\b(he|she|his|her)\b/i.test(sen)
      const others = names.filter(([n, x]) => x !== id && sen.includes(n)).map(([n, x]) => `${n}:${x}`)
      if (!mine && !others.length) continue
      if (!others.length && !/妻|丈夫|夫人|之子|儿子|女儿|女婿|岳|弟|兄|姐|妹|wife|husband|son|daughter|brother/i.test(sen)) continue
      hits.push(`    {${[...new Set(others)].join(' ')}} ${sen.trim()}`)
    }
    if (hits.length) out.push(`  -- ${s}`, ...hits)
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `RL1-src-${outName}.txt`), out.join('\n') + '\n')
console.log('ok', out.length)
