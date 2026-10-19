// Which ids on research/photo-PH5.md (plus extra ids given) already have a photo entry or file. Writes .probe/PH5-have.txt.
//   node research/scripts/PH5-have.ts [id …]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const entries = new Map<string, string>()
for (const f of readdirSync('content/photos')) {
  if (!f.endsWith('.yaml') || f === 'PH5.yaml') continue
  for (const id of Object.keys(parse(readFileSync(`content/photos/${f}`, 'utf8')) ?? {})) entries.set(id, f)
}
if (existsSync('content/photos.yaml')) for (const id of Object.keys(parse(readFileSync('content/photos.yaml', 'utf8')) ?? {})) entries.set(id, 'photos.yaml')
const ids = [
  ...readFileSync('research/photo-PH5.md', 'utf8')
    .split('\n')
    .map((l) => l.match(/^- ([a-z0-9-]+) /)?.[1])
    .filter((x): x is string => !!x),
  ...process.argv.slice(2),
]
const lines = ids.map((id) => {
  const file = ['jpg', 'png', 'webp'].find((x) => existsSync(`public/photos/${id}.${x}`))
  return `${id}\t${entries.get(id) ?? '-'}\t${file ?? '-'}`
})
writeFileSync('.probe/PH5-have.txt', lines.join('\n') + '\n')
console.log(lines.filter((l) => !l.endsWith('-\t-')).length, 'of', ids.length, 'have something')
