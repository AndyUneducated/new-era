// Hash routes: #/people/xi-jinping?e=event-id. The query carries overlays (the event drawer) so any
// page can open one and the back button closes it.
import { useEffect, useId, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react'
import { flushSync } from 'react-dom'

export interface Route { parts: string[]; q: URLSearchParams }

const read = (): string => location.hash.replace(/^#\/?/, '')
const pathOf = (h: string) => h.split('?')[0]

// Each history entry carries a key in history.state. Going back to an entry returns to where the reader
// left it: the scroll position, and the page state kept with useKept (filters, folds) that sets its height.
history.scrollRestoration = 'manual'
const stamp = () => {
  const k = Math.random().toString(36).slice(2)
  history.replaceState({ ...(history.state ?? {}), k }, '')
  return k
}
const keyOf = () => (history.state as { k?: string } | null)?.k
let here = keyOf() ?? stamp()
const scrolls = new Map<string, number>()
const kept = new Map<string, Map<string, unknown>>()
const keptAt = (k: string) => kept.get(k) ?? kept.set(k, new Map()).get(k)!

// a drop-in for useState whose value comes back when the reader returns to this history entry
export function useKept<T>(init: T | (() => T)): [T, Dispatch<SetStateAction<T>>]
export function useKept<T = undefined>(): [T | undefined, Dispatch<SetStateAction<T | undefined>>]
export function useKept<T>(init?: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const id = useId()
  const [m] = useState(() => keptAt(here))
  const [v, set] = useState<T>(() => (m.has(id) ? (m.get(id) as T) : typeof init === 'function' ? (init as () => T)() : (init as T)))
  useEffect(() => void m.set(id, v), [m, id, v])
  return [v, set]
}

// The page may still be growing when it is first drawn (maps, fetched text), so keep scrolling as it
// grows until the target is reached, the reader takes over, or a few seconds pass.
const TAKEOVER = ['wheel', 'touchstart', 'keydown', 'pointerdown']
let following: (() => void) | undefined
function place(y: number) {
  following?.()
  scrollTo(0, y)
  if (scrollY >= y - 1) return
  const ro = new ResizeObserver(() => {
    scrollTo(0, y)
    if (scrollY >= y - 1) stop()
  })
  const t = setTimeout(() => stop(), 3000)
  const stop = () => {
    ro.disconnect()
    clearTimeout(t)
    TAKEOVER.forEach((e) => removeEventListener(e, stop))
    following = undefined
  }
  ro.observe(document.body)
  TAKEOVER.forEach((e) => addEventListener(e, stop, { passive: true }))
  following = stop
}

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
  scrolls.set(here, scrollY)
  const left = here
  const known = keyOf()
  here = known ?? stamp()
  // opening a drawer adds an entry over the same page, which keeps the page's state
  if (!known && next === prev) kept.set(here, keptAt(left))
  if (next === prev) return notify()
  const y = (known && scrolls.get(here)) || 0
  if (!document.startViewTransition || still()) {
    flushSync(notify)
    return place(y)
  }
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
    place(y)
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
