// Hash routes: #/people/xi-jinping?e=event-id. The query carries overlays (the event drawer) so any
// page can open one and the back button closes it.
import { useSyncExternalStore } from 'react'

export interface Route { parts: string[]; q: URLSearchParams }

const read = (): string => location.hash.replace(/^#\/?/, '')
const subscribe = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  const h = useSyncExternalStore(subscribe, read)
  const [p, q = ''] = h.split('?')
  return { parts: p.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(q) }
}

export function href(path: string, q?: Record<string, string | undefined>): string {
  const s = q ? new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => !!e[1])).toString() : ''
  return `#/${path}${s ? `?${s}` : ''}`
}

// the current path with one query key changed
export function withQuery(key: string, value: string | undefined): string {
  const [p, q = ''] = read().split('?')
  const s = new URLSearchParams(q)
  if (value) s.set(key, value)
  else s.delete(key)
  const t = s.toString()
  return `#/${p}${t ? `?${t}` : ''}`
}

export function go(to: string) {
  location.hash = to.replace(/^#/, '')
}

export const personHref = (id: string) => href(`people/${id}`)
export const factionHref = (id: string) => href(`factions/${id}`)
export const conceptHref = (id: string) => href(`ideas/${id}`)
export const eventHref = (id: string) => withQuery('e', id)
