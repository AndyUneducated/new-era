// Baidu Baike senses of a name: fetches baike.baidu.com/item/<name> and lists the lemma ids with their one-line
// descriptions, so that the right person's lemma can be opened. Writes .probe/PH11-bksense.txt.
//   node research/scripts/PH11-bksense.ts 杨世光 何松 …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const out = '.probe/PH11-bksense.txt'
writeFileSync(out, '')
for (const name of process.argv.slice(2)) {
  try {
    const res = await fetch(`https://baike.baidu.com/item/${encodeURIComponent(name)}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(20000) })
    const html = await res.text()
    appendFileSync(out, `== ${name} (${res.status}, ${html.length})\n`)
    const seen = new Set<string>()
    // senses appear in the page data as {"lemmaId":123,"lemmaTitle":"…","lemmaDesc":"…"}
    for (const m of html.matchAll(/"lemmaId":(\d+),[^{}]*?"lemmaDesc":"([^"]*)"/g)) {
      if (seen.has(m[1])) continue
      seen.add(m[1])
      appendFileSync(out, `${m[1]}\t${m[2]}\n`)
    }
    for (const m of html.matchAll(/"lemmaDesc":"([^"]*)"[^{}]*?"lemmaId":(\d+)/g)) {
      if (seen.has(m[2])) continue
      seen.add(m[2])
      appendFileSync(out, `${m[2]}\t${m[1]}\n`)
    }
  } catch (e) {
    appendFileSync(out, `== ${name}\nERR ${(e as Error).message}\n`)
  }
  await new Promise((r) => setTimeout(r, 500))
}
console.log('done')
