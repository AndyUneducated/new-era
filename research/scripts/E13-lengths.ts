// Summary lengths of E13 events, flagging those outside 80–200 characters.
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const events = parse(readFileSync('content/events/E13.yaml', 'utf8')) as { id: string; summary: string; major?: boolean; lane: string }[]
const lines = events.map((e) => {
  const n = [...e.summary].length
  return `${n < 80 || n > 200 ? 'BAD' : 'ok '}\t${n}\t${e.lane}\t${e.major ? 'major' : ''}\t${e.id}`
})
lines.push(`total ${events.length}, major ${events.filter((e) => e.major).length}`)
writeFileSync('.probe/E13-lengths.txt', lines.join('\n') + '\n')
