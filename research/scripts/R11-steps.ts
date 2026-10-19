// Round 14, R11 item 3: later steps for the round-13 people whose outcome was pending, appended to the fall of their
// cards, and the sentence and amount in their case records. Keeps each file's line endings.
// Usage: node research/scripts/R11-steps.ts [--write]   (dry run writes .probe/R11-steps.txt)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const write = process.argv.includes('--write')
const S = (date: string, text: string, cite: string) => `    - { date: ${date}, text: ${text}, cite: ${cite} }`

const steps: Record<string, Record<string, string[]>> = {
  'content/people/R10.yaml': {
    'chen-shuang': [S('2024-01-26', '合肥市中级人民法院开庭审理其受贿案，合肥市检察院指控其 2008—2019 年非法收受财物共计折合人民币 9620.9264 万元', 'r11-sohu-2024-10-29-chen-shuang-trial')],
    'wu-guofang': [S('2026-05', '无锡市中级人民法院一审以受贿罪判处有期徒刑十五年，并处罚金 500 万元；吴国舫已上诉，二审尚未开庭', 'r11-laohu8-2026-09-wu-guofang-verdict')],
    'gan-chengjiu': [
      S('2024-10-11', '萍乡市检察院以涉嫌受贿罪、挪用公款罪、国有公司人员滥用职权罪决定逮捕', 'r11-bjd-2024-12-26-gan-chengjiu-charge'),
      S('2024-12', '经江西省检察院指定管辖，萍乡市检察院以涉嫌受贿罪、挪用公款罪、国有公司人员滥用职权罪、洗钱罪向萍乡市中级人民法院提起公诉', 'r11-bjd-2024-12-26-gan-chengjiu-charge'),
    ],
    'feng-jianlong': [S('2025-05-07', '主动投案，接受驻农行纪检监察组纪律审查和浙江省监委监察调查', 'r11-ccdi-2025-05-07-feng-jianlong-surrender')],
    'gao-qiang-ccb': [S('2025-04-29', '驻建设银行纪检监察组、北京市纪委监委发布其被查的消息', 'r11-guancha-2026-01-23-gao-qiang-ccb')],
  },
  'content/people/R09.yaml': {
    'ding-xuefeng': [S('2014-04-24', '全国人大常委会表决确认其因涉嫌严重违纪，全国人大代表资格终止', 'r11-chinanews-2014-04-24-ding-xuefeng-npc')],
    'liu-junlin': [S('2015-02', '成都市纪委立案调查后认定其严重违纪、部分问题涉嫌犯罪，移送司法机关', 'r11-people-2015-02-02-liu-junlin-transfer')],
    'chen-zhengming': [S('2014-12-16', '四川省检察院以涉嫌受贿罪决定逮捕', 'r11-chinanews-2014-12-17-chen-zhengming-arrest')],
  },
}

// lines added to case records before the first of these keys, and keys whose value is replaced
const recs: Record<string, Record<string, { add: string[]; set?: Record<string, string> }>> = {
  'content/falls/R10.yaml': {
    'wu-guofang': {
      add: [
        '  amount: { yuan: 73897800, text: 一审认定 2009—2024 年单独或伙同他人收受贿赂共计约 7389.78 万元，其中约 3216.44 万元未遂, cite: r11-laohu8-2026-09-wu-guofang-verdict }',
        '  sentence: { date: 2026-05, term: years, years: 15, cite: r11-laohu8-2026-09-wu-guofang-verdict }',
      ],
      set: { outcome: 'sentenced' },
    },
    'chen-shuang': {
      add: ['  amount: { yuan: 96209264, text: 合肥市检察院起诉指控的数额（折合人民币 9620.9264 万元），法院尚未宣判, cite: r11-sohu-2024-10-29-chen-shuang-trial }'],
    },
  },
}

const log: string[] = []
for (const [file, byId] of Object.entries(steps)) {
  const path = join(ROOT, file)
  const src = readFileSync(path, 'utf8')
  const nl = src.includes('\r\n') ? '\r\n' : '\n'
  const L = src.split(nl)
  for (const [id, add] of Object.entries(byId)) {
    const i = L.indexOf(`- id: ${id}`)
    if (i < 0) throw new Error(`${file}: no card ${id}`)
    let end = i + 1
    while (end < L.length && !L[end].startsWith('- id: ')) end++
    const f = L.slice(i, end).findIndex((l) => /^  fall:\s*$/.test(l))
    if (f < 0) throw new Error(`${file}: ${id} has no fall`)
    let j = i + f + 1
    while (j < end && L[j].startsWith('    ')) j++
    const fresh = add.filter((a) => !L.slice(i + f, j).includes(a))
    L.splice(j, 0, ...fresh)
    log.push(`${file} ${id}: +${fresh.length} at line ${j + 1}`, ...fresh)
  }
  if (write) writeFileSync(path, L.join(nl))
}
for (const [file, byId] of Object.entries(recs)) {
  const path = join(ROOT, file)
  const src = readFileSync(path, 'utf8')
  const nl = src.includes('\r\n') ? '\r\n' : '\n'
  const L = src.split(nl)
  for (const [id, { add, set }] of Object.entries(byId)) {
    const i = L.indexOf(`${id}:`)
    if (i < 0) throw new Error(`${file}: no record ${id}`)
    let end = i + 1
    while (end < L.length && (L[end] === '' || L[end].startsWith(' '))) end++
    for (const [k, v] of Object.entries(set ?? {})) {
      const n = L.slice(i, end).findIndex((l) => l.startsWith(`  ${k}:`))
      if (n < 0) throw new Error(`${file}: ${id} has no ${k}`)
      log.push(`${file} ${id}: ${L[i + n].trim()} -> ${k}: ${v}`)
      L[i + n] = `  ${k}: ${v}`
    }
    const keys = add.map((a) => a.trim().split(':')[0])
    if (L.slice(i, end).some((l) => keys.some((k) => l.startsWith(`  ${k}:`)))) throw new Error(`${file}: ${id} already has ${keys}`)
    const at = L.slice(i, end).findIndex((l) => /^  (trigger|with|politics|voices|outcome|retired|fall|status):/.test(l))
    L.splice(i + at, 0, ...add)
    log.push(`${file} ${id}: +${add.length} at line ${i + at + 1}`, ...add)
  }
  if (write) writeFileSync(path, L.join(nl))
}
writeFileSync(join(ROOT, '.probe', 'R11-steps.txt'), log.join('\n') + '\n')
console.log(write ? 'written' : 'dry run', log.length)
