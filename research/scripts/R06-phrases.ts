// Research tally: how many R06 notices use each characterization phrase. Output: .probe/R06-phrases.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const recs = parse(readFileSync('content/falls/R06.yaml', 'utf8')) as Record<string, { notice?: { cite: string }; politics?: { level: string }; grade: string; sys: string; amount?: { yuan: number } }>
const phrases = [
  '对抗组织审查', '迷信活动', '政治骗子', '不收敛、不收手', '权色', '钱色', '家风不正', '妄议党中央大政方针', '打折扣、搞变通',
  '政绩观', '形象工程', '违规举债', '对党不忠诚', '对组织不忠诚', '严重政治问题的', '私人会所', '高尔夫', '非上市公司股份',
  '家族', '全家腐', '民间借贷', '离职后', '退休后', '退而不休', '团团伙伙', '拉帮结派', '投机钻营', '两个维护', '七个有之', '低级红',
  '中央政治局会议审议', '取消其享受的待遇', '吃',
]
const texts: [string, string][] = []
for (const [id, r] of Object.entries(recs)) {
  if (!r.notice) continue
  let t = readFileSync(`sources/text/${r.notice.cite}.txt`, 'utf8')
  if (r.notice.cite === 't02-bjnews-2024-09-11-three-expel') {
    const name = { 'li-xiangang': '李显刚', 'liu-yuejin-mps': '刘跃进', 'li-yong-cnooc': '李勇' }[id]!
    t = t.split(/\n+/).filter((x) => x.includes(name)).join('\n')
  }
  texts.push([id, t])
}
const out = [`notices ${texts.length}`]
for (const p of phrases) {
  const hit = texts.filter(([, t]) => (p === '吃' ? /靠.{1,3}吃.{1,3}/.test(t) : t.includes(p))).map(([id]) => id)
  out.push(`${p}\t${hit.length}\t${hit.join(' ')}`)
}
const tally = (f: (r: (typeof recs)[string]) => string) => {
  const m: Record<string, number> = {}
  for (const r of Object.values(recs)) m[f(r)] = (m[f(r)] ?? 0) + 1
  return JSON.stringify(m)
}
out.push(`politics ${tally((r) => r.politics?.level ?? '-')}`, `grade ${tally((r) => r.grade)}`, `sys ${tally((r) => r.sys)}`)
out.push(`amounts ${Object.values(recs).filter((r) => r.amount).length}`)
out.push(`top ${Object.entries(recs).filter(([, r]) => r.amount).sort((a, b) => b[1].amount!.yuan - a[1].amount!.yuan).slice(0, 8).map(([id, r]) => `${id}:${r.amount!.yuan / 1e8}`).join(' ')}`)
writeFileSync('.probe/R06-phrases.txt', out.join('\n') + '\n')
