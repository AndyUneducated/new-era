// RL2: per-person dossier for the case-essay people that have no relation yet
// (research/lists/R15-case-people-no-relation.txt): links in case records (`with`), family entries, and
// sentences in archived source texts that name the person and another person on file, keyword hits first.
// Run: node research/scripts/RL2-mine.ts --batch=RL2 [--part=1/4] → .probe/RL2-mine-<n>.txt (UTF-8)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const part = (process.argv.find((a) => a.startsWith('--part='))?.slice(7) ?? '1/1').split('/').map(Number)
const list = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
const byId = new Map(d.people.map((p) => [p.id, p]))
const src = new Map(d.sources.map((s) => [s.id, s]))
const have = new Set(d.relations.map((r) => [r.a, r.b].sort().join('|')))
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const nameIds = new Map<string, string[]>()
for (const p of d.people) for (const n of [p.name, ...p.aka]) if (n && n.length >= 2) nameIds.set(n, [...(nameIds.get(n) ?? []), p.id])
const names = [...nameIds].filter(([, ids]) => ids.length === 1).map(([n, ids]) => [n, ids[0]] as [string, string])
const kw =
  /秘书|提拔|提携|重用|门生|亲信|嫡系|老部下|部下|心腹|爱将|旧部|妻子|丈夫|夫人|之妻|之子|之女|儿子|女儿|女婿|岳父|弟弟|哥哥|姐姐|妹妹|侄|外甥|父亲|胞弟|胞兄|前妻|情妇|搭档|搭班子|恩师|举报|政敌|对手|不和|接替|继任|前任|老上级|上司|白手套|圈子|团伙|secretary|protégé|protege|patron|mentor|wife|husband|son of|daughter|brother|rival|aide/i
const sentences: [string, string][] = []
for (const [id, t] of d.texts) for (const s of t.split(/(?<=[。；！？\n]|\. )/)) if (s.trim().length > 4 && s.length < 500) sentences.push([id, s.trim()])
const withs: { owner: string; w: { id?: string; name: string; rel: string; text: string; cite: string } }[] = []
for (const [owner, rec] of d.falls) for (const w of rec.with) withs.push({ owner, w })
const caseText = new Map<string, string>()
for (const c of d.cases) caseText.set(c.id, [c.summary, ...c.sections.map((s) => s.text), ...c.editor.map((e) => (e as { text: string }).text)].join('\n'))

const [k0, n] = part
const size = Math.ceil(list.length / n)
for (let k = k0 || 1; k <= (k0 || n); k++) {
const chunk = list.slice((k - 1) * size, k * size)
const out: string[] = []
for (const [id, name, status, head, cases] of chunk) {
  const p = byId.get(id)
  out.push(`######## ${name} (${id}) ${status} | ${head} | ${cases}${p ? '' : ' [NO CARD]'}`)
  if (!p) continue
  const mine = [p.name, ...p.aka].filter((x) => x.length >= 2)
  for (const { owner, w } of withs) {
    if (owner === id) {
      const oid = w.id ?? nameIds.get(w.name)?.[0]
      out.push(`  WITH-OWN ${w.rel} ${w.name}(${oid ?? '-'}${oid && !w.id ? '?' : ''}${oid && related.has(oid) ? ' R' : ''}) [${w.cite}] ${w.text}`)
    } else if (w.id === id || (!w.id && mine.includes(w.name))) {
      out.push(`  WITH-IN ${owner}(${byId.get(owner)?.name}${related.has(owner) ? ' R' : ''}) lists him as ${w.rel} [${w.cite}] ${w.text}`)
    }
  }
  for (const f of (p as { family?: { name: string; rel: string; cites: string[] }[] }).family ?? [])
    out.push(`  FAMILY ${f.rel} ${f.name}(${nameIds.get(f.name)?.join(',') ?? '-'}) [${f.cites.join(',')}]`)
  for (const q of d.people) {
    if (q.id === id) continue
    for (const f of (q as { family?: { name: string; rel: string; cites: string[] }[] }).family ?? [])
      if (mine.includes(f.name)) out.push(`  FAMILY-OF ${q.name}(${q.id}) ${f.rel} [${f.cites.join(',')}]`)
  }
  // case essays: other people named in the same sentence as this person
  for (const c of cases.split(',')) {
    const t = caseText.get(c) ?? ''
    for (const s of t.split(/(?<=[。；！？\n])/)) {
      if (!mine.some((x) => s.includes(x)) || !kw.test(s)) continue
      const others = names.filter(([nm, oid]) => oid !== id && s.includes(nm)).map(([, oid]) => oid)
      if (others.length) out.push(`  CASE ${c} {${[...new Set(others)].join(',')}} ${s.trim().slice(0, 300)}`)
    }
  }
  // archived sources: sentences naming this person and someone else, keyword sentences first
  const pairs = new Map<string, [string, string, boolean][]>()
  for (const [sid, s] of sentences) {
    if (!mine.some((x) => s.includes(x))) continue
    const others = new Set(names.filter(([nm, oid]) => oid !== id && s.includes(nm)).map(([, oid]) => oid))
    if (!others.size || others.size > 6) continue
    const isKw = kw.test(s)
    for (const o of others) {
      const arr = pairs.get(o) ?? []
      if (!arr.some(([, x]) => x === s)) arr.push([sid, s, isKw])
      pairs.set(o, arr)
    }
  }
  const ranked = [...pairs].map(([o, arr]) => [o, arr, arr.filter((x) => x[2]).length] as const).sort((a, b) => b[2] - a[2] || b[1].length - a[1].length)
  for (const [o, arr, nk] of ranked.slice(0, 6)) {
    const key = [id, o].sort().join('|')
    out.push(`  PAIR ${byId.get(o)?.name}(${o}${related.has(o) ? ' R' : ''}${have.has(key) ? ' HAVE' : ''}) ${arr.length}/${nk}kw`)
    for (const [sid, s] of arr.sort((a, b) => Number(b[2]) - Number(a[2])).slice(0, 2))
      out.push(`     [${sid}${src.get(sid)?.rumor ? ' rumor' : ''}] ${s.slice(0, 260)}`)
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `RL2-mine-${k}.txt`), out.join('\n') + '\n')
console.log('ok', k, chunk.length, out.length)
}
