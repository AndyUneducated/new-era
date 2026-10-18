import type { PersonR } from '../data/db'

// the seal text for a status that ends a career
export const SEAL_TEXT: Partial<Record<PersonR['status'], string>> = { purged: '落马', detained: '在押', missing: '失踪' }

// the first official step against a person: the earliest dated entry of the fall
export const fellOn = (p: PersonR): string | undefined => p.fall.map((f) => f.date).sort()[0]

// the frame around a portrait: red for a fall (also one who died after it), grey for a death, dashed for the missing
export type Mark = 'fell' | 'dead' | 'missing'
export const markOf = (p: PersonR): Mark | undefined =>
  p.status === 'purged' || p.status === 'detained' || (p.status === 'dead' && p.fall.length) ? 'fell' : p.status === 'dead' ? 'dead' : p.status === 'missing' ? 'missing' : undefined

export const MARK_STROKE: Record<Mark, { color: string; dash?: string }> = {
  fell: { color: 'var(--seal)' },
  dead: { color: 'var(--muted)' },
  missing: { color: 'var(--ink-2)', dash: '3 2.5' },
}
