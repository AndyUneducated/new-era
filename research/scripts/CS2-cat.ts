// usage: node research/scripts/CS2-cat.ts <tag> <source id> ...   concatenates sources/text/<id>.txt into .probe/CS2-cat-<tag>.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [tag, ...ids] = process.argv.slice(2)
const out = ids.map((id) => {
  const p = `sources/text/${id}.txt`
  return existsSync(p) ? `=== ${id}\n${readFileSync(p, 'utf8')}` : `=== MISSING ${id}\n`
})
writeFileSync(`.probe/CS2-cat-${tag}.txt`, out.join('\n'))
