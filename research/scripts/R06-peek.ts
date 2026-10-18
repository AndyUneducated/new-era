// Fetches pages for list research only (not sources): node research/scripts/R06-peek.ts name=url ...
// Writes stripped text to .probe/R06-peek-<name>.txt; with --links also keeps <a href> targets.
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const links = process.argv.includes('--links')
for (const arg of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const k = arg.indexOf('=')
  const name = arg.slice(0, k)
  const url = arg.slice(k + 1)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(60000) })
    const buf = Buffer.from(await res.arrayBuffer())
    let html = new TextDecoder('utf-8').decode(buf)
    if (/charset=["']?gb/i.test(html.slice(0, 2000))) html = new TextDecoder('gbk').decode(buf)
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
    if (links) text = text.replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi, ' [$1] ')
    text = text
      .replace(/<(br|p|div|li|tr|h\d)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
    writeFileSync(`.probe/R06-peek-${name}.txt`, `${res.status} ${url}\n${text}`, 'utf8')
    console.log(`ok ${name} ${res.status} ${text.length}`)
  } catch (err) {
    console.log(`FAIL ${name} ${(err as Error).message}`)
  }
}
