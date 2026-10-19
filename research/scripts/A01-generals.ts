// A01: list every person card with the general role (or a -pla id), with status, first fall step and whether
// a case record exists; writes .probe/a01-generals.txt (UTF-8)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people: any[] = []
for (const f of readdirSync('content/people')) {
  if (!f.endsWith('.yaml')) continue
  const doc = parse(readFileSync(`content/people/${f}`, 'utf8'))
  for (const p of Array.isArray(doc) ? doc : []) people.push({ ...p, _file: f })
}
const cases = new Map<string, string>()
for (const f of readdirSync('content/falls')) {
  if (!f.endsWith('.yaml')) continue
  const doc = parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}
  for (const id of Object.keys(doc)) cases.set(id, f)
}
const out: string[] = []
const want = process.argv[2] === 'all' ? () => true : (p: any) => (p.roles ?? []).includes('general') || /-pla/.test(p.id)
for (const p of people.filter(want)) {
  const f0 = (p.fall ?? [])[0]
  out.push([p._file, p.id, p.name, p.status, (p.roles ?? []).join(','), f0 ? `${f0.date} ${String(f0.text).slice(0, 40)}` : '', cases.get(p.id) ?? '', (p.fall ?? []).length].join('\t'))
}
writeFileSync(process.argv[3] ?? '.probe/a01-generals.txt', out.join('\n'), 'utf8')
console.log(out.length)
