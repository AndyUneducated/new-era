// Writes research/falls-list/R06.yaml from .probe/R06-master.json (the 179 first CCDI / NSC notices since 2024-01).
// `done` marks the people who have a case record in content/falls/R06.yaml.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Row = { date: string; name: string; post: string; url?: string }
const rows = JSON.parse(readFileSync('.probe/R06-master.json', 'utf8')) as Row[]
// the CDI mirror list lost this post; the CCDI headline reads 国家烟草专卖局党组成员、副局长徐𬎆
for (const r of rows) if (r.date === '2024-05-25' && r.post === '?') r.post = '国家烟草专卖局党组成员、副局长'
const names = new Map<string, string>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as { id: string; name: string }[]) names.set(p.id, p.name)
const done = Object.keys(parse(readFileSync('content/falls/R06.yaml', 'utf8')) ?? {})
const byName = new Map(done.map((id) => [names.get(id), id]))
const q = (s: string) => (/[:#,[\]{}&*!|>'"%@`]/.test(s) ? JSON.stringify(s) : s)
const out = [
  '# R06: centrally managed cadres (excluding the military) first named by the CCDI / NSC from 2024-01 to 2026-10-18,',
  '# from the CCDI 中管干部执纪审查 lists (Hebei CDI mirror, Wayback), cross-checked against the yearly counts',
  '# (2024: 58, 2025: 65, 2026 to date: 56). `done: true` = case record in content/falls/R06.yaml.',
  ...rows.map((r) => {
    const id = byName.get(r.name) ?? ''
    return `- { name: ${q(r.name)}, date: ${r.date}, post: ${q(r.post)}, id: ${id || '""'}, done: ${!!id} }`
  }),
  '# Not counted: removed without a CCDI / NSC notice (NPC delegate recall, CPPCC membership revoked), 2024-2026:',
  '# 许达哲、李云泽、金壮龙；张冬辰、曹建国、刘国跃、马正武、樊友山、曾毅、俞培根（2025-12-24 全国政协撤销委员资格）；',
  '# 高涛、张红文、金东寒、周新民、刘仓理、张克俭、吴曼青、赵宪庚.',
  '# Not counted: first named in 2023 (R05): 徐文荣、唐双宁、肖星、王用生、刘立宪、张红力、周政、姜杰、张广、李鹏新、商黎光.',
]
mkdirSync('research/falls-list', { recursive: true })
writeFileSync('research/falls-list/R06.yaml', out.join('\n') + '\n')
console.log(`${rows.length} rows, ${rows.filter((r) => byName.has(r.name)).length} done`)
