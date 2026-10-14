// T02: run tools/fetch-web.ts on T02 source ids (always named, never the whole queue).
// Usage: node research/scripts/T02-fetch.ts [--peek] [--force] [--only=id,id | --missing]
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { SOURCES } from './T02-sources.ts'

const root = join(import.meta.dirname, '..', '..')
const args = process.argv.slice(2)
const only = args.find((a) => a.startsWith('--only='))?.slice(7).split(',')
let ids = only ?? SOURCES.map((s) => s.id)
if (args.includes('--missing')) ids = ids.filter((id) => !existsSync(join(root, 'sources/text', `${id}.txt`)))
const flags = args.filter((a) => a === '--peek' || a === '--force')
const r = spawnSync(process.execPath, ['tools/fetch-web.ts', ...flags, '--report=T02', ...ids], { cwd: root, stdio: 'inherit' })
process.exit(r.status ?? 1)
