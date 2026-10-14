// T01 one-off: for people whose verdict report did not peek, try the other notices from .probe/T01-refs.txt
// (verdict, then probe, then expulsion), through Wayback where the site needs it, and keep the first page
// that answers 200 and names the person. Usage: node research/scripts/T01-pick.ts person-id ...
// Appends to .probe/T01-pick.txt: person id <tab> kind <tab> url <tab> title
import { appendFileSync, readFileSync } from 'node:fs'
import { PEOPLE } from './T01-spec.ts'

const refs = new Map<string, [string, string][]>()
let cur = ''
for (const l of readFileSync('.probe/T01-refs.txt', 'utf8').split('\n')) {
  if (l.startsWith('## ')) refs.set((cur = l.slice(3).trim()), [])
  else if (l.trim() && cur) {
    const [t, u] = l.trim().split('\t')
    if (u) refs.get(cur)!.push([t, u])
  }
}
const kind = (t: string) => (/判|宣判|获刑|获无期|囚/.test(t) ? 'verdict' : /开除|双开/.test(t) ? 'expel' : 'probe')
const order = { verdict: 0, probe: 1, expel: 2 }
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function get(url: string): Promise<string | null> {
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) })
      if (res.status !== 200) return null
      const buf = new Uint8Array(await res.arrayBuffer())
      const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
      const cs = (head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
      return new TextDecoder(cs === 'gb2312' ? 'gbk' : cs).decode(buf)
    } catch {
      await sleep(10_000)
    }
  }
  return null
}

for (const pid of process.argv.slice(2)) {
  const row = PEOPLE.find((p) => p[1] === pid)
  if (!row) continue
  const name = row[0]
  const cands = (refs.get(name) ?? []).filter(([t]) => t.includes(name)).sort((a, b) => order[kind(a[0])] - order[kind(b[0])])
  let hit = 'NONE'
  for (const [t, u] of cands) {
    if (/hk01|wikipedia/.test(u)) continue
    const tries = /ccdi\.gov\.cn|chinacourt|news\.xinhuanet|news\.qq|ifeng|sina\.com\.cn|huanqiu|thepaper/.test(u)
      ? [`https://web.archive.org/web/2017id_/${u}`]
      : [u, `https://web.archive.org/web/2019id_/${u}`]
    for (const url of tries) {
      const html = await get(url)
      await sleep(4000)
      const body = html?.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '')
      if (body && body.split(name).length > 2) {
        hit = `${kind(t)}\t${url}\t${t}`
        break
      }
    }
    if (hit !== 'NONE') break
  }
  appendFileSync('.probe/T01-pick.txt', `${pid}\t${hit}\n`, 'utf8')
  console.log(pid, hit.split('\t')[0])
}
