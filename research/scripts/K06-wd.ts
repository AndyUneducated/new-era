// Runs the Wikidata name lookup for the K06 roster (.probe/K06-roster.json) without passing Chinese through the shell.
//   node research/scripts/K06-wd.ts find      -> .probe/K06.json
//   node research/scripts/K06-wd.ts fetch     fetches every QID picked in research/scripts/K06-picks.json
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const bare = (s: string) => s.replace(/（[^）]*）/g, '').trim()
const run = (args: string[]) => spawnSync(process.execPath, [join(ROOT, 'tools', 'fetch-wikidata.ts'), ...args], { cwd: ROOT, stdio: 'inherit' })

if (process.argv[2] === 'find') {
  const { mine } = JSON.parse(readFileSync(join(ROOT, '.probe', 'K06-roster.json'), 'utf8')) as { mine: { name: string }[] }
  const extra = process.argv.slice(3)
  const names = [...new Set([...mine.map((r) => bare(r.name)), ...extra])]
  // small chunks with a pause: the search API rate-limits, and the tool writes nothing if it dies midway
  const merged: Record<string, unknown> = {}
  for (let i = 0, k = 1; i < names.length; i += 20, k++) {
    const out = join(ROOT, '.probe', `K06-${k}.json`)
    if (!existsSync(out)) {
      run(['--find', `--out=K06-${k}`, ...names.slice(i, i + 20)])
      await new Promise((r) => setTimeout(r, 15_000))
    }
    if (existsSync(out)) Object.assign(merged, JSON.parse(readFileSync(out, 'utf8')))
  }
  writeFileSync(join(ROOT, '.probe', 'K06.json'), JSON.stringify(merged, null, 1))
  console.log(`${Object.keys(merged).length}/${names.length} names in .probe/K06.json`)
} else if (process.argv[2] === 'fetch') {
  const { PICKS } = await import('./K06-ids.ts')
  const auto = JSON.parse(readFileSync(join(ROOT, '.probe', 'K06-picks.json'), 'utf8')) as Record<string, { qid?: string }>
  const picks = [...Object.values(auto).map((p) => p.qid ?? ''), ...Object.values(PICKS)]
  const qids = [...new Set(picks.filter((q) => /^Q\d+$/.test(q)))].filter((q) => !existsSync(join(ROOT, 'research', 'wikidata', `${q}.json`)))
  console.log(`${qids.length} records to fetch`)
  for (let i = 0; i < qids.length; i += 60) run(qids.slice(i, i + 60))
}
