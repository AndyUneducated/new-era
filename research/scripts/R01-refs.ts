// Reads the zhwiki table "中共十八大至十九大期间落马官员列表" (dumped by R01-wiki-list.ts to .probe/R01-wiki-18-19.txt)
// and lists, for each row first announced 2012-11 to 2014-12, the cited notices with their Wayback copies,
// marking urls already registered in research/manifests.
//   node research/scripts/R01-refs.ts   -> .probe/R01-refs.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const wiki = readFileSync(join(ROOT, '.probe/R01-wiki-18-19.txt'), 'utf8')
const known = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'research/manifests'))) {
  if (!f.endsWith('.yaml')) continue
  try {
    for (const e of (parse(readFileSync(join(ROOT, 'research/manifests', f), 'utf8'))?.web ?? []) as { id: string; url: string }[]) {
      const key = e.url.replace(/^.*?\/(https?:\/\/)/, '$1').replace(/^https?:\/\/(www\.)?/, '').replace(/:80\//, '/')
      known.set(key, e.id)
    }
  } catch {}
}
const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/:80\//, '/')
const out: string[] = []
for (const row of wiki.split(/\n\|-[^\n]*\n/)) {
  const lines = row.split('\n')
  const date = row.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!date) continue
  const ym = Number(date[1]) * 100 + Number(date[2])
  if (ym < 201211 || ym > 201412) continue
  const name = lines[0].replace(/^\|/, '').replace(/<[^>]+>/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/, '$1').replace(/\s|　/g, '')
  out.push(`${name}\t${date[0]}\t${lines[1]?.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/^\|/, '')}`)
  for (const m of row.matchAll(/\{\{cite[^}]*\}\}/gi)) {
    const t = m[0]
    const url = t.match(/\|\s*url=([^|}\s]+)/)?.[1] ?? ''
    const title = t.match(/\|\s*title=([^|}]+)/)?.[1] ?? ''
    const arch = t.match(/\|\s*archive-?url=([^|}\s]+)/)?.[1] ?? ''
    out.push(`\t${title}\n\t\t${url}${known.has(norm(url)) ? `  [HAVE ${known.get(norm(url))}]` : ''}\n\t\t${arch}`)
  }
}
writeFileSync(join(ROOT, '.probe/R01-refs.txt'), out.join('\n') + '\n')
console.log('ok')
