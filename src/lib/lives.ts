import { useSyncExternalStore } from 'react'
import type { DB } from '../data/db'

type Person = DB['people'][number]
type Life = Pick<Person, 'bio' | 'life'>

let ready = false
const subs = new Set<() => void>()

// db.json ships people without bio and life; fill the gaps so views can read them before lives.json arrives
export function stubLives(db: DB) {
  for (const p of db.people) {
    p.bio ??= ''
    p.life ??= []
  }
}

export function loadLives(people: Person[]) {
  fetch('data/lives.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, Life>>) : Promise.reject(new Error(String(r.status)))))
    .then((m) => {
      for (const p of people) Object.assign(p, m[p.id])
      ready = true
      subs.forEach((f) => f())
    })
    .catch(() => setTimeout(() => loadLives(people), 5000))
}

export const useLives = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => void subs.delete(f)),
    () => ready,
  )
