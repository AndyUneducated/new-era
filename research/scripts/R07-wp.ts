// R07 finding aid: zh.wikipedia wikitext for each remaining name (person page and the fall-list rows), digested to
// birth, lead and the reference URLs, so the CCDI / Xinhua / court notices can be found and registered.
//   node research/scripts/R07-wp.ts [name ...]   -> .probe/R07-wp/<name>.txt, .probe/R07-wp-digest.txt
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const LISTS = ['中共十九大至二十大期间落马官员列表', '中共二十大以来落马官员列表']
mkdirSync('.probe/R07-wp', { recursive: true })

async function wikitext(title: string): Promise<string> {
  const file = `.probe/R07-wp/${title.replace(/[\\/:*?"<>|]/g, '_')}.txt`
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const u = `https://zh.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&variant=zh-cn&page=${encodeURIComponent(title)}`
  let t = ''
  try {
    const j = await (await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) })).json()
    t = j.parse?.wikitext?.['*'] ?? `MISSING ${JSON.stringify(j.error?.code ?? '')}`
  } catch (e) {
    t = `FAIL ${(e as Error).message}`
  }
  writeFileSync(file, t)
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

type Row = { name: string; date: string; post: string; done: boolean }
let names = process.argv.slice(2)
if (!names.length)
  for (const l of ['R05', 'R06', 'R03'])
    names.push(...((parse(readFileSync(`research/falls-list/${l}.yaml`, 'utf8')) as Row[]).filter((r) => !r.done).map((r) => r.name)))
names = [...new Set(names)]

const lists = await Promise.all(LISTS.map(wikitext))
const out: string[] = []
for (const name of names) {
  out.push(`######## ${name}`)
  for (const [i, l] of lists.entries())
    for (const row of l.split(/\n\|-/))
      if (clean(row).includes(name)) {
        out.push(`  [list ${i}] ${clean(row).replace(/\s*\n\s*/g, ' ¦ ').slice(0, 400)}`)
        out.push(...refs(row))
      }
  const t = await wikitext(name)
  if (t.startsWith('MISSING') || t.startsWith('FAIL')) {
    out.push(`  PAGE ${t.slice(0, 60)}`)
    continue
  }
  if (/\{\{\s*(disambig|消歧义|dab|hndis)/i.test(t)) {
    out.push(`  DISAMBIG: ${clean(t).replace(/\s+/g, ' ').slice(0, 600)}`)
    continue
  }
  const birth = t.match(/\|\s*(birth_date|出生日期)\s*=\s*([^\n]*)/)?.[2] ?? ''
  const place = t.match(/\|\s*(birth_place|出生地)\s*=\s*([^\n]*)/)?.[2] ?? ''
  const body = t.replace(/^[\s\S]*?\n\}\}\s*\n/, '')
  out.push(`  BIRTH ${clean(birth)} @ ${clean(place)}`)
  out.push(`  BODY ${clean(body).replace(/\n+/g, ' ').slice(0, 1500)}`)
  out.push(...refs(t))
}
writeFileSync(process.argv.length > 2 ? '.probe/R07-wp-digest2.txt' : '.probe/R07-wp-digest.txt', out.join('\n') + '\n', 'utf8')
for (const [i, l] of lists.entries()) console.log(LISTS[i], l.length)
console.log(names.length, out.length)
