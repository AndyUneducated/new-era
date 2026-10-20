// After PH9: per-rank counts of the PH9 entries, and every row of research/lists/R15-no-photo.txt that still has
// no file in public/photos (rank, id, name, headline, note). Writes .probe/PH9-next.txt and .probe/PH9-rank.txt.
//   node research/scripts/PH9-next.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const NOTE: Record<string, string> = {
  'zhou-tongzhan': '百科只有棕色单色旧照（PH8 已删过一次）',
  'xi-mingze': '百科卡片无图，未另找',
  'xi-yuanping': '百科卡片无图，手机版 404；可试新闻配图（2013 习仲勋纪念座谈会）',
  'wen-yunsong': '百科卡片无图，手机版 404',
  'zhang-boshu': '百科卡片无图，手机版 404；可试 VOA、RFA 配图',
  'feng-yuzhang': '百科卡片无图，手机版 404',
  'luo-huazhong': '百科卡片无图，手机版 404',
  'hu-lianhe': '百科词条无图',
  'albert-keidel': '百科无图，Commons 只有同姓的德国人',
  'zhao-wenxin': '百科只有同名的黑龙江大学学生',
  'yang-limin': '百科同名词条里没有内蒙古党委副书记',
  'zhang-geng': '百科同名词条里没有最高检副检察长',
  'liu-jian': '百科同名词条只有新疆教育厅的女干部，不是哈密市委书记',
}
const rows = readFileSync('research/lists/R15-no-photo.txt', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.replace(/\r$/, '').split('\t'))
const rankOf = (c: string[]) => c[4]?.match(/rank\d/)?.[0] ?? '?'
const has = (id: string) => ['jpg', 'png', 'webp'].some((x) => existsSync(`public/photos/${id}.${x}`))
const ph9 = new Set(Object.keys(parse(readFileSync('content/photos/PH9.yaml', 'utf8')) ?? {}))
const counts: Record<string, number> = {}
for (const c of rows) if (ph9.has(c[0])) counts[rankOf(c)] = (counts[rankOf(c)] ?? 0) + 1
const left = rows.filter((c) => !has(c[0]))
const leftCounts: Record<string, number> = {}
for (const c of left) leftCounts[rankOf(c)] = (leftCounts[rankOf(c)] ?? 0) + 1
writeFileSync('.probe/PH9-rank.txt', `PH9 ${JSON.stringify(counts)} total ${ph9.size}\nstill missing ${JSON.stringify(leftCounts)} total ${left.length}\n`)
writeFileSync(
  '.probe/PH9-next.txt',
  '# R15-no-photo.txt 中 PH9 之后仍无照片的人：rank\tid\t姓名\t简介\t备注（PH9 查过的写原因；rank0–3 的原因见 PH8 回报）\n' +
    left.map((c) => [rankOf(c), c[0], c[1], c[3], NOTE[c[0]] ?? ''].join('\t')).join('\n') +
    '\n',
)
console.log(`ph9 ${ph9.size}, left ${left.length}`)
