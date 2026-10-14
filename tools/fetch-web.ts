// Fetches the sources listed under `web:` in research/manifests/*.yaml.
//   sources/raw/<id>.html      the page as fetched (local only, gitignored)
//   sources/text/<id>.txt      extracted text, or only the kept paragraphs for excerpt sources
//   research/fetch-log.jsonl   one line per fetch (append-only), with the SHA-256 of the page
// Extraction: `start` / `end` mark the first and last characters of the wanted text (inclusive).
// `excerpt: true` + `keep: [...]` keeps only paragraphs containing one of the `keep` strings.
// Usage:
//   node tools/fetch-web.ts [--force] [id ...]     fetch missing (or the named) sources
//   node tools/fetch-web.ts --peek id ...          write the full text to .probe/peek-<id>.txt only
// Messages go to .probe/fetch-report[-<name>].txt as well (--report=<name>), since the Windows console garbles Chinese.
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'

type Entry = { id: string; title: string; url: string; start?: string; end?: string; excerpt?: boolean; keep?: string[]; unwrap?: boolean }

const args = process.argv.slice(2)
const force = args.includes('--force')
const peek = args.includes('--peek')
const only = new Set(args.filter((a) => !a.startsWith('--')))

const manifestDir = join(ROOT, 'research', 'manifests')
// a manifest another batch is still writing may not parse; it is skipped, not fatal
const entries: Entry[] = readdirSync(manifestDir)
  .filter((f) => f.endsWith('.yaml'))
  .flatMap((f) => {
    try {
      return (parse(readFileSync(join(manifestDir, f), 'utf8')) as { web?: Entry[] } | null)?.web ?? []
    } catch (err) {
      console.error(`skipping ${f}: ${(err as Error).message.split('\n')[0]}`)
      return []
    }
  })

for (const dir of ['sources/raw', 'sources/text', '.probe']) mkdirSync(join(ROOT, dir), { recursive: true })
const report: string[] = []
const say = (s: string) => (console.log(s), report.push(s))

let fetched = 0
for (const e of entries) {
  if (only.size && !only.has(e.id)) continue
  const textPath = join(ROOT, 'sources', 'text', `${e.id}.txt`)
  if (existsSync(textPath) && !force && !peek) continue
  let html: string
  try {
    html = await get(e.url)
  } catch (err) {
    say(`FAIL  ${e.id}  ${(err as Error).message}`)
    continue
  }
  const all = htmlToText(html)
  const i = e.start ? all.indexOf(e.start) : 0
  const j = e.end ? all.indexOf(e.end, Math.max(0, i)) : -1
  if (i < 0 || (e.end && j < 0)) {
    say(`MARKERS NOT FOUND  ${e.id}  start=${i} end=${j}`)
    writeFileSync(join(ROOT, '.probe', `peek-${e.id}.txt`), all)
    continue
  }
  let paras = all
    .slice(i, e.end ? j + e.end.length : undefined)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (e.unwrap)
    paras = paras.reduce<string[]>((out, p) => {
      if (out.length && !/[。！？：”）)!?.]$/.test(out[out.length - 1])) out[out.length - 1] += p
      else out.push(p)
      return out
    }, [])
  const fullChars = paras.join('').length
  if (peek) {
    writeFileSync(join(ROOT, '.probe', `peek-${e.id}.txt`), paras.join('\n\n') + '\n')
    say(`PEEK  ${e.id.padEnd(36)} ${fullChars} chars`)
    continue
  }
  if (e.excerpt) {
    const keep = e.keep ?? []
    paras = paras.filter((p) => keep.some((k) => p.includes(k)))
    const missing = keep.filter((k) => !paras.some((p) => p.includes(k)))
    if (missing.length) say(`KEEP NOT FOUND  ${e.id}  ${missing.map((k) => JSON.stringify(k)).join(' ')}`)
    if (!paras.length) {
      writeFileSync(join(ROOT, '.probe', `peek-${e.id}.txt`), all)
      continue
    }
  }
  writeFileSync(join(ROOT, 'sources', 'raw', `${e.id}.html`), html)
  const text = paras.join('\n\n')
  writeFileSync(textPath, text + '\n')
  appendFileSync(
    join(ROOT, 'research', 'fetch-log.jsonl'),
    JSON.stringify({
      id: e.id,
      status: 'ok',
      at: new Date().toISOString(),
      url: e.url,
      sha256: createHash('sha256').update(html).digest('hex'),
      chars: text.length,
      ...(e.excerpt ? { excerpt: true, fullChars } : {}),
    }) + '\n',
  )
  say(`OK  ${e.id.padEnd(36)} ${text.length}${e.excerpt ? `/${fullChars}` : ''} chars`)
  fetched++
  await new Promise((r) => setTimeout(r, 800))
}
say(`\n${fetched} fetched`)
// --report=B04 names the report, so batches fetching in parallel do not overwrite each other's
const reportName = args.find((a) => a.startsWith('--report='))?.slice(9)
writeFileSync(join(ROOT, '.probe', `fetch-report${reportName ? `-${reportName}` : ''}.txt`), report.join('\n') + '\n')

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' }, signal: AbortSignal.timeout(45_000) })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  // older Chinese sites are GBK, and Wayback keeps the original bytes under a utf-8 header,
  // so the page's own <meta charset> wins over the HTTP header
  const buf = new Uint8Array(await res.arrayBuffer())
  const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
  const meta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
  const charset = (meta ?? res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
  return new TextDecoder(charset === 'gb2312' ? 'gbk' : charset).decode(buf)
}

function decode(s: string): string {
  const named: Record<string, string> = {
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', hellip: '…', middot: '·', copy: '©', quot: '"', amp: '&', lt: '<', gt: '>', nbsp: ' ', apos: "'",
  }
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
