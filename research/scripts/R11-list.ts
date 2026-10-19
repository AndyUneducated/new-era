// R11: who needs a case record, which records lack a trigger, and where the round-13 pending outcomes stand.
// Reads the cards and content/falls/*.yaml the way the build does (loadAll). Run with --batch=R11 so the other
// running batches (C13 among them) are skipped: node research/scripts/R11-list.ts --batch=R11
// Writes .probe/R11-list.txt (UTF-8).
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseFall } from '../../src/lib/caseparse.ts'
import { path, read, yamlFiles } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
// the file that holds each card
const fileOf = new Map<string, string>()
for (const f of yamlFiles('content', 'people')) for (const p of (read(...f) ?? []) as { id: string }[]) fileOf.set(p.id, f.at(-1)!)

const out: string[] = []
const show = (p: (typeof d.people)[number]) => {
  const rec = d.falls.get(p.id)
  const c = parseFall(p.fall, p.status, rec, (x) => d.texts.get(x.split('@')[0]))
  out.push(`### ${p.name}\t${p.id}\t${fileOf.get(p.id)}\tstatus=${p.status}\toutcome=${c.outcome}\tterm=${c.term ?? ''}${c.years ? `(${c.years})` : ''}\tyuan=${c.yuan ?? ''}\trec=${rec?.file ?? '-'}`)
  out.push(`  ${p.headline}`)
  for (const f of p.fall) out.push(`  - ${f.date}\t${f.text}\t[${f.cite}]`)
}

const noRec = d.people.filter((p) => p.fall.length && !d.falls.has(p.id))
out.push(`# 1. 有 fall 无案件记录：${noRec.length} 人`)
for (const p of noRec) show(p)
out.push('')
const noTrig = [...d.falls].filter(([, r]) => !r.trigger)
out.push(`# 2. 有案件记录缺 trigger：${noTrig.length} 条`)
for (const [id, r] of noTrig) {
  const p = d.people.find((x) => x.id === id)
  if (p) show(p)
  else out.push(`### (no card) ${id}`)
  out.push(`  rec: ${r.file}\tnotice=${r.notice?.cite ?? ''}\tsys=${r.sys}\tgrade=${r.grade}`)
}
out.push('')
const pending = '陈共炎 陈爽 刘峰 张建军 任海川 王筠权 冯建龙 高强 沈荣勤 李工 张旭 张松柏 孔繁波 何泽蜀 郭三野 甘成久 高飞 吴国舫 李亚力 孙平 丛文景 丁雪峰 刘俊林 陈争鸣'.split(' ')
out.push(`# 3. 第十三轮结局待补：${pending.length} 人`)
for (const n of pending) {
  const ps = d.people.filter((x) => x.name === n && (x.fall.length || d.falls.has(x.id)))
  if (!ps.length) out.push(`### ${n}: no card with a fall`)
  for (const p of ps) show(p)
}

mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'R11-list.txt'), out.join('\n') + '\n')
console.log(`noRec ${noRec.length} noTrig ${noTrig.length}`)
