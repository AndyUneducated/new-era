// Screens every K03 person for a fall or a death: takes the zhwiki article linked from the Wikidata item,
// keeps the plain text in .probe/K03-wiki/<name>.txt and lists the sentences with fall / death words.
// This is only a screen; every hit is then checked against CCDI / Xinhua reports, which are what the cards cite.
//   node research/scripts/K03-screen.ts [extra QIDs as 名字=Q123 ...]   -> .probe/K03-screen.txt
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const DIR = join(ROOT, '.probe/K03-wiki')
mkdirSync(DIR, { recursive: true })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const qid = JSON.parse(readFileSync(join(ROOT, '.probe/K03-qid.json'), 'utf8')) as Record<string, string | null>
const pairs: [string, string][] = Object.entries(qid).filter((e): e is [string, string] => !!e[1])
for (const a of process.argv.slice(2)) {
  const [n, q] = a.split('=')
  if (q) pairs.push([n, q])
}

// oxlint-disable-next-line typescript/no-explicit-any
async function getJson(u: URL): Promise<any> {
  for (let a = 0; ; a++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) return res.json()
    if (a >= 5) throw new Error(`${res.status} ${u}`)
    await sleep(10_000 * (a + 1))
  }
}
const api = (base: string, q: Record<string, string>) => {
  const u = new URL(base)
  for (const [k, v] of Object.entries({ format: 'json', ...q })) u.searchParams.set(k, v)
  return u
}

const titles = new Map<string, string>()
const ids = [...new Set(pairs.map((p) => p[1]))]
for (let i = 0; i < ids.length; i += 50) {
  const r = await getJson(api('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'sitelinks', sitefilter: 'zhwiki' }))
  for (const [id, e] of Object.entries(r.entities as Record<string, { sitelinks?: { zhwiki?: { title: string } } }>)) if (e.sitelinks?.zhwiki) titles.set(id, e.sitelinks.zhwiki.title)
  await sleep(1000)
}

const WORDS = /开除党籍|開除黨籍|严重违纪|嚴重違紀|违纪违法|違紀違法|审查调查|審查調查|立案审查|立案審查|立案检查|立案檢查|组织调查|組織調查|徒刑|死刑|死缓|死緩|受贿|受賄|双规|雙規|落马|落馬|留党察看|留黨察看|撤销党内|撤銷黨內|逝世|病逝|去世|辞世|辭世|因病/
const out: string[] = []
for (const [name, q] of pairs) {
  const title = titles.get(q)
  const file = join(DIR, `${name}-${q}.txt`)
  let text = ''
  if (title) {
    if (existsSync(file)) text = readFileSync(file, 'utf8')
    else {
      const r = await getJson(api('https://zh.wikipedia.org/w/api.php', { action: 'query', prop: 'extracts', explaintext: '1', titles: title, variant: 'zh-cn', redirects: '1' }))
      text = (Object.values(r.query.pages as Record<string, { extract?: string }>)[0]?.extract ?? '').trim()
      writeFileSync(file, text + '\n')
      await sleep(400)
    }
  }
  const hits = text
    .split(/(?<=[。！？\n])/)
    .map((s) => s.trim())
    .filter((s) => WORDS.test(s))
  out.push(`${hits.length ? '!!' : '  '} ${name} ${q} ${title ?? '(no zhwiki)'} ${text.length}`)
  for (const h of hits) out.push(`      ${h.slice(0, 220)}`)
}
writeFileSync(join(ROOT, '.probe/K03-screen.txt'), out.join('\n') + '\n')
console.log(`${pairs.length} screened, ${titles.size} with zhwiki -> .probe/K03-screen.txt`)
