// concatenate source texts into one probe file for reading
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [out, ...ids] = process.argv.slice(2)
const parts = ids.map((id) => {
  const f = `sources/text/${id}.txt`
  return `######## ${id}\n${existsSync(f) ? readFileSync(f, 'utf8') : '(missing)'}`
})
writeFileSync(out, parts.join('\n\n'))
