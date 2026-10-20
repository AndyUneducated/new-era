// BD1: connectivity test for candidate biography sites -> .probe/bd1-test.txt
import { writeFileSync } from 'node:fs'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const urls = process.argv.slice(2)
const out: string[] = []
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(20000) })
    const t = await r.text()
    const plain = t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const i = plain.search(/\d{4}年\d{1,2}月/)
    out.push(`## ${u}\n${r.status} len=${t.length}\n${plain.slice(Math.max(0, i - 150), i + 250)}`)
  } catch (e) {
    out.push(`## ${u}\nERR ${(e as Error).message}`)
  }
}
writeFileSync('.probe/bd1-test.txt', out.join('\n') + '\n', 'utf8')
