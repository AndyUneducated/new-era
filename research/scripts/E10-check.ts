// Lists E10 events whose summary falls outside 80–200 characters, and counts events per section.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const events = parse(readFileSync(`${ROOT}content/events/E10.yaml`, 'utf8')) as { id: string; summary: string; major?: boolean }[]
const out = events.map((e) => `${[...e.summary].length}\t${e.major ? 'major' : ''}\t${e.id}`)
const bad = events.filter((e) => [...e.summary].length < 80 || [...e.summary].length > 200).map((e) => e.id)
writeFileSync(`${ROOT}.probe/E10-check.txt`, [`total ${events.length}, major ${events.filter((e) => e.major).length}`, `out of range: ${bad.join(', ') || 'none'}`, ...out].join('\n') + '\n')
console.log(events.length, bad.length)
