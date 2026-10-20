// Counts of the PH10 photos by rank (from research/lists/R16-photo-next.txt) and by page host, and the rank0–3
// people still without a photo: writes .probe/PH10-stats.txt.
//   node research/scripts/PH10-stats.ts
import { readFileSync, writeFileSync } from 'node:fs'

const yaml = readFileSync('content/photos/PH10.yaml', 'utf8')
const entries = new Map<string, Record<string, string>>()
let cur: Record<string, string> | null = null
for (const l of yaml.split('\n')) {
  const id = l.match(/^([a-z0-9-]+):\s*$/)?.[1]
  if (id) entries.set(id, (cur = {}))
  else if (cur) {
    const m = l.match(/^\s+(\w+):\s*(.*)$/)
    if (m) cur[m[1]] = m[2]
  }
}
const people = readFileSync('research/lists/R16-photo-next.txt', 'utf8')
  .split('\n')
  .filter((l) => /^rank[0-3]\t/.test(l))
  .map((l) => l.split('\t'))
const out: string[] = []
const byRank = new Map<string, number>()
for (const [rank, id] of people) if (entries.has(id)) byRank.set(rank, (byRank.get(rank) ?? 0) + 1)
out.push(`photos ${entries.size}`)
for (const [r, n] of [...byRank].sort()) out.push(`${r} ${n}`)
const rankOf = new Map(people.map(([r, id]) => [id, r]))
for (const id of entries.keys()) if (!rankOf.has(id)) out.push(`not on list: ${id}`)
const hosts = new Map<string, string[]>()
for (const [id, e] of entries) {
  const h = (() => {
    try {
      return new URL(e.url).hostname.replace(/^(www|m|news)\./, '')
    } catch {
      return '?'
    }
  })()
  const cache = /360图片搜索缓存/.test(e.author ?? '') ? ' (360 cache)' : ''
  const k = h + cache
  hosts.set(k, [...(hosts.get(k) ?? []), id])
}
out.push('', 'by page host')
for (const [h, ids] of [...hosts].sort((a, b) => b[1].length - a[1].length)) out.push(`${ids.length}\t${h}\t${ids.join(' ')}`)
out.push('', 'missing')
for (const [rank, id, name, about] of people) if (!entries.has(id)) out.push(`${rank}\t${id}\t${name}\t${about}`)
writeFileSync('.probe/PH10-stats.txt', out.join('\n') + '\n')
