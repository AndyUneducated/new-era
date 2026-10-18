// R02 one-off: for each person in the 2015 list, the references the zh.wikipedia row gives (probe, expulsion,
// verdict) and whether a manifest already registers that page.
//   node research/scripts/R02-refs.ts   writes .probe/R02-refs.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { NAMES } from './R02-names.ts'

const wiki = readFileSync('.probe/R02-wp-0.txt', 'utf8')
const rows = wiki.split(/\n\|-/)
const manifests = readdirSync('research/manifests')
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ f, lines: readFileSync(`research/manifests/${f}`, 'utf8').split(/\r?\n/) }))

// the stable part of a URL: the CCDI/Xinhua article file name, or the path tail
function token(u: string) {
  const m = u.match(/t\d{8}_\d+/) ?? u.match(/c_\d+/) ?? u.match(/id\/\d+/) ?? u.match(/doc-[a-z0-9]+/)
  return m ? m[0] : u.replace(/^https?:\/\/(web\.archive\.org\/web\/\w+\/)?/, '').slice(0, 60)
}
function registered(u: string) {
  const t = token(u)
  const hits: string[] = []
  for (const { f, lines } of manifests)
    lines.forEach((l, i) => {
      if (/^\s*url:/.test(l) && l.includes(t)) {
        for (let k = i; k >= 0; k--) {
          const m = lines[k].match(/-\s*id:\s*(\S+)/)
          if (m) { hits.push(`${m[1]}(${f})`); break }
        }
      }
    })
  return hits.join(' ')
}
const out: string[] = []
for (const n of NAMES) {
  const re = new RegExp(`\\[\\[(?:[^\\]|]*\\|)?${[...n].join('[　 ]?')}\\]\\]`)
  const row = rows.find((r) => re.test(r))
  out.push(`## ${n}${row ? '' : '  (no wiki row)'}`)
  if (!row) continue
  for (const m of row.matchAll(/\{\{cite[^}]*?\}\}/gi)) {
    const c = m[0]
    const url = c.match(/\|\s*url\s*=\s*([^|}]+)/)?.[1]?.trim() ?? ''
    const title = c.match(/\|\s*title\s*=\s*([^|}]+)/)?.[1]?.trim() ?? ''
    const arch = c.match(/\|\s*archive-?url\s*=\s*([^|}]+)/)?.[1]?.trim() ?? ''
    out.push(`  ${title}\n    ${url}\n    arch: ${arch}\n    have: ${registered(url) || '-'}`)
  }
}
writeFileSync('.probe/R02-refs.txt', out.join('\n') + '\n', 'utf8')
console.log('ok')
