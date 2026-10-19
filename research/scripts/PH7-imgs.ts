// Lists the images on news pages with the text around them (captions), for picking portraits of people Baike has
// no picture of. Writes .probe/PH7-imgs.txt.
//   node research/scripts/PH7-imgs.ts [--grep=<regex>] <url> …     --grep also lists raw matches in the HTML
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const out = '.probe/PH7-imgs.txt'
writeFileSync(out, '')
const text = (s: string) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const grep = process.argv.find((a) => a.startsWith('--grep='))?.slice(7)
for (const url of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, redirect: 'follow' })
    const buf = Buffer.from(await res.arrayBuffer())
    let html = buf.toString('utf8')
    if (/charset=["']?gb/i.test(html.slice(0, 3000))) html = new TextDecoder('gbk').decode(buf)
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? ''
    const lines: string[] = []
    for (const m of html.matchAll(/<img\b[^>]*?(?:data-src|data-original|src)=["']([^"']+)["'][^>]*>/gi)) {
      const src = new URL(m[1].replace(/&amp;/g, '&'), res.url).href
      if (/logo|icon|qrcode|erweima|\.gif|\.svg|blank|avatar|share|_145_97|file\.caixin|healthpoint|caixin\.com\/201[457]-\d\d-\d\d\/\d+\.png|^data:|sphdigital\.com\.sg\/image\/zaobao\/(e215|705c)|ws\.126\.net\/\?url|hkhl\.hk\/.*\/2026-10/i.test(src)) continue
      const after = text(html.slice(m.index! + m[0].length, m.index! + m[0].length + 600)).slice(0, 110)
      lines.push(`  ${src}\n     ${after}`)
    }
    const extra = grep ? [...new Set([...html.matchAll(new RegExp(grep, 'g'))].map((x) => x[0]))].map((x) => `  ~ ${x}`) : []
    appendFileSync(out, `== ${url}\nstatus ${res.status} final ${res.url}\ntitle ${title}\n${lines.slice(0, 30).join('\n')}\n${extra.join('\n')}\n\n`)
  } catch (e) {
    appendFileSync(out, `== ${url}\nERR ${(e as Error).message}\n\n`)
  }
  await new Promise((r) => setTimeout(r, 600))
}
console.log('done')
