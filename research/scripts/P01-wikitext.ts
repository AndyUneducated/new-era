// P01 one-off: dump zh.wikipedia wikitext (zh-hans) for reading; usage: node research/scripts/P01-wikitext.ts <out> <title> ...
// also lists the page's links, so list-page names can be mapped to biography titles
import { writeFileSync } from 'node:fs'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
export async function api(params: string): Promise<any> {
  const url = `https://zh.wikipedia.org/w/api.php?format=json&${params}`
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'new-era-research/0.1 (one-off research script; yuxiz)' } })
    const body = await res.text()
    try {
      return JSON.parse(body)
    } catch {
      if (i >= 5) throw new Error(body.slice(0, 200))
      await sleep(15_000 * (i + 1))
    }
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const [out, ...titles] = process.argv.slice(2)
  const parts: string[] = []
  for (const t of titles) {
    const j = await api(`action=parse&redirects=1&prop=wikitext|links&variant=zh-hans&page=${encodeURIComponent(t)}`)
    if (j.error) parts.push(`##### ${t}\nERROR ${j.error.info}`)
    else parts.push(`##### ${t} -> ${j.parse.title}\n${j.parse.wikitext['*']}\n### links\n${j.parse.links.map((l: any) => l['*']).join(' | ')}`)
    await sleep(2000)
  }
  writeFileSync(`.probe/${out}`, parts.join('\n\n') + '\n')
}
