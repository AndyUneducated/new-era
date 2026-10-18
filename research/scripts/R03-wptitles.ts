// R03 one-off: resolve zh.wikipedia titles for new cards. For each "name|keyword" pair, search and print the top hits
// whose snippet contains the keyword.   node research/scripts/R03-wptitles.ts 刘礼祖|江西 ...   -> .probe/R03-wptitles.txt
import { writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const out: string[] = []
for (const arg of process.argv.slice(2)) {
  const [name, kw] = arg.split('|')
  const u = `https://zh.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=6&srsearch=${encodeURIComponent(`${name} ${kw}`)}`
  const j = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
  const hits = (j.query?.search ?? []) as { title: string; snippet: string }[]
  out.push(`## ${name} (${kw})`)
  for (const h of hits.filter((h) => h.title.includes(name))) out.push(`  ${h.title} :: ${h.snippet.replace(/<[^>]+>/g, '').slice(0, 120)}`)
  await new Promise((r) => setTimeout(r, 300))
}
writeFileSync('.probe/R03-wptitles.txt', out.join('\n') + '\n')
console.log('done')
