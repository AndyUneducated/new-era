import { useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'ne-theme'

export function useTheme(): [Theme, () => void] {
  const [t, set] = useState<Theme>(() => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'))
  const toggle = () => {
    const n = t === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = n
    try {
      localStorage.setItem(KEY, n)
    } catch {
      // private mode: the choice lasts for this page only
    }
    set(n)
  }
  return [t, toggle]
}
