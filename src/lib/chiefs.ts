// Provincial party secretaries and governors (the 诸侯图). The chiefs list (content/chiefs) is the record;
// a province and post it does not cover yet falls back to the positions written on people's entries.
import type { Atlas, PersonR } from '../data/db'
import { PROVINCES, type Chief, type Province } from '../data/schema'
import { fy } from './dates'
import { NOW } from './faction'

export type Post = Chief['post']
export interface Tenure { prov: Province; post: Post; name: string; p?: PersonR; from: number; to: number; acting?: boolean; note?: string; cite?: string; derived?: boolean }

const SEC = /(省委|区党委|自治区党委|市委)书记$/
const GOV = /(省长|自治区(人民政府)?主席|市长)$/
export const FIRST = 2000
export const POST_LABEL = { sec: '书记', gov: '行政首长' } as const
export const yearSpan = (t: Tenure) => `${Math.floor(t.from)}–${t.to >= NOW ? '' : Math.floor(t.to)}`

function derived(a: Atlas): Tenure[] {
  const out: Tenure[] = []
  for (const p of a.db.people)
    for (const x of p.positions) {
      const t = x.title
      const post: Post | null = SEC.test(t) && !/副书记/.test(t) ? 'sec' : GOV.test(t) && !/副(省长|主席|市长)|常务/.test(t) ? 'gov' : null
      if (!post || !x.from) continue
      const prov = PROVINCES.find((n) => t.startsWith(n) || x.place?.startsWith(n))
      if (!prov) continue
      // 市委书记 / 市长 count only for the four municipalities
      if (!['北京', '天津', '上海', '重庆'].includes(prov) && /市(委书记|长)$/.test(t)) continue
      const to = fy(x.to) ?? NOW
      if (to < FIRST) continue
      out.push({ prov, post, name: p.name, p, from: fy(x.from)!, to, cite: x.cite, derived: true })
    }
  // an entry with no end date ends where the next holder of the same post begins
  out.sort((x, y) => x.from - y.from)
  for (const [i, t] of out.entries()) {
    const next = out.slice(i + 1).find((n) => n.prov === t.prov && n.post === t.post && n.from > t.from)
    if (next && t.to > next.from) t.to = next.from
  }
  return out
}

const memo = new WeakMap<Atlas, Tenure[]>()
export function tenures(a: Atlas): Tenure[] {
  const hit = memo.get(a)
  if (hit) return hit
  const listed: Tenure[] = a.db.chiefs.map((c) => ({
    prov: c.prov,
    post: c.post,
    name: c.name,
    p: c.person ? a.person.get(c.person) : undefined,
    from: fy(c.from)!,
    to: fy(c.to) ?? NOW,
    acting: c.acting,
    note: c.note,
    cite: c.cite,
  }))
  const covered = new Set(listed.map((t) => `${t.prov} ${t.post}`))
  const all = [...listed, ...derived(a).filter((t) => !covered.has(`${t.prov} ${t.post}`))].sort((x, y) => x.from - y.from)
  memo.set(a, all)
  return all
}

// the holder of a post in the middle of year y (the later one when two overlap)
export function holderAt(list: Tenure[], prov: Province, post: Post, y: number): Tenure | undefined {
  let best: Tenure | undefined
  for (const t of list) if (t.prov === prov && t.post === post && t.from <= y && t.to > y) best = t
  return best
}

// a tenure that ended in a fall: the holder's first official step against him came while in office or after
export function fellAfter(t: Tenure): string | undefined {
  const d = t.p?.fall.map((f) => f.date).sort()[0]
  return d && (fy(d) ?? 0) >= t.from ? d : undefined
}
