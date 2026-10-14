// The 打虎 view: who fell, when, from how high, and whether from the army.
import type { PersonR } from '../data/db'
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

export interface Fall { p: PersonR; date: string; t: number; level: Level; army: boolean }

// one entry per fallen person, at the first official step against them
export function falls(people: PersonR[], from = 2000): Fall[] {
  const out: Fall[] = []
  for (const p of people) {
    const date = fellOn(p)
    const t = fy(date)
    if (!date || t === undefined || t < from) continue
    out.push({ p, date, t, level: levelOf(p), army: isArmy(p) })
  }
  return out.sort((x, y) => x.t - y.t)
}
