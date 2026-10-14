// P01 one-off: compact view of the list-page paragraphs that mention 1990s–2020s dates.
// Writes .probe/P01-listlines.txt.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const PROVS = ['beijing', 'tianjin', 'hebei', 'shanxi', 'neimenggu', 'liaoning', 'jilin', 'heilongjiang', 'shanghai', 'jiangsu', 'zhejiang', 'anhui', 'fujian', 'jiangxi', 'shandong']
const out: string[] = []
for (const p of PROVS) {
  for (const post of ['sec', 'gov']) {
    const f = `.probe/peek-p01-wiki-${p}-${post}.txt`
    out.push(`## ${p}-${post}`)
    if (!existsSync(f)) {
      out.push('  NO PEEK')
      continue
    }
    const paras = readFileSync(f, 'utf8').split(/\n+/).map((s) => s.trim())
    for (const s of paras) {
      if (!/(199[3-9]|20[0-2]\d)年/.test(s) || s.startsWith('^')) continue
      out.push(`  ${s.length > 160 ? s.slice(0, 160) + '…' : s}`)
    }
  }
}
writeFileSync('.probe/P01-listlines.txt', out.join('\n') + '\n')
