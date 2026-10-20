// RL2: set the keep list of manifest entries in research/manifests/RL2.yaml from a TSV (.probe/RL2-setkeep.tsv:
// id<TAB>keep1|keep2|...), or with --prune drop the leftover peek-only rl2-wp-* entries (keep: [ "→" ]) and the markers.
// Run: node research/scripts/RL2-setkeep.ts [--prune]
import { readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'

const file = path('research', 'manifests', 'RL2.yaml')
let lines = readFileSync(file, 'utf8').split('\n')
if (process.argv.includes('--prune')) {
  lines = lines.filter((l) => !/RL2-wikigen/.test(l) && !(/id: rl2-wp-/.test(l) && l.includes('keep: [ "→" ]')))
} else {
  for (const row of readFileSync(path('.probe', 'RL2-setkeep.tsv'), 'utf8').split(/\r?\n/).filter(Boolean)) {
    const [id, keeps] = row.split('\t')
    const i = lines.findIndex((l) => l.includes(`id: ${id},`))
    if (i < 0) throw new Error(`no entry ${id}`)
    lines[i] = lines[i].replace(/keep: \[.*\] \}$/, `keep: [ ${keeps.split('|').map((k) => JSON.stringify(k)).join(', ')} ] }`)
  }
}
writeFileSync(file, lines.join('\n'))
