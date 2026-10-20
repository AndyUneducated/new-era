// C16 discovery only: reads each pending person's zh.wikipedia wikitext and lists the sentences about
// prosecution, trial and verdict with the reference URLs next to them, so the original reports can be
// registered and fetched through tools/fetch-web.ts. Nothing here is cited.
// node research/scripts/C16-wiki.ts [id ...]  ->  .probe/c16-wiki.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const list = readFileSync(join(ROOT, 'research/lists/R17-pending-cases.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const only = new Set(process.argv.slice(2))
const cards = new Map<string, any>()
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const p of parse(readFileSync(join(ROOT, 'content/people', f), 'utf8')) ?? []) cards.set(p.id, p)
  } catch {}
}
const get = async (url: string) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) })
  return r.ok ? r.text() : ''
}
const out: string[] = []
for (const [id, name, , sys, , , blurb] of list) {
  if (only.size ? !only.has(id) : sys === 'other' || sys === 'army') continue
  let title = name
  const q = cards.get(id)?.ids?.wikidata
  try {
    if (q) {
      const j = JSON.parse(await get(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${q}&props=sitelinks&sitefilter=zhwiki&format=json`))
      title = j.entities?.[q]?.sitelinks?.zhwiki?.title ?? name
    }
    let raw = await get(`https://zh.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`)
    const redirect = raw.match(/^#(?:REDIRECT|重定向)\s*\[\[([^\]]+)\]\]/i)?.[1]
    if (redirect) raw = await get(`https://zh.wikipedia.org/w/index.php?title=${encodeURIComponent(redirect)}&action=raw`)
    if (!raw) {
      out.push(`## ${id} ${name} (${title}): no page`, '')
      continue
    }
    const hits = raw
      .split(/\n/)
      .flatMap((l) => l.split(/(?<=。)/))
      .filter((s) => /判处|宣判|判决|开庭|公诉|审理|获刑|一审|二审|终审/.test(s))
    out.push(`## ${id} ${name} (${title}) ${raw.length} chars | ${blurb}`, ...hits.map((h) => '  ' + h.slice(0, 600)), '')
  } catch (e) {
    out.push(`## ${id} ${name}: ${(e as Error).message}`, '')
  }
  await new Promise((r) => setTimeout(r, 400))
}
writeFileSync(join(ROOT, '.probe/c16-wiki.txt'), out.join('\n'))
