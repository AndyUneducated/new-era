// print id / name / status / statusNote / fall for the cards whose headline lines are given
import { readFileSync, writeFileSync } from 'node:fs'

const want: Record<string, number[]> = {
  'content/people/K05.yaml': [2099, 2513, 2894, 2241, 1798, 3460],
  'content/people/K06.yaml': [2646, 2752, 2846, 3074, 3758, 4029, 2360],
  'content/people/R04.yaml': [1509, 23, 2192],
  'content/people/R07.yaml': [285, 332],
  'content/people/R08.yaml': [556, 705, 909, 1245, 1425],
  'content/people/R10.yaml': [17],
  'content/people/C11.yaml': [208, 234],
  'content/people/K08.yaml': [656, 726, 196],
  'content/people/C03.yaml': [18, 281, 704],
  'content/people/K04.yaml': [2667, 3776, 5053],
}
const out: string[] = []
for (const [f, lines] of Object.entries(want)) {
  const L = readFileSync(f, 'utf8').split(/\r?\n/)
  for (const n of lines) {
    let s = n - 1
    while (s > 0 && !L[s].startsWith('- id:')) s--
    let e = s + 1
    while (e < L.length && !L[e].startsWith('- id:')) e++
    const block = L.slice(s, e).filter((l) => /^- id:|^  name:|^  status|^  headline|^    - \{ date|^  born/.test(l))
    out.push(`## ${f}:${n}`, ...block, '')
  }
}
writeFileSync('.probe/cs8-peek.txt', out.join('\n'))
