// T02: quick reachability check for candidate source URLs (status, length, captcha, contains a name).
// Usage: node research/scripts/T02-test-urls.ts 名字@url ...   → .probe/T02-test-urls.txt
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '..')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const out = join(root, '.probe/T02-test-urls.txt')
await Promise.all(
  process.argv.slice(2).map(async (arg) => {
    const at = arg.indexOf('@')
    const name = arg.slice(0, at)
    const url = arg.slice(at + 1)
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) })
      const buf = Buffer.from(await res.arrayBuffer())
      let t = buf.toString('utf8')
      if (/charset=["']?gb/i.test(t.slice(0, 2000))) t = new TextDecoder('gbk').decode(buf)
      appendFileSync(out, `${res.status}\t${t.length}\t${/captcha|seccaptcha/.test(t) ? 'CAPTCHA' : 'ok'}\t${t.includes(name) ? 'name' : 'NONAME'}\t${name}\t${url}\n`, 'utf8')
    } catch (err) {
      appendFileSync(out, `ERR\t${(err as Error).message}\t${name}\t${url}\n`, 'utf8')
    }
  }),
)
