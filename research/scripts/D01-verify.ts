// D01 one-off: cross-check a stored text against another printing of the same document (whitespace ignored), and
// print a paragraph diff between two stored versions. Writes .probe/D01-verify.txt.
//   node research/scripts/D01-verify.ts xcheck <id> <url> [url ...]   pages are concatenated in order
//   node research/scripts/D01-verify.ts diff <id-a> <id-b>
import { appendFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const outPath = join(ROOT, '.probe', 'D01-verify.txt')
const say = (s: string) => appendFileSync(outPath, s + '\n')
const read = (id: string) => readFileSync(join(ROOT, 'sources', 'text', `${id}.txt`), 'utf8')
const squash = (s: string) => s.replace(/[\s\u3000\u00a0]+/g, '').replace(/&nbsp;/g, '')

async function page(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45_000) })
  const buf = new Uint8Array(await res.arrayBuffer())
  const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
  const cs = (head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
  const html = new TextDecoder(cs === 'gb2312' ? 'gbk' : cs).decode(buf)
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&middot;/g, '·')
    .replace(/&hellip;/g, '…')
}

const [mode, ...rest] = process.argv.slice(2)
if (mode === 'xcheck') {
  const [id, ...urls] = rest
  let ref = ''
  for (const u of urls) ref += squash(await page(u))
  const ours = read(id).split('\n\n').map(squash)
  let at = 0
  let bad = 0
  for (const [i, p] of ours.entries()) {
    const j = ref.indexOf(p, at)
    if (j < 0) {
      bad++
      // longest prefix of the paragraph found in the reference after the cursor
      let k = p.length
      while (k > 0 && ref.indexOf(p.slice(0, k), at) < 0) k = Math.floor(k * 0.9)
      const near = ref.indexOf(p.slice(0, k), at)
      say(`  MISMATCH para ${i + 1}: ours …${p.slice(k, k + 40)}…\n    ref  …${near >= 0 ? ref.slice(near + k, near + k + 40) : '(not found)'}…`)
    } else at = j + p.length
  }
  say(`xcheck ${id} against ${urls.length} page(s): ${ours.length} paragraphs, ${bad} not found in order`)
} else if (mode === 'diff') {
  const [a, b] = rest
  const A = read(a).replace(/\n$/, '').split('\n\n')
  const B = read(b).replace(/\n$/, '').split('\n\n')
  // LCS on paragraphs
  const n = A.length
  const m = B.length
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  say(`diff ${a} -> ${b}: ${n} / ${m} paragraphs, ${L[0][0]} identical`)
  let i = 0
  let j = 0
  let last = ''
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === B[j]) {
      if (/^第[一二三四五六七八九十百零]+条/.test(A[i])) last = A[i].slice(0, 8)
      i++, j++
    } else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) say(`  + [after ${last}] ${B[j++].slice(0, 70)}`)
    else say(`  - [after ${last}] ${A[i++].slice(0, 70)}`)
  }
}
