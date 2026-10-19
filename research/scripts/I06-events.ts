// dump every event (id, date, lane, title, concepts) to .probe/I06-events.txt, and grep the source library for keywords
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { parse } from 'yaml'

mkdirSync('.probe', { recursive: true })
const out: string[] = []
for (const f of readdirSync('content/events')) {
  if (!f.endsWith('.yaml')) continue
  const list = parse(readFileSync(`content/events/${f}`, 'utf8')) ?? []
  for (const e of list) out.push(`${e.date}\t${e.id}\t${e.lane}\t${e.title}\t${(e.concepts ?? []).join(',')}`)
}
out.sort()
writeFileSync('.probe/I06-events.txt', out.join('\n'), 'utf8')

const words = process.argv.slice(2)
if (words.length) {
  const hits: string[] = []
  for (const f of readdirSync('research/manifests')) {
    const m = parse(readFileSync(`research/manifests/${f}`, 'utf8')) ?? {}
    for (const s of m.web ?? []) {
      const t = `${s.title ?? ''} ${s.url}`
      if (words.some((w) => t.includes(w))) hits.push(`${f}\t${s.id}\t${s.date ?? ''}\t${s.title}\t${s.url}`)
    }
  }
  writeFileSync('.probe/I06-sources.txt', hits.join('\n'), 'utf8')
}
