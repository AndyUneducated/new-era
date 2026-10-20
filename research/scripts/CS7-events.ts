// list army-lane events and any event whose title or summary touches the navy or air force
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const out: string[] = []
for (const f of readdirSync('content/events').filter((f) => f.endsWith('.yaml'))) {
  for (const e of parse(readFileSync(`content/events/${f}`, 'utf8')) ?? []) {
    const hit = /海军|空军|舰|航母|飞行|空降/.test(`${e.title} ${e.summary}`)
    if (e.lane !== 'army' && !hit) continue
    if (String(e.date) < '2012') continue
    out.push(`${e.date}\t${e.id}\t${e.lane}\t${f}\t${e.title}${hit ? '\t[navy/air]' : ''}`)
  }
}
out.sort()
writeFileSync('.probe/CS7-events.txt', out.join('\n'))
