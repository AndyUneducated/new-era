// R07 finding aid: compact notice references per person from the cached zh.wikipedia wikitext (.probe/R07-wp/),
// only refs whose title looks like a probe / expulsion / charge / trial / verdict notice, archive URL preferred.
//   node research/scripts/R07-refs.ts name[=page title] ...   -> .probe/R07-refs.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

const file = (t: string) => `.probe/R07-wp/${t.replace(/[\\/:*?"<>|]/g, '_')}.txt`
const lists = readdirSync('.probe/R07-wp')
  .filter((f) => f.includes('落马官员列表'))
  .map((f) => readFileSync(`.probe/R07-wp/${f}`, 'utf8'))
const kind = (t: string) =>
  /审查调查|接受.*调查|监察调查|严重违纪违法|涉嫌/.test(t) && !/开除|公诉|审判|宣判|判处|受审|获刑/.test(t)
    ? 'probe'
    : /开除党籍|开除公职|双开|撤销/.test(t)
      ? 'expel'
      : /公诉|逮捕/.test(t)
        ? 'charge'
        : /受审|开庭|庭审/.test(t)
          ? 'trial'
          : /宣判|判处|获刑|一审|无期|死缓|有期徒刑/.test(t)
            ? 'verdict'
            : ''
const refs = (s: string) =>
  [...s.matchAll(/\{\{\s*cite (?:web|news)\s*\|([\s\S]*?)\}\}/gi)].map((m) => {
    const p: Record<string, string> = {}
    for (const kv of m[1].split('|')) {
      const k = kv.indexOf('=')
      if (k > 0) p[kv.slice(0, k).trim().toLowerCase()] = kv.slice(k + 1).trim()
    }
    return { date: p.date ?? '', title: p.title ?? '', work: p.work ?? p.publisher ?? '', url: p.url ?? '', arch: p['archive-url'] || p.archiveurl || '' }
  })

const out: string[] = []
for (const arg of process.argv.slice(2)) {
  const [name, page = name] = arg.split('=')
  out.push(`######## ${name}${page !== name ? ' = ' + page : ''}`)
  const txt = existsSync(file(page)) ? readFileSync(file(page), 'utf8') : 'NOFILE'
  if (/^(MISSING|FAIL|NOFILE)/.test(txt)) out.push(`  PAGE ${txt.slice(0, 40)}`)
  else {
    const inf = txt.match(/\{\{\s*Infobox[\s\S]*?\n\}\}/i)?.[0] ?? ''
    const b = inf.match(/\|\s*(birth_date|出生日期|出生)\s*=\s*([^\n]*)/)?.[2] ?? ''
    const bp = inf.match(/\|\s*(birth_place|出生地|籍贯)\s*=\s*([^\n]*)/)?.[2] ?? ''
    out.push(`  BIRTH ${b.slice(0, 80)} @ ${bp.replace(/\[\[|\]\]/g, '').slice(0, 60)}`)
    const lead = txt
      .slice(inf ? txt.indexOf(inf) + inf.length : 0)
      .replace(/<ref[^>]*\/>/g, '')
      .replace(/<ref[\s\S]*?<\/ref>/g, '')
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
      .replace(/\{\{[^{}]*\}\}/g, '')
      .replace(/'''?/g, '')
      .trim()
    out.push(`  LEAD ${lead.replace(/\s+/g, ' ').slice(0, 700)}`)
  }
  const rows = lists.flatMap((l) => l.split(/\n\|-/).filter((r) => r.includes(name)))
  const seen = new Set<string>()
  for (const r of [...refs(txt), ...rows.flatMap(refs)]) {
    const k = kind(r.title)
    if (!k || !r.title.includes(name.replace(/\(.*$/, '').trim()) || seen.has(r.url)) continue
    seen.add(r.url)
    out.push(`  ${k.padEnd(7)} ${r.date} ${r.title} [${r.work}]\n          ${r.url}${r.arch ? '\n          ARCH ' + r.arch : ''}`)
  }
}
writeFileSync('.probe/R07-refs.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)
