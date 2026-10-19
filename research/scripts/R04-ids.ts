// Prints the ids in research/manifests/R04.yaml (space-separated) for passing to tools/fetch-web.ts.
//   --missing   only ids without sources/text/<id>.txt
//   --nomark    only ids without start/end markers (and not excerpt)
import { existsSync, readFileSync } from 'node:fs'
import { parse } from 'yaml'
const args = process.argv.slice(2)
const web: { id: string; start?: string; excerpt?: boolean }[] = parse(readFileSync('research/manifests/R04.yaml', 'utf8')).web
const ids = web
  .filter((e) => !args.includes('--missing') || !existsSync(`sources/text/${e.id}.txt`))
  .filter((e) => !args.includes('--nomark') || (!e.start && !e.excerpt))
  .map((e) => e.id)
console.log(ids.join(' '))
