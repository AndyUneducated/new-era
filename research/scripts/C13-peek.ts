// Condense .probe/peek-c13-*.txt (Wikipedia pages) to the article body, into one file.
//   node research/scripts/C13-peek.ts [out-name] [id-substring ...]  -> .probe/<out-name>.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const [name = 'C13-peeks', ...want] = process.argv.slice(2)
const out: string[] = []
for (const f of readdirSync('.probe').filter((f) => f.startsWith('peek-c13-') && (!want.length || want.some((w) => f.includes(w))))) {
  const t = readFileSync(`.probe/${f}`, 'utf8')
  const a = t.lastIndexOf('维基百科，自由的百科全书')
  const b = t.indexOf('取自“', a)
  const body = a > 0 && t.slice(0, 40).includes('维基百科') ? t.slice(a + 12, b > 0 ? b : undefined) : t.slice(0, 6000)
  out.push(`==== ${f}`, body.replace(/\n{2,}/g, '\n').replace(/\n\[编辑\]/g, '').trim())
}
writeFileSync(`.probe/${name}.txt`, out.join('\n') + '\n', 'utf8')
console.log(out.length / 2)
