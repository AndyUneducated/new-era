// For each sitting head of government in U08's list, lists the archived source texts that mention the name,
// with size, and dumps the texts of the person's own card cites.
//   node research/scripts/U08-src.ts   -> .probe/U08-src.txt, .probe/U08-cites.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const WHO: [string, string][] = [
  ['yin-yong', '殷勇'], ['zhang-gong', '张工'], ['wang-zhengpu', '王正谱'], ['lu-dongliang', '卢东亮'], ['bao-gang', '包钢'],
  ['wang-xinwei', '王新伟'], ['hu-yuting', '胡玉亭'], ['liang-huiling', '梁惠玲'], ['zhu-zhongming', '朱忠明'], ['liu-xiaotao', '刘小涛'],
  ['liu-jie', '刘捷'], ['wang-dongwei', '王东伟'], ['zhou-naixiang', '周乃翔'], ['wang-lujin', '王陆进'], ['li-dianxun', '李殿勋'],
  ['mao-weiming', '毛伟明'], ['meng-fanli', '孟凡利'], ['wei-tao', '韦韬'], ['liu-xiaoming', '刘小明'], ['chen-xinwu', '陈新武'],
  ['shi-xiaolin', '施小琳'], ['li-bingjun', '李炳军'], ['wang-yubo', '王予波'], ['gama-zedeng', '嘎玛泽登'], ['zhao-gang', '赵刚'],
  ['kong-shaoxun', '孔绍逊'], ['zhang-yupu', '张雨浦'], ['aierken-tuniyazi', '艾尔肯'],
]
const dir = join(ROOT, 'sources', 'text')
const texts = new Map<string, string>()
for (const f of readdirSync(dir)) if (f.endsWith('.txt')) texts.set(f.slice(0, -4), readFileSync(join(dir, f), 'utf8'))
const cites = new Map<string, string[]>()
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  for (const p of (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as { id: string; cites: string[] }[]) cites.set(p.id, p.cites)
}
const out: string[] = []
const dump: string[] = []
for (const [id, name] of WHO) {
  const hits = [...texts].filter(([, t]) => t.includes(name)).map(([k, t]) => `${k}(${t.length})`)
  out.push(`${id} ${name}: ${hits.length} hits`)
  out.push('  ' + hits.join(' '))
  dump.push(`######## ${id} ${name}`)
  for (const c of cites.get(id) ?? []) {
    const t = texts.get(c)
    if (!t || /20th-cc|20th-cca|19-cca|20-cc|20-cca|4th-plenum/.test(c)) continue
    dump.push(`=== ${c} (${t.length})`)
    dump.push(t.length > 6000 ? t.slice(0, 6000) + ' …' : t)
  }
}
writeFileSync(join(ROOT, '.probe', 'U08-src.txt'), out.join('\n') + '\n')
writeFileSync(join(ROOT, '.probe', 'U08-cites.txt'), dump.join('\n') + '\n')
console.log(out.length, dump.length)
