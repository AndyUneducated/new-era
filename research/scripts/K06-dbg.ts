// One-off: list every generated position and bio for review.
import fs from 'node:fs'
const t = fs.readFileSync('content/people/K06.yaml', 'utf8')
const out: string[] = []
let id = ''
for (const l of t.split('\n')) {
  const m = l.match(/^- id: (.+)$/)
  if (m) id = m[1]
  const b = l.match(/^    (\S.*)$/)
  if (b && !l.includes('{ title')) out.push(`${id} BIO ${b[1]}`)
  const p = l.match(/title: (.*?), sys: (\w+)(?:, place: (\S+?))?,.*cite: (\S+) \}/)
  if (p) out.push(`${id} | ${p[1]} | ${p[2]} | ${p[3] ?? ''} | ${p[4]}`)
}
fs.writeFileSync(`.probe/k06-review-${process.argv[2] ?? 'a'}.txt`, out.join('\n'), 'utf8')
