// 上位之路: the age at each rung, against everyone else whose rungs are recorded.
import type { PersonR } from '../data/db'
import { RUNGS, type Rung } from '../data/schema'
import { months } from './purge'

export const ageAt = (born: string | undefined, date: string) => (born ? Math.floor(months(born, date) / 12) : undefined)

export interface RungAge { p: PersonR; age: number; date: string; post: string }

export function rungAges(people: PersonR[]): Record<Rung, RungAge[]> {
  const out = Object.fromEntries(Object.keys(RUNGS).map((k) => [k, [] as RungAge[]])) as Record<Rung, RungAge[]>
  for (const p of people)
    for (const r of p.turn?.rungs ?? []) {
      const age = ageAt(p.born, r.date)
      if (age !== undefined) out[r.rung].push({ p, age, date: r.date, post: r.post })
    }
  for (const k of Object.keys(out) as Rung[]) out[k].sort((x, y) => x.age - y.age)
  return out
}

export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : undefined
}
