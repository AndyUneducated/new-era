// BD1: probe which search endpoints answer from this machine -> .probe/bd1-test2.txt
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const q = encodeURIComponent('邱大明 吉林省纪委 出生')
const urls = [
  `https://www.so.com/s?q=${q}`,
  `https://m.so.com/s?q=${q}`,
  `https://m.sm.cn/s?q=${q}`,
  `https://search.brave.com/search?q=${q}`,
  `https://www.mojeek.com/search?q=${q}`,
  `https://yandex.com/search/?text=${q}`,
  `https://www.google.com/search?q=${q}&hl=zh-CN`,
  `https://www.startpage.com/do/search?q=${q}`,
  `https://lite.duckduckgo.com/lite/?q=${q}`,
  `https://m.baidu.com/s?word=${q}`,
  `https://wap.sogou.com/web/searchList.jsp?keyword=${q}`,
  `https://cn.bing.com/search?q=${q}&ensearch=0`,
  `https://www.toutiao.com/search/?keyword=${q}`,
  `https://so.toutiao.com/search?keyword=${q}`,
]
const out: string[] = []
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(20000) })
    const t = await r.text()
    const hit = /1962年/.test(t)
    const cap = /captcha|验证码|antispider|unusual traffic|robot/i.test(t)
    out.push(`${r.status}\t${t.length}\thit1962=${hit}\tcaptcha=${cap}\t${u.slice(0, 60)}`)
  } catch (e) {
    out.push(`ERR\t${(e as Error).message}\t${u.slice(0, 60)}`)
  }
}
writeFileSync('.probe/bd1-test2.txt', out.join('\n') + '\n', 'utf8')
