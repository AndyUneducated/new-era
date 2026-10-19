// Searches Wikimedia Commons files for each term; writes .probe/PH5-commons.txt.
//   node research/scripts/PH5-commons.ts "Wang Haijiang" 汪海江 …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const out = '.probe/PH5-commons.txt'
writeFileSync(out, '')
for (const term of process.argv.slice(2)) {
  const u = new URL('https://commons.wikimedia.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'query', format: 'json', list: 'search', srsearch: term, srnamespace: '6', srlimit: '15' })) u.searchParams.set(k, v)
  try {
    const r = (await (await fetch(u, { headers: { 'User-Agent': UA } })).json()) as { query: { search: { title: string }[] } }
    appendFileSync(out, `== ${term}\n${r.query.search.map((s) => `  ${s.title}`).join('\n')}\n\n`)
  } catch (e) {
    appendFileSync(out, `== ${term}\nERR ${(e as Error).message}\n\n`)
  }
}
console.log('done')
