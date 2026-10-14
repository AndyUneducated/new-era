// K04: fetch the picked Wikidata records with the project tool, and the zh.wikipedia article texts (zh-cn) as
// a drafting digest: lead paragraphs, career lines, the Wikidata record and the CC seats per person.
//   node research/scripts/K04-wiki.ts [--no-wd]
// Writes research/wikidata/<QID>.json (tool), .probe/K04-wiki/<key>.txt, .probe/K04-digest-<n>.txt
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
type Pick = { key: string; name: string; seats: string; qid?: string; title?: string }
const picks = Object.values(JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-picks.json'), 'utf8')) as Record<string, Pick>)

const qids = picks.map((p) => p.qid!).filter((q) => !existsSync(join(ROOT, 'research', 'wikidata', `${q}.json`)))
if (!process.argv.includes('--no-wd'))
  for (let i = 0; i < qids.length; i += 40)
    for (let a = 0; ; a++)
      try {
        execFileSync('node', ['tools/fetch-wikidata.ts', ...qids.slice(i, i + 40)], { cwd: ROOT, stdio: 'inherit' })
        await sleep(5000)
        break
      } catch {
        if (a >= 4) throw new Error('wikidata keeps failing')
        await sleep(60_000)
      }

// same extraction as tools/fetch-web.ts, so the paragraphs match what the fetcher will keep
function decode(s: string): string {
  const named: Record<string, string> = { ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', hellip: '…', middot: '·', copy: '©', quot: '"', amp: '&', lt: '<', gt: '>', nbsp: ' ', apos: "'" }
  return s
    .replace(/&([a-z]+);/g, (m, n: string) => named[n] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
}
function htmlToText(html: string): string {
  return decode(
    html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article|figcaption|td)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/[ \t\u3000\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

const dir = join(ROOT, '.probe', 'K04-wiki')
mkdirSync(dir, { recursive: true })
for (const p of picks) {
  const file = join(dir, `${p.key}.txt`)
  if (existsSync(file)) continue
  const title = p.title ?? p.name
  const u = `https://zh.wikipedia.org/zh-cn/${encodeURIComponent(title.replace(/ /g, '_'))}`
  for (let a = 0; ; a++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN' } })
    if (res.ok) {
      writeFileSync(file, `URL ${res.url}\n` + htmlToText(await res.text()))
      break
    }
    if (res.status === 404 || a >= 3) {
      writeFileSync(file, `MISSING ${res.status} ${u}\n`)
      break
    }
    await sleep(5000)
  }
  await sleep(700)
}

// digest: paragraphs between the first one naming the person and the references
const out: string[][] = [[]]
for (const p of picks) {
  const text = readFileSync(join(dir, `${p.key}.txt`), 'utf8')
  const paras = text.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  const start = paras.findIndex((s) => s.startsWith(p.name) && /[，（(]/.test(s.slice(p.name.length, p.name.length + 2)) && s.length > 30)
  const end = paras.findIndex((s, i) => i > start && /^(参考文献|参考资料|参见|外部链接|注释|参考来源)$/.test(s))
  const body = start >= 0 ? paras.slice(start, end > 0 ? end : start + 40) : []
  const wd = p.qid && existsSync(join(ROOT, 'research', 'wikidata', `${p.qid}.json`)) ? JSON.parse(readFileSync(join(ROOT, 'research', 'wikidata', `${p.qid}.json`), 'utf8')) : {}
  const clean = body.filter((s) => s.length > 6).map((s) => s.replace(/\[\d+\]/g, ''))
  const career = clean.filter((s) => /^(199[5-9]|20\d\d)年/.test(s)).map((s) => s.slice(0, 90))
  const fate = clean.filter((s, i) => i > 0 && /审查|调查|开除|判处|判决|逝世|去世|病逝|自杀|落马|处分|撤销/.test(s)).map((s) => s.slice(0, 160))
  const lines = [
    `### ${p.key} | ${p.seats} | ${p.qid}`,
    `WD: ${wd.born ?? '?'}${wd.died ? ` d.${wd.died}` : ''} ${wd.birthplace ?? ''} | ${wd.description ?? ''} | ${(wd.positions ?? []).map((x: { label: string; from?: string; to?: string }) => `${x.label}${x.from ? ` ${x.from}` : ''}${x.to ? `–${x.to}` : ''}`).join('; ')}`,
    `L: ${(clean[0] ?? '(no lead)').slice(0, 350)}`,
    ...career.slice(-8).map((s) => `C: ${s}`),
    ...fate.slice(0, 3).map((s) => `F: ${s}`),
    '',
  ]
  if (out[out.length - 1].length > 1200) out.push([])
  out[out.length - 1].push(...lines)
}
out.forEach((chunk, i) => writeFileSync(join(ROOT, '.probe', `K04-digest-${i}.txt`), chunk.join('\n') + '\n'))
console.log(`${picks.length} people, ${out.length} digest files`)
