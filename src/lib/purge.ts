// The 打虎 view: who fell, when, from how high, and whether from the army.
import type { CaseR, PersonR } from '../data/db'
import type { CaseSys } from '../data/schema'
import { fy } from './dates'
import { fellOn } from './fall'

export type Level = 'top' | 'cc' | 'min' | 'other'
export const LEVELS: Record<Level, { name: string; color: string }> = {
  top: { name: '政治局、军委', color: 'var(--ink)' },
  cc: { name: '中委、候补、中纪委', color: 'var(--red)' },
  min: { name: '省部级', color: 'var(--gold)' },
  other: { name: '其他', color: 'var(--muted)' },
}

export const levelOf = (p: PersonR): Level =>
  p.roles.some((r) => r === 'psc' || r === 'pb' || r === 'cmc')
    ? 'top'
    : p.roles.some((r) => r === 'cc' || r === 'acc' || r === 'ccdi')
      ? 'cc'
      : p.roles.some((r) => r === 'minister' || r === 'prov')
        ? 'min'
        : 'other'

export const isArmy = (p: PersonR) => p.roles.includes('general') || p.positions.at(-1)?.sys === 'army'

// people outside the system (dissidents, businessmen, Hong Kong politicians) have arrests, not falls
const OUTSIDE = new Set(['dissent', 'biz', 'hkmt', 'scholar', 'media', 'family'])
export const isOfficial = (p: PersonR) => p.roles.includes('tiger') || p.roles.some((r) => !OUTSIDE.has(r))

export interface Fall { p: PersonR; c: CaseR; date: string; t: number; level: Level; army: boolean }

// one entry per fallen official, at the first official step against them; the missing only when asked
export function falls(people: PersonR[], { from = 2000, missing = false } = {}): Fall[] {
  const out: Fall[] = []
  for (const p of people) {
    const date = fellOn(p)
    const t = fy(date)
    if (!date || t === undefined || t < from || !p.case || !isOfficial(p)) continue
    if (!missing && p.status === 'missing') continue
    out.push({ p, c: p.case, date, t, level: levelOf(p), army: isArmy(p) })
  }
  return out.sort((x, y) => x.t - y.t)
}

// months between two partial dates (a bare year counts as mid-year)
export const months = (a: string, b: string) => {
  const m = (s: string) => Number(s.slice(0, 4)) * 12 + (s.length > 4 ? Number(s.slice(5, 7)) - 1 : 6)
  return m(b) - m(a)
}

// the party congresses a fall can be timed against
export const CONGRESS_DATES: [string, string][] = [
  ['十六大', '2002-11'],
  ['十七大', '2007-10'],
  ['十八大', '2012-11'],
  ['十九大', '2017-10'],
  ['二十大', '2022-10'],
]

// the post held when the first step came, optionally only posts in a province
export function postAtFall(f: Fall, placed = false) {
  const open = f.p.positions.filter((x) => (!placed || x.place) && (!x.from || x.from <= f.date))
  const at = open.filter((x) => !x.to || x.to >= f.date.slice(0, 7))
  return at.at(-1) ?? open.at(-1)
}
export const placeAtFall = (f: Fall) => postAtFall(f, true)?.place

// the system a fall belongs to: from the case record, else guessed from the title of the post at the fall
const GUESS: [CaseSys, RegExp][] = [
  ['law', /公安|政法|法院|检察|司法|国家安全|监狱/],
  ['finance', /银行|证监|保监|银保监|金融|保险|信托|资产管理|证券|外汇/],
  ['soe', /集团|公司|石油|石化|电力|电网|航空工业|核工业|总经理|董事长/],
  ['edu', /大学|学院|教育|科学院|工程院/],
  ['culture', /宣传|文化|广电|新闻|出版|体育|旅游/],
  ['health', /卫生|医院|医药|药品|健康/],
]
export function sysOf(f: Fall): { sys: CaseSys; guessed: boolean } {
  if (f.c.sys) return { sys: f.c.sys, guessed: false }
  if (f.army) return { sys: 'army', guessed: true }
  const post = postAtFall(f)
  const hit = post && GUESS.find(([, re]) => re.test(post.title))
  return { sys: hit ? hit[0] : post?.place ? 'local' : 'central', guessed: true }
}
