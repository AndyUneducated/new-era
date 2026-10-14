import { createContext, useContext } from 'react'
import type { Atlas } from './data/db'

export const AtlasCtx = createContext<Atlas | null>(null)

export function useAtlas(): Atlas {
  const a = useContext(AtlasCtx)
  if (!a) throw new Error('useAtlas outside the data provider')
  return a
}
