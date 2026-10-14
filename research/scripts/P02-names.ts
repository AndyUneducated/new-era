// One-off: for every P02 chief name, find the site's person entry (integrated files, plus in-flight roster plans)
// and any registered Wikipedia biography. Results in .probe/p02-names.txt.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const names = readFileSync('.probe/p02-namelist.txt', 'utf8').split(/\s+/).filter(Boolean)
const inflight: string[] = parse(readFileSync('research/round.yaml', 'utf8')).inflight
const people = new Map<string, string[]>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const live = !inflight.some((b) => f.startsWith(b))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as { id: string; name: string }[])
    people.set(p.name, [...(people.get(p.name) ?? []), `${p.id}${live ? '' : ` (in-flight ${f})`}`])
}
const roster = new Map<string, string[]>()
const rosterFiles = ['research/roster.yaml', ...readdirSync('research/roster').map((f) => `research/roster/${f}`)]
for (const f of rosterFiles)
  for (const r of (parse(readFileSync(f, 'utf8')) ?? []) as { id: string; name: string; batch: string }[])
    roster.set(r.name, [...(roster.get(r.name) ?? []), `${r.id} [${r.batch}]`])
const manifests = readdirSync('research/manifests')
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => readFileSync(`research/manifests/${f}`, 'utf8'))
  .join('\n')
  .split('\n')
const out = names.map((n) => {
  const bare = n.replace(/ /g, '')
  const wiki = manifests
    .filter((l) => l.includes(`zh.wikipedia.org/zh-hans/${bare}`) || l.includes(`zh.wikipedia.org/wiki/${bare}`))
    .map((l) => l.match(/id: ([\w-]+)/)?.[1] ?? l.trim().slice(0, 60))
  return `${bare}\tpeople=${(people.get(bare) ?? []).join(',') || '-'}\troster=${(roster.get(bare) ?? []).join(',') || '-'}\twiki=${wiki.join(',') || '-'}`
})
writeFileSync('.probe/p02-names.txt', out.join('\n') + '\n')
console.log(out.length)
