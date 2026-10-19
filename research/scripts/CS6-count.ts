// CS6 helper: section headings and character counts of content/cases/CS6.yaml (for the report).
// Run: node research/scripts/CS6-count.ts   (writes .probe/CS6-count.txt)
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { path } from '../../tools/build/io.ts'

const cases = parse(readFileSync(path('content', 'cases', 'CS6.yaml'), 'utf8')) as {
  id: string
  title: string
  sections: { h: string; text: string }[]
  editor: { text: string }[]
}[]
const len = (s: string) => [...s.replace(/\s/g, '')].length
const out: string[] = []
for (const c of cases) {
  const total = c.sections.reduce((n, s) => n + len(s.text), 0) + c.editor.reduce((n, e) => n + len(e.text), 0)
  out.push(`${c.id}\t${c.title}\t共${total}字`)
  for (const s of c.sections) out.push(`  ${s.h}\t${len(s.text)}`)
  c.editor.forEach((e, i) => out.push(`  编者${i + 1}\t${len(e.text)}`))
}
writeFileSync(path('.probe', 'CS6-count.txt'), out.join('\n') + '\n')
