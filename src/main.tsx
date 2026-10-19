import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Atlas, type DB } from './data/db'
import { loadLives, stubLives } from './lib/lives'
import { AtlasCtx } from './state'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
root.render(<div className="loading">载入中</div>)

// stream the body so a slow connection shows how far along it is
async function fetchDb(): Promise<DB> {
  const r = await fetch('data/db.json')
  if (!r.ok || !r.body) throw new Error(`data/db.json ${r.status}`)
  const reader = r.body.getReader()
  const parts: Uint8Array<ArrayBuffer>[] = []
  let n = 0
  let shown = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    n += value.length
    if (n - shown > 256 * 1024) {
      shown = n
      root.render(<div className="loading">载入中 · {(n / 1024 / 1024).toFixed(1)} MB</div>)
    }
  }
  return JSON.parse(await new Blob(parts).text()) as DB
}

fetchDb()
  .then((db) => {
    stubLives(db)
    root.render(
      <StrictMode>
        <AtlasCtx.Provider value={new Atlas(db)}>
          <App />
        </AtlasCtx.Provider>
      </StrictMode>,
    )
    loadLives(db.people)
  })
  .catch((e: Error) => root.render(<div className="loading">数据载入失败：{e.message}</div>))
