// Adds a news-photo entry (not Baike) to content/photos/PH5.yaml.
//   node research/scripts/PH5-add.ts <id> <image url> <page url> <author> [focus]
import { readFileSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'

const PATH = 'content/photos/PH5.yaml'
const photos: Record<string, Record<string, string>> = parse(readFileSync(PATH, 'utf8')) ?? {}
const [id, file, url, author, focus] = process.argv.slice(2)
if (!id || !file || !url || !author) throw new Error('usage: <id> <image url> <page url> <author> [focus]')
photos[id] = { file, url, author, license: '版权归原发布机构', ...(focus ? { focus } : {}) }
const sorted = Object.fromEntries(Object.entries(photos).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(PATH, `# Portrait attribution, one entry per person id. Written by tools/fetch-photos.ts; hand edits are kept.\n${stringify(sorted, { lineWidth: 0 })}`)
console.log(`${Object.keys(sorted).length} entries`)
