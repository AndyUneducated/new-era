// K04: pull the cited URLs (official domains only) out of the wikitext of the fallen and the dead, to find the
// CCDI / Xinhua / court notices to register. A finding aid only. Writes .probe/K04-refs.txt.
//   node research/scripts/K04-refs.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const WP = 'https://zh.wikipedia.org/w/api.php'
const KEYS = (
  '于幼军 康日新 王喜斌 杨刚 余远辉 孙怀山 李云峰 杨崇勇 李士祥 陈刚 胡怀邦 曹广晶 沈德咏 盛光祖 肖亚庆 李佳 韩勇 ' +
  '蒋超良 蓝天立 刘慧 乌兰 叶红专 金东寒 蔡赴朝 牛志忠 张喜武 李立国 王敏 吕锡文 潘逸阳 ' +
  '孙大发 陈志荣 任学锋 王玉普 李金城 陈政高 李冰 陈武 杨晖 赵宪庚 吴曼青 李世明 于革胜'
).split(' ')
const OK = /ccdi\.gov\.cn|xinhuanet\.com|news\.cn|people\.com\.cn|gov\.cn|court|npc\.gov\.cn|chinanews|cctv|cpc|81\.cn|spp\.gov\.cn|chinapeace/
const picks = JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-picks.json'), 'utf8')) as Record<string, { name: string; title: string }>
const out: string[] = []
for (const key of KEYS) {
  const p = Object.values(picks).find((x) => x.name === key || (x as { key?: string }).key === key) ?? picks[key]
  if (!p) { out.push(`## ${key}: no pick`); continue }
  const u = new URL(WP)
  for (const [k, v] of Object.entries({ format: 'json', action: 'parse', prop: 'wikitext', redirects: '1', page: p.title })) u.searchParams.set(k, v)
  let text = ''
  for (let a = 0; a < 4 && !text; a++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) text = (await res.json()).parse?.wikitext?.['*'] ?? ''
    else await new Promise((r) => setTimeout(r, 4000 * (a + 1)))
  }
  out.push(`## ${key} (${p.title})`)
  for (const m of text.matchAll(/<ref[^>]*>([\s\S]*?)<\/ref>/g)) {
    const ref = m[1]
    const url = /url\s*=\s*([^|}\s]+)/.exec(ref)?.[1] ?? /\[(https?:\/\/[^\s\]]+)/.exec(ref)?.[1]
    if (!url || !OK.test(url)) continue
    const title = /title\s*=\s*([^|}]+)/.exec(ref)?.[1]?.trim() ?? /\[https?:\/\/\S+\s+([^\]]+)\]/.exec(ref)?.[1] ?? ''
    const date = /\|\s*date\s*=\s*([^|}]+)/.exec(ref)?.[1]?.trim() ?? ''
    const arch = /archive-?url\s*=\s*([^|}\s]+)/.exec(ref)?.[1] ?? ''
    out.push(`${date}\t${title}\t${url}${arch ? `\tARCH ${arch}` : ''}`)
  }
  await new Promise((r) => setTimeout(r, 600))
}
writeFileSync(join(ROOT, '.probe', 'K04-refs.txt'), out.join('\n') + '\n')
console.log(out.filter((l) => l.startsWith('##')).length, 'pages')
