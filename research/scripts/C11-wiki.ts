// C11 research helper: for each QID or name, find the zhwiki page and dump its plain-text extract to
// .probe/c11-wiki/<key>.txt (exploration only; cited text is fetched through tools/fetch-web.ts).
//   node research/scripts/C11-wiki.ts Q700999 Q123 name:姚中秋 title:李林_(法学家)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const OUT = join(ROOT, '.probe', 'c11-wiki')
mkdirSync(OUT, { recursive: true })
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'

async function json(u: string): Promise<any> {
  for (let i = 0; ; i++) {
    const r = await fetch(u, { headers: { 'User-Agent': UA } })
    if (r.ok) return r.json()
    if (i >= 3) throw new Error(`${r.status} ${u}`)
    await new Promise((res) => setTimeout(res, 2000 * (i + 1)))
  }
}

async function titleFor(arg: string): Promise<string | undefined> {
  if (arg.startsWith('title:')) return arg.slice(6)
  if (arg.startsWith('name:')) {
    const q = arg.slice(5)
    const r = await json(`https://zh.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=5&srsearch=${encodeURIComponent(q)}`)
    return r.query.search.map((s: { title: string }) => s.title).join('|')
  }
  const r = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks&ids=${arg}`)
  return r.entities[arg]?.sitelinks?.zhwiki?.title
}

const lines: string[] = []
for (const arg of process.argv.slice(2)) {
  try {
    const t = await titleFor(arg)
    if (!t) { lines.push(`${arg}\tNO ZHWIKI`); continue }
    if (t.includes('|')) { lines.push(`${arg}\tSEARCH: ${t}`); continue }
    const r = await json(`https://zh.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&variant=zh-cn&redirects=1&titles=${encodeURIComponent(t)}`)
    const page = Object.values(r.query.pages)[0] as { title: string; extract?: string }
    const key = arg.replace(/[:/\\?*"<>|]/g, '_')
    writeFileSync(join(OUT, `${key}.txt`), `${page.title}\n\n${page.extract ?? ''}`)
    lines.push(`${arg}\t${page.title}\t${(page.extract ?? '').length}`)
  } catch (e) {
    lines.push(`${arg}\tERROR ${(e as Error).message}`)
  }
}
writeFileSync(join(OUT, '_index.txt'), lines.join('\n') + '\n', { flag: 'a' })
console.log(lines.length, 'done')
