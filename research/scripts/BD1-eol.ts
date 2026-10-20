// BD1: count CRLF and bare LF line endings in the given files (all people files if none)
//   node research/scripts/BD1-eol.ts [file ...] -> .probe/bd1-eol.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync('content/people').map((f) => `content/people/${f}`)
const out: string[] = []
for (const f of files) {
  const t = readFileSync(f, 'utf8')
  const crlf = (t.match(/\r\n/g) ?? []).length
  const lf = (t.match(/(?<!\r)\n/g) ?? []).length
  const bad = lf && crlf ? t.split('\n').map((l, i) => (l.endsWith('\r') ? '' : `${i + 1}`)).filter(Boolean).slice(0, 10).join(',') : ''
  out.push(`${f}\tcrlf=${crlf}\tlf=${lf}${bad ? `\tbare-lf lines ${bad}` : ''}`)
}
writeFileSync('.probe/bd1-eol.txt', out.join('\n') + '\n', 'utf8')
