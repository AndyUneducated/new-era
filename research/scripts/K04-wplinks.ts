// K04: the zh.wikipedia pages of the 17th and 18th Central Committees link each member to a disambiguated
// article; the article's Wikidata item settles namesakes. A finding aid only. Writes .probe/K04-wplinks.json.
//   node research/scripts/K04-wplinks.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const WP = 'https://zh.wikipedia.org/w/api.php'
// oxlint-disable-next-line typescript/no-explicit-any
async function api(params: Record<string, string>): Promise<any> {
  const u = new URL(WP)
  for (const [k, v] of Object.entries({ format: 'json', ...params })) u.searchParams.set(k, v)
  for (let a = 0; ; a++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    if (a >= 4) throw new Error(`${res.status}`)
    await new Promise((r) => setTimeout(r, 5000 * (a + 1)))
  }
}
const names = new Set(readFileSync(join(ROOT, '.probe', 'K04-names.txt'), 'utf8').trim().split(/\s+/))
const links = new Map<string, Set<string>>()
// the member lists sit in navigation templates, so take the rendered page's links, not its wikitext
const dump: string[] = []
for (const page of ['中国共产党第十七届中央委员会委员列表', '中国共产党第十八届中央委员会委员列表', '中国共产党第十七届中央委员会候补委员列表', '中国共产党第十八届中央委员会候补委员列表']) {
  let cont: Record<string, string> = {}
  for (;;) {
    const r = await api({ action: 'query', prop: 'links', pllimit: 'max', plnamespace: '0', redirects: '1', titles: page, ...cont })
    for (const p of Object.values(r.query.pages) as { title: string; links?: { title: string }[] }[]) {
      dump.push(`# ${page} -> ${p.title}: ${p.links?.length ?? 0}`)
      for (const { title } of p.links ?? []) {
        const name = title.replace(/\s*[（(].*$/, '')
        if (names.has(name)) links.set(name, (links.get(name) ?? new Set()).add(title))
      }
    }
    if (!r.continue) break
    cont = r.continue
  }
}
writeFileSync(join(ROOT, '.probe', 'K04-wplinks-pages.txt'), dump.join('\n') + '\n')
const titles = [...new Set([...links.values()].flatMap((s) => [...s]))]
const qid = new Map<string, string>()
for (let i = 0; i < titles.length; i += 50) {
  const r = await api({ action: 'query', prop: 'pageprops', ppprop: 'wikibase_item', redirects: '1', titles: titles.slice(i, i + 50).join('|') })
  const redirect = new Map<string, string>((r.query.redirects ?? []).map((x: { from: string; to: string }) => [x.to, x.from]))
  const norm = new Map<string, string>((r.query.normalized ?? []).map((x: { from: string; to: string }) => [x.to, x.from]))
  for (const p of Object.values(r.query.pages) as { title: string; pageprops?: { wikibase_item?: string } }[]) {
    const from = redirect.get(p.title) ?? p.title
    qid.set(norm.get(from) ?? from, p.pageprops?.wikibase_item ?? '-')
  }
}
const out: Record<string, { title: string; qid: string }[]> = {}
for (const n of names) out[n] = [...(links.get(n) ?? [])].map((t) => ({ title: t, qid: qid.get(t) ?? '?' }))
writeFileSync(join(ROOT, '.probe', 'K04-wplinks.json'), JSON.stringify(out, null, 1))
const odd = Object.entries(out).filter(([k, v]) => v.length !== 1 || v[0].title !== k)
writeFileSync(join(ROOT, '.probe', 'K04-wplinks.txt'), odd.map(([k, v]) => `${k}\t${v.map((x) => `${x.title}=${x.qid}`).join(' | ')}`).join('\n') + '\n\n' + dump.join('\n') + '\n')
console.log(`${[...names].filter((n) => links.has(n)).length}/${names.size} names linked`)
