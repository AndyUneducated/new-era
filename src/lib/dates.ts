// Partial dates (YYYY, YYYY-MM, YYYY-MM-DD) as text and as fractional years.

export function fy(d: string | undefined): number | undefined {
  if (!d) return undefined
  const [y, m = '07', day = '01'] = d.split('-')
  const mm = d.length === 4 ? 6.5 : Number(m) - 1 + (d.length === 7 ? 0.5 : (Number(day) - 1) / 31)
  return Number(y) + mm / 12
}

export function fmt(d: string | undefined): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  if (day) return `${y}年${Number(m)}月${Number(day)}日`
  if (m) return `${y}年${Number(m)}月`
  return `${y}年`
}

export function short(d: string | undefined): string {
  if (!d) return ''
  return d.replace(/-/g, '.')
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// whole years between two partial dates; undefined when either is missing
export function age(born: string | undefined, at: string | undefined = today()): number | undefined {
  if (!born || !at) return undefined
  const [by, bm = 7, bd = 1] = born.split('-').map(Number)
  const [ay, am = 7, ad = 1] = at.split('-').map(Number)
  return ay - by - (am < bm || (am === bm && ad < bd) ? 1 : 0)
}

export function span(from?: string, to?: string): string {
  if (!from && !to) return ''
  if (from && !to) return `${short(from)} —`
  if (!from) return `— ${short(to)}`
  return `${short(from)} — ${short(to)}`
}
