// R08 finding aid (after R07-wp.ts): zh.wikipedia wikitext for each name (person page and the fall-list rows),
// digested to birth, lead and the reference URLs. A name may be given as name=page title.
//   node research/scripts/R08-wp.ts name[=page] ...   -> .probe/R08-wp/<page>.txt, .probe/R08-wp-digest.txt
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const LISTS = ['中共十八大至十九大期间落马官员列表', '中共十九大至二十大期间落马官员列表', '中共二十大以来落马官员列表']
mkdirSync('.probe/R08-wp', { recursive: true })

async function wikitext(title: string): Promise<string> {
  const file = `.probe/R08-wp/${title.replace(/[\\/:*?"<>|]/g, '_')}.txt`
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const u = `https://zh.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&variant=zh-cn&page=${encodeURIComponent(title)}`
  let t = ''
  try {
    const j = await (await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) })).json()
    t = j.parse?.wikitext?.['*'] ?? `MISSING ${JSON.stringify(j.error?.code ?? '')}`
  } catch (e) {
    t = `FAIL ${(e as Error).message}`
  }
  if (!t.startsWith('FAIL')) writeFileSync(file, t)
  await new Promise((r) => setTimeout(r, 300))
  return t
}

const clean = (s: string) =>
  s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
const refs = (s: string) =>
  [...s.matchAll(/\{\{\s*cite (?:web|news)\s*\|([\s\S]*?)\}\}/gi)].map((m) => {
    const p: Record<string, string> = {}
    for (const kv of m[1].split('|')) {
      const k = kv.indexOf('=')
      if (k > 0) p[kv.slice(0, k).trim().toLowerCase()] = kv.slice(k + 1).trim()
    }
    return `    - ${p.date ?? ''} ${p.title ?? ''} [${p.work ?? p.publisher ?? ''}] ${p.url ?? ''}${p['archive-url'] || p.archiveurl ? ' ARCH ' + (p['archive-url'] || p.archiveurl) : ''}`
  })

const lists = await Promise.all(LISTS.map(wikitext))
const out: string[] = []
for (const arg of process.argv.slice(2)) {
  const [name, page = name] = arg.split('=')
  out.push(`######## ${name}${page !== name ? ' = ' + page : ''}`)
  for (const [i, l] of lists.entries())
    for (const row of l.split(/\n\|-/))
      if (clean(row).includes(name)) {
        out.push(`  [list ${i}] ${clean(row).replace(/\s*\n\s*/g, ' ¦ ').slice(0, 400)}`)
        out.push(...refs(row))
      }
  const t = await wikitext(page)
  if (t.startsWith('MISSING') || t.startsWith('FAIL')) {
    out.push(`  PAGE ${t.slice(0, 60)}`)
    continue
  }
  if (/\{\{\s*(disambig|消歧义|dab|hndis)/i.test(t)) {
    out.push(`  DISAMBIG: ${clean(t).replace(/\s+/g, ' ').slice(0, 800)}`)
    continue
  }
  const birth = t.match(/\|\s*(birth_date|出生日期)\s*=\s*([^\n]*)/)?.[2] ?? ''
  const place = t.match(/\|\s*(birth_place|出生地)\s*=\s*([^\n]*)/)?.[2] ?? ''
  const body = t.replace(/^[\s\S]*?\n\}\}\s*\n/, '')
  out.push(`  BIRTH ${clean(birth)} @ ${clean(place)}`)
  out.push(`  BODY ${clean(body).replace(/\n+/g, ' ').slice(0, 1800)}`)
  out.push(...refs(t))
}
writeFileSync('.probe/R08-wp-digest.txt', out.join('\n') + '\n', 'utf8')
for (const [i, l] of lists.entries()) console.log(LISTS[i], l.length)
console.log(out.length)
