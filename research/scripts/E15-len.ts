// summary lengths and lane counts for content/events/E15.yaml
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const events = parse(readFileSync('content/events/E15.yaml', 'utf8')) as { id: string; lane: string; summary: string }[]
const lanes: Record<string, number> = {}
const out: string[] = []
for (const e of events) {
  lanes[e.lane] = (lanes[e.lane] ?? 0) + 1
  const n = [...e.summary].length
  out.push(`${n < 80 || n > 200 ? '!!' : '  '} ${n}\t${e.lane}\t${e.id}`)
}
out.push('', `total ${events.length}`, JSON.stringify(lanes))
writeFileSync('.probe/e15-len.txt', out.join('\n'), 'utf8')
