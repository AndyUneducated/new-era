// Sets or removes fields of content/photos/PH5.yaml entries.
//   node research/scripts/PH5-focus.ts id=42%,30% …     focus (comma for the space)
//   node research/scripts/PH5-focus.ts --drop id …      remove the entries
import { readFileSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'

const PATH = 'content/photos/PH5.yaml'
const photos: Record<string, Record<string, string>> = parse(readFileSync(PATH, 'utf8')) ?? {}
const args = process.argv.slice(2)
const drop = args.includes('--drop')
for (const a of args.filter((x) => !x.startsWith('--'))) {
  if (drop) {
    delete photos[a]
    continue
  }
  const [id, v] = a.split('=')
  if (!photos[id]) throw new Error(`no entry ${id}`)
  photos[id].focus = v.replace(',', ' ')
}
writeFileSync(PATH, `# Portrait attribution, one entry per person id. Written by tools/fetch-photos.ts; hand edits are kept.\n${stringify(photos, { lineWidth: 0 })}`)
console.log(`${Object.keys(photos).length} entries`)
