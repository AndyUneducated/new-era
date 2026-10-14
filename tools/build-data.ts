// Compiles content/*.yaml + research/ + sources/text into public/data/db.json.
// Fails on schema errors, dangling ids, uncited facts, or quotes that do not occur verbatim in their source.
import { mkdirSync, writeFileSync } from 'node:fs'
import { check } from './build/check.ts'
import { compile, stats, write } from './build/emit.ts'
import { BATCH, errors, path, warnings } from './build/io.ts'
import { loadAll } from './build/load.ts'

const data = loadAll()
check(data)
const db = compile(data)

// the Windows console garbles Chinese, so the full report is also written as UTF-8
const report = [...errors.map((e) => `x ${e}`), ...warnings.map((w) => `! ${w}`)].join('\n')
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `build-report${BATCH ? `-${BATCH}` : ''}.txt`), report + '\n')
if (warnings.length && process.argv.includes('--warn')) console.warn(warnings.map((w) => `  ! ${w}`).join('\n'))
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n` + errors.map((e) => `  x ${e}`).join('\n'))
  process.exit(1)
}
if (BATCH) {
  console.log(`batch ${BATCH}: no errors (db.json not written in batch mode)\n` + stats(db))
  process.exit(0)
}
write(db)
console.log(stats(db) + (warnings.length ? `\n${warnings.length} warning(s), --warn to list` : ''))
