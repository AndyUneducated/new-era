// Runs a tool with arguments read from a UTF-8 file (one per line), since PowerShell garbles Chinese arguments.
//   node research/scripts/K07-run.ts <args-file> <tool.ts> [fixed args ...]
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const [file, tool, ...fixed] = process.argv.slice(2)
const extra = readFileSync(file, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
const r = spawnSync(process.execPath, [tool, ...fixed, ...extra], { stdio: 'inherit' })
process.exit(r.status ?? 1)
