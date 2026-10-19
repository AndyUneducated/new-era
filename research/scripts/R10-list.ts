import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const cards = new Map<string, any>()
const own = new Set<string>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as any[]) {
    cards.set(p.id, p)
    if (f === 'R10.yaml') own.add(p.id)
  }
const falls = parse(readFileSync('content/falls/R10.yaml', 'utf8')) as Record<string, any>

const missing: [string, string, string][] = [
  ['刘鹰', '光大系高管', '报道太少且只有传闻性质来源，不能设 fall'],
  ['王宏琨', '华润置地原高级副总裁', '2014 年媒体称被带走调查，未见官方通报与结局'],
  ['吴丁', '华润金融原首席执行官', '2014 年媒体称被带走调查，未见官方通报与结局'],
  ['张春', '华润集团协同办原主任', '2014 年媒体称被带走调查，未见官方通报与结局'],
  ['李世谦', '原银保监会城市商业银行监管部一级巡视员', '只见盘点点名，未找到履历'],
  ['赵东生', '原青岛银保监局二级巡视员', '只见盘点点名，未找到履历'],
  ['李果', '中国人民银行秘书局副局长', '只见盘点点名，未找到履历'],
  ['董国滨', '中国人民银行哈尔滨中心支行原助理巡视员', '只见盘点点名，未找到履历'],
  ['陈义清', '中国印钞造币集团有限公司原董事', '只见盘点点名，未找到履历'],
  ['李光', '农发行原客户三部总经理', '只见盘点点名，未找到履历'],
  ['张弛', '国开行吉林省分行原行长', '未找到足够来源'],
  ['胡晓炜', '中国华融原副总裁', '没有找到可靠来源'],
  ['云南中烟高管', '云南中烟工业有限责任公司', '报道未点名'],
]

const q = (s: string) => JSON.stringify(s)
const lines = [
  '# R10: central-SOE and finance-system falls done by this batch (CCDI 中管企业 / 中管金融企业 notices, 2021+ finance campaign).',
  '# `done: true` = case record in content/falls/R10.yaml; `card: R10` = card written in content/people/R10.yaml, otherwise the card belongs to another batch.',
  '# `done: false` = named in a notice or roundup but left out; `why` says what is missing.',
]
for (const id of Object.keys(falls)) {
  const p = cards.get(id)
  if (!p) { lines.push(`# ?? ${id}: no card`); continue }
  const date = (p.fall ?? []).map((s: any) => String(s.date)).sort()[0]
  const pos = p.positions?.length ? p.positions[p.positions.length - 1].title : p.headline
  lines.push(`- { name: ${p.name}, ${date ? `date: ${date}, ` : ''}post: ${q(pos ?? '')}, id: ${id}, done: true${own.has(id) ? ', card: R10' : ''} }`)
}
for (const [name, post, why] of missing) lines.push(`- { name: ${name}, post: ${q(post)}, done: false, why: ${q(why)} }`)
writeFileSync('research/falls-list/R10.yaml', lines.join('\n') + '\n', 'utf8')
console.log(Object.keys(falls).length, missing.length)
