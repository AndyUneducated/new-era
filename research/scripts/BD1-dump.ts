// BD1: dump one search result page for structure inspection -> .probe/bd1-dump-<n>.html
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
const [n, url] = process.argv.slice(2)
const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(20000) })
const t = (await r.text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, '')
writeFileSync(`.probe/bd1-dump-${n}.html`, t, 'utf8')
