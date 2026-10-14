// Hash routes: #/people/xi-jinping?e=event-id. The query carries overlays (the event drawer) so any
// page can open one and the back button closes it.
import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

export interface Route { parts: string[]; q: URLSearchParams }

const read = (): string => location.hash.replace(/^#\/?/, '')
const pathOf = (h: string) => h.split('?')[0]

// A change of page (not of the drawer query) runs as a view transition. The portrait and name inside the
// link that was clicked take the names the person page gives its own, so the photo flies into place.
let shown = pathOf(read())
let clicked: { el: Element; at: number } | undefined
addEventListener('click', (e) => {
  const el = e.target instanceof Element ? e.target.closest('a[href^="#/"]') : null
  if (el) clicked = { el, at: Date.now() }
}, true)
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())
addEventListener('hashchange', () => {
  const next = pathOf(read())
  const prev = shown
  shown = next
  if (next === prev || !document.startViewTransition || still()) return notify()
  const named: HTMLElement[] = []
  // from one person page to another the old page already holds the names
  const person = /^people\/[^/]+$/
  if (clicked && Date.now() - clicked.at < 800 && person.test(next) && !person.test(prev))
    for (const [sel, name] of [['.portrait', 'hero-face'], ['b, .name', 'hero-name']] as const) {
      const x = clicked.el.querySelector<HTMLElement>(sel)
      if (x) {
        x.style.viewTransitionName = name
        named.push(x)
      }
    }
  clicked = undefined
  const t = document.startViewTransition(() => {
    flushSync(notify)
    scrollTo(0, 0)
  })
  t.finished.finally(() => named.forEach((x) => (x.style.viewTransitionName = '')))
})
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
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

// an ism opens in a drawer over the current page
export function ismHref(id: string): string {
  return withQuery('m', id)
}

export function go(to: string) {
  location.hash = to.replace(/^#/, '')
}

export const personHref = (id: string) => href(`people/${id}`)
export const factionHref = (id: string) => href(`factions/${id}`)
export const conceptHref = (id: string) => href(`ideas/${id}`)
export const eventHref = (id: string) => withQuery('e', id)
