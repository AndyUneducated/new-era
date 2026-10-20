// BD1: search zh.wikipedia for each listed person, report birth line and how well the page matches the card's headline
//   node research/scripts/BD1-zhwiki.ts -> .probe/bd1-zhwiki.txt, .probe/bd1-zhwiki.json
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const probe = JSON.parse(readFileSync('.probe/bd1-probe.json', 'utf8')) as any[]
const lines = (f: string) => readFileSync(`research/lists/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'))
const head = new Map([...lines('R15-no-born.txt'), ...lines('R15-no-positions.txt')].map((r) => [r[0], r[3]]))
const urls = readdirSync('research/manifests').map((f) => readFileSync(`research/manifests/${f}`, 'utf8')).join('\n')

const API = 'https://zh.wikipedia.org/w/api.php'
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
async function api(p: Record<string, string>) {
  const u = new URL(API)
  for (const [k, v] of Object.entries({ format: 'json', variant: 'zh-cn', ...p })) u.searchParams.set(k, v)
  for (let a = 0; ; a++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })
      if (r.ok) return r.json()
    } catch {}
    if (a > 3) return {}
    await new Promise((s) => setTimeout(s, 1500 * (a + 1)))
  }
}
const bigrams = (s: string) => {
  const t = s.replace(/[，、（）()“”\s\d年月原]/g, '')
  const out = new Set<string>()
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2))
  return out
}
const todo = [...new Map(probe.filter((p) => (p.tag === 'NOBORN' && !p.born) || p.tag === 'NOPOS').map((p) => [p.id, p])).values()]
const out: string[] = []
const json: any[] = []
for (const p of todo) {
  const h = head.get(p.id) ?? ''
  const only = process.argv.slice(2)
  if (only.length && !only.includes(p.id)) continue
  const r = await api({ action: 'query', list: 'search', srsearch: p.name, srlimit: '6' })
  const titles = ((r.query?.search ?? []) as { title: string }[]).map((x) => x.title).filter((t) => t.length <= p.name.length + 12 && !/列表|事件|案$/.test(t))
  if (!titles.length) {
    out.push(`${p.id}\t${p.name}\t-`)
    continue
  }  const ex = await api({ action: 'query', prop: 'extracts', explaintext: '1', exintro: '1', redirects: '1', titles: titles.join('|') })
  const pages = Object.values(ex.query?.pages ?? {}) as { title: string; extract?: string }[]
  const bg = bigrams(h)
  const scored = pages
    .filter((pg) => (pg.extract ?? '').includes(p.name))
    .map((pg) => {
      const e = (pg.extract ?? '').replace(/\s+/g, ' ')
      let score = 0
      for (const b of bg) if (e.includes(b)) score++
      const m = e.match(/(\d{4})年(\d{1,2})月(\d{1,2}日)?/)
      const bp = e.match(/，([^，。]{2,12}?)人[，。]/)
      return { title: pg.title, score, birth: m?.[0], bp: bp?.[1], lead: e.slice(0, 160), dup: urls.includes(pg.title) }
    })
    .sort((a, b) => b.score - a.score)
  const best = scored[0]
  out.push(`${p.id}\t${p.name}\t${p.tag}\t[${h}]`)
  for (const s of scored.slice(0, 3)) out.push(`   ${s.score}\t${s.title}${s.dup ? ' (REGISTERED)' : ''}\tbirth=${s.birth ?? '-'}\tbp=${s.bp ?? '-'}\t${s.lead}`)
  json.push({ id: p.id, name: p.name, best, all: scored })
}
writeFileSync('.probe/bd1-zhwiki2.txt', out.join('\n') + '\n', 'utf8')
console.log(todo.length)
