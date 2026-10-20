// Colour scores from .probe/photo-audit.json for the entries of content/photos/PH9.yaml, lowest first, plus any
// entry with no file or a non-JPEG file. Writes .probe/PH9-audit.txt.
//   node research/scripts/PH9-audit.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const photos = parse(readFileSync('content/photos/PH9.yaml', 'utf8')) ?? {}
const audit = JSON.parse(readFileSync('.probe/photo-audit.json', 'utf8')) as { id: string; file: string; w: number; h: number; kb: number; colour: number; grey: boolean }[]
const byId = new Map(audit.map((a) => [a.id, a]))
const out: string[] = []
for (const id of Object.keys(photos)) {
  const a = byId.get(id)
  const ext = ['jpg', 'png', 'webp'].find((x) => existsSync(`public/photos/${id}.${x}`))
  if (!ext) out.push(`NOFILE ${id}`)
  else if (ext !== 'jpg') out.push(`EXT ${ext} ${id}`)
  if (a) out.push(`${a.colour.toFixed(1).padStart(6)} ${a.grey ? 'GREY' : '    '} ${id} ${a.w}x${a.h} ${a.kb}KB`)
  else if (ext) out.push(`NOAUDIT ${id}`)
}
out.sort()
writeFileSync('.probe/PH9-audit.txt', out.join('\n') + '\n')
console.log(`${Object.keys(photos).length} entries`)
