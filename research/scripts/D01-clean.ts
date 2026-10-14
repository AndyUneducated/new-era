// D01 one-off: strip page furniture that start/end cannot cut from three fetched texts, then rewrite sources/text/<id>.txt
// and that id's latest line in research/fetch-log.jsonl (sha256 of the stored page recomputed, chars of the new text,
// textSha256 of the new text, cleaned: true). Idempotent: running it twice changes nothing.
//   2007 charter (人民网): the 【字号】 bar and the page's table of contents (with links to 附1–3) between the adoption note and 总纲
//   2002 charter (人民网): one misplaced space, "第五十条党 的" → "第五十条 党的"
//   1999 constitution (北大法宝): the database's "修订沿革" link after every article, three stray spaces after
//   punctuation, and 第六条 rejoined into the paragraphs the 1999 amendment gives
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))

const fixes: Record<string, (paras: string[]) => string[]> = {
  'd01-people-2007-10-25-party-charter': (paras) => {
    const body = paras.indexOf('总 纲', paras.indexOf('总 纲') + 1)
    return body > 0 ? [paras[0], ...paras.slice(body)] : paras
  },
  'd01-people-2002-11-18-party-charter': (paras) => paras.map((p) => p.replace(/^第五十条党 的/, '第五十条 党的')),
  'd01-pkulaw-1999-03-15-constitution': (paras) =>
    paras
      .filter((p) => p !== '修订沿革')
      .map((p) => p.replace(/([。，、]) (?=\S)/g, '$1'))
      .reduce<string[]>((out, p) => {
        // the 1999 amendment (第十四条) gives 第六条's first two sentences as one paragraph; the database splits them
        if (p.startsWith('社会主义公有制消灭人剥削人的制度') && out.at(-1)?.startsWith('第六条')) out[out.length - 1] += p
        else out.push(p)
        return out
      }, []),
}

const logPath = join(ROOT, 'research', 'fetch-log.jsonl')
const report: string[] = []
const updated = new Map<string, { sha256: string; chars: number; textSha256: string }>()
for (const [id, fix] of Object.entries(fixes)) {
  const textPath = join(ROOT, 'sources', 'text', `${id}.txt`)
  const before = readFileSync(textPath, 'utf8')
  const text = fix(before.replace(/\n$/, '').split('\n\n')).join('\n\n')
  writeFileSync(textPath, text + '\n')
  const html = readFileSync(join(ROOT, 'sources', 'raw', `${id}.html`), 'utf8')
  updated.set(id, {
    sha256: createHash('sha256').update(html).digest('hex'),
    chars: text.length,
    textSha256: createHash('sha256').update(text + '\n').digest('hex'),
  })
  report.push(`${id}: ${before.length - 1} -> ${text.length} chars`)
}

// other batches append to the log while this runs: read and write back in one synchronous step, touching only D01 lines
const lines = readFileSync(logPath, 'utf8').split('\n')
const last = new Map<string, number>()
lines.forEach((l, i) => {
  const id = l.startsWith('{') ? (JSON.parse(l) as { id: string }).id : ''
  if (updated.has(id)) last.set(id, i)
})
for (const [id, i] of last) lines[i] = JSON.stringify({ ...JSON.parse(lines[i]), ...updated.get(id), cleaned: true })
writeFileSync(logPath, lines.join('\n'))
report.push(`fetch-log lines updated: ${[...last.keys()].join(', ')}`)
writeFileSync(join(ROOT, '.probe', 'D01-clean.txt'), report.join('\n') + '\n')
