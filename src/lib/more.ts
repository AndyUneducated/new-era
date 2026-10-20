import { useSyncExternalStore } from 'react'
import type { DB, PersonR, SourceR } from '../data/db'
import type { Case, Concept } from '../data/schema'

// db.json leaves out the long texts only one page shows (tools/build/emit.ts); more.json brings them after
// the first paint. Views that show them subscribe with useMore.
interface More {
  people: Record<string, Pick<PersonR, 'bio' | 'life' | 'assess'>>
  concepts: Record<string, Concept['sections']>
  cases: Record<string, Case['sections']>
  sources: Record<string, Pick<SourceR, 'title' | 'url' | 'author'>>
}

let ready = false
const subs = new Set<() => void>()

// fill the gaps so views can read the fields before more.json arrives
export function stubMore(db: DB) {
  for (const p of db.people) {
    p.bio ??= ''
    p.life ??= []
    p.assess ??= []
  }
  for (const c of db.concepts) c.sections ??= []
  for (const k of db.cases ?? []) k.sections ??= []
  for (const s of db.sources) s.title ??= ''
}

export function loadMore(db: DB) {
  fetch('data/more.json')
    .then((r) => (r.ok ? (r.json() as Promise<More>) : Promise.reject(new Error(String(r.status)))))
    .then((m) => {
      for (const p of db.people) Object.assign(p, m.people[p.id])
      for (const c of db.concepts) c.sections = m.concepts[c.id] ?? []
      for (const k of db.cases ?? []) k.sections = m.cases[k.id] ?? []
      for (const s of db.sources) Object.assign(s, m.sources[s.id])
      ready = true
      subs.forEach((f) => f())
    })
    .catch(() => setTimeout(() => loadMore(db), 5000))
}

export const useMore = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => ready,
  )
