import { readFileSync, writeFileSync } from 'node:fs'
const lines = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter((l) => l.includes('|'))
const out: string[] = []
const cache = new Map<string, string>()
for (const l of lines) {
  const [id, phrase] = l.split('|')
  if (!cache.has(id)) { try { cache.set(id, readFileSync(`sources/text/${id}.txt`, 'utf8')) } catch { cache.set(id, '') } }
  const t = cache.get(id)!
  const flat = t.replace(/\s+/g, ''); const p = phrase.replace(/\s+/g, '')
  let i = flat.indexOf(p)
  if (i < 0) { out.push(`MISS ${id} | ${phrase}`); continue }
  let n = 0
  while (i >= 0 && n < 4) {
    out.push(`ok   ${id} | …${flat.slice(Math.max(0, i - 60), i + p.length + 100)}…`)
    i = flat.indexOf(p, i + p.length); n++
  }
}
writeFileSync('.probe/I06-kwic.txt', out.join('\n'), 'utf8')
