import type { PersonR } from '../data/db'

// the seal text for a status that ends a career
export const SEAL_TEXT: Partial<Record<PersonR['status'], string>> = { purged: '落马', detained: '在押', missing: '失踪' }

// the first official step against a person: the earliest dated entry of the fall
export const fellOn = (p: PersonR): string | undefined => p.fall.map((f) => f.date).sort()[0]
