// Joins the K06 roster with the 20th-list biography tables on Wikipedia (peeked to .probe/peek-k06-wiki-20th-*-list.txt)
// and checks the ids against every existing person and roster id.
//   node research/scripts/K06-data.ts   -> .probe/K06-data.json, .probe/K06-data.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { IDS } from './K06-ids.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8')
const bare = (s: string) => s.replace(/（[^）]*）/g, '').trim()
const { mine } = JSON.parse(read('.probe', 'K06-roster.json')) as { mine: { name: string; list: 'cc' | 'cca'; note?: string }[] }

type Row = { name: string; rank?: string; born?: string; level?: string; kind?: string; lines: string[] }
function table(file: string, names: string[]): Row[] {
  const lines = read('.probe', file).split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const start = lines.findIndex((l) => l.startsWith('委员简介（按姓氏笔画排序）'))
  const stop = lines.findIndex((l, i) => i > start && l === '注释')
  const rows: Row[] = []
  const byLen = [...names].sort((a, b) => b.length - a.length)
  for (let i = start + 1; i < stop; i++) {
    const l = lines[i]
    const n = byLen.find((n) => l.startsWith(n))
    const next = lines[i + 1] ?? ''
    const isRow = n && (/^\d{4}年/.test(next) || /^（/.test(next) || next === '—' || /^\d{4}年/.test(lines[i + 2] ?? ''))
    if (isRow) {
      rows.push({ name: n, rank: l.slice(n.length).replace(/（[^）]*）/, '').trim() || undefined, lines: [] })
      continue
    }
    const r = rows.at(-1)
    if (!r) continue
    if (!r.born && /^\d{4}年/.test(l)) r.born = l.match(/^(\d{4})年(?:(\d{1,2})月)?/)!.slice(1).filter(Boolean).map((x, k) => (k ? x.padStart(2, '0') : x)).join('-')
    else if (/^（.*）$/.test(l) && !r.born) continue
    else if (!r.level && r.born && r.lines.length === 0 && !/^—|^\d{4}\./.test(l) && l.length <= 6 && !r.kind) r.level = l
    else if (r.level && !r.kind && r.lines.length === 0 && !/^—|^\d{4}\./.test(l) && l.length <= 6) r.kind = l
    else r.lines.push(l)
  }
  return rows
}

const k01 = parse(read('content', 'congresses', 'K01.yaml')) as { n: number; cc?: string[]; cca?: string[] }[]
const c20 = k01.find((c) => c.n === 20)!
const ccNames = (c20.cc ?? []).map(bare)
const ccaNames = (c20.cca ?? []).map(bare)
const rows = new Map<string, Row[]>()
for (const r of [...table('peek-k06-wiki-20th-cc-list.txt', ccNames), ...table('peek-k06-wiki-20th-cca-list.txt', ccaNames)]) rows.set(r.name, [...(rows.get(r.name) ?? []), r])

// existing ids
const taken = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'people')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K06')))
  try {
    for (const p of (parse(read('content', 'people', f)) ?? []) as { id: string; name: string }[]) taken.set(p.id, `${f} ${p.name}`)
  } catch {}
for (const f of ['roster.yaml', ...readdirSync(join(ROOT, 'research', 'roster')).filter((f) => !f.startsWith('K06')).map((f) => `roster/${f}`)])
  try {
    for (const p of (parse(read('research', ...f.split('/'))) ?? []) as { id: string; name: string }[]) if (!taken.has(p.id)) taken.set(p.id, `${f} ${p.name}`)
  } catch {}

const wd = JSON.parse(read('.probe', 'K06.json')) as Record<string, { id: string; description?: string }[]>
const out: unknown[] = []
const txt: string[] = []
const problems: string[] = []
for (const m of mine) {
  const b = bare(m.name)
  const key = IDS[m.name] ? m.name : b
  const id = IDS[key]
  if (!id) problems.push(`no id: ${m.name}`)
  if (id && taken.has(id)) problems.push(`id taken: ${id} (${taken.get(id)})`)
  // the cc table lists the promoted alternates too; prefer the row from the list the person was elected on
  const rs = rows.get(b) ?? []
  // 王凯（解放军） is the row carrying a military rank, 王凯（河南） the one without
  const row = m.name.includes('解放军') ? rs.find((r) => r.rank) : m.name.includes('河南') ? rs.find((r) => !r.rank) : rs.length > 1 && m.list === 'cca' ? rs.at(-1) : rs[0]
  if (!row) problems.push(`no table row: ${m.name}`)
  const note = m.note && !/河南|解放军/.test(m.note) ? m.note : undefined
  const rec = {
    name: b,
    key,
    id,
    list: m.list,
    gender: note?.includes('女') ? 'f' : 'm',
    ethnicity: note?.split('，').find((x) => x.endsWith('族')),
    ...row,
    wd: (wd[b] ?? []).map((c) => `${c.id} ${c.description ?? ''}`),
  }
  out.push(rec)
  txt.push(`${m.list} ${b} ${id} | ${rec.gender}${rec.ethnicity ? ' ' + rec.ethnicity : ''} | ${row?.born ?? '?'} ${row?.rank ?? ''} ${row?.level ?? ''}/${row?.kind ?? ''} | ${row?.lines.join(' ; ') ?? ''}`)
}
writeFileSync(join(ROOT, '.probe', 'K06-data.json'), JSON.stringify(out, null, 1))
writeFileSync(join(ROOT, '.probe', 'K06-data.txt'), [...problems, '', ...txt].join('\n') + '\n')
console.log(`${out.length} people, ${problems.length} problems`)
