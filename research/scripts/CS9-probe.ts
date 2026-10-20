// CS9 one-off: list 20th CC members and alternates with fall steps from 2025-07 on
import { readFileSync, writeFileSync } from 'node:fs'
const db = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const out: string[] = []
const c20 = db.congresses.find((c: any) => c.n === 20)
const byName = new Map<string, any[]>()
for (const p of db.people) byName.set(p.name, [...(byName.get(p.name) ?? []), p])
const find = (n: string) => {
  const id = c20.names[n]
  if (id) return db.people.find((p: any) => p.id === id)
  const l = byName.get(n) ?? []
  return l.length === 1 ? l[0] : l.length ? { ambiguous: l.map((x: any) => x.id) } : undefined
}
out.push(`cc ${c20.cc.length} cca ${c20.cca.length}`)
let nocard = 0
for (const [label, list] of [['CC', c20.cc], ['ALT', c20.cca]] as const) {
  for (const n of list) {
    const p = find(n)
    if (!p) { nocard++; out.push(`${label}\t${n}\tNO CARD`); continue }
    if (p.ambiguous) {
      for (const id of p.ambiguous) {
        const q = db.people.find((x: any) => x.id === id)
        out.push(`${label}\t${n}\tAMBIG ${id}\t${q.status}\t${q.headline}\t${(q.fall ?? []).map((s: any) => s.date).join(',')}`)
      }
      continue
    }
    const steps = (p.fall ?? []).filter((s: any) => s.date >= '2025-07')
    if (!steps.length && !['purged', 'missing', 'detained'].includes(p.status)) continue
    out.push(`${label}\t${p.id}\t${p.name}\t${p.status}\t${p.case?.sys ?? '-'}\t${p.case?.grade ?? '-'}\t${p.headline}`)
    for (const s of p.fall ?? []) out.push(`\t\t${s.date} ${s.text} [${s.cite}]`)
    if (p.statusNote) out.push(`\t\tNOTE ${p.statusNote}`)
  }
}
out.push('no card: ' + nocard)
for (const n of ['张硕辅', '王晓东', '魏小东', '鲁昕', '黄奇帆', '王厚斌', '张升民', '喻红秋', '刘金国']) {
  const l = byName.get(n) ?? []
  out.push(`CHECK ${n}\tcc=${c20.cc.includes(n)}\tcca=${c20.cca.includes(n)}\t${l.map((p: any) => p.id + ' ' + p.status + ' ' + p.headline + ' ' + (p.fall ?? []).map((s: any) => s.date + s.text.slice(0, 30)).join(' | ')).join(' || ')}`)
}
writeFileSync('.probe/cs9-probe.txt', out.join('\n'))
