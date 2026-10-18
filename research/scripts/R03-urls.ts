// R03 one-off: for every notice URL found in the wiki rows (.probe/R03-wp-rows.txt), say whether some manifest already
// registers that page (matched on the t<date>_<n> token or the whole path), and with which id.
//   node research/scripts/R03-urls.ts   -> .probe/R03-urls.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const all: { id: string; url: string; file: string }[] = []
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const e of parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) all.push({ id: e.id, url: e.url, file: f })
  } catch {}
}
const key = (u: string) => u.match(/t\d{8}_\d+/)?.[0] ?? u.replace(/^.*?\/\/(web\.archive\.org\/web\/[^/]+\/)?(https?:\/\/)?(www\.)?/, '')
const out: string[] = []
let person = ''
for (const line of readFileSync('.probe/R03-wp-rows.txt', 'utf8').split('\n')) {
  if (line.startsWith('[')) {
    person = line.split(' ¦ ').slice(0, 2).join(' ').replace(/^\[[^\]]*\] /, '')
    out.push(`## ${person}`)
  }
  const m = line.match(/^\s+- (.*) :: (\S+)/)
  if (!m) continue
  const k = key(m[2])
  const hit = all.filter((e) => e.url.includes(k))
  out.push(`  ${hit.length ? hit.map((h) => `${h.id} [${h.file}]`).join(', ') : 'NONE'}  ${m[1]}  ${m[2]}`)
}
writeFileSync('.probe/R03-urls.txt', out.join('\n') + '\n')
console.log(`${all.length} sources`)
