// Fetches the K03 sources that have no text yet, by id, through tools/fetch-web.ts (40 ids per run).
//   node research/scripts/K03-fetch.ts   -> sources/text/k03-*.txt, .probe/fetch-report-K03.txt
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const web = (parse(readFileSync(join(ROOT, 'research/manifests/K03.yaml'), 'utf8')) as { web: { id: string }[] }).web
const missing = web.map((e) => e.id).filter((id) => !existsSync(join(ROOT, 'sources/text', `${id}.txt`)))
console.log(`${missing.length} to fetch`)
for (let i = 0; i < missing.length; i += 40) {
  spawnSync(process.execPath, ['tools/fetch-web.ts', `--report=K03-${i / 40 + 1}`, ...missing.slice(i, i + 40)], { cwd: ROOT, stdio: 'inherit' })
}
