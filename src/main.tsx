import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Atlas, type DB } from './data/db'
import { AtlasCtx } from './state'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
root.render(<div className="loading">载入中</div>)

fetch('data/db.json')
  .then((r) => {
    if (!r.ok) throw new Error(`data/db.json ${r.status}`)
    return r.json() as Promise<DB>
  })
  .then((db) =>
    root.render(
      <StrictMode>
        <AtlasCtx.Provider value={new Atlas(db)}>
          <App />
        </AtlasCtx.Provider>
      </StrictMode>,
    ),
  )
  .catch((e: Error) => root.render(<div className="loading">数据载入失败：{e.message}</div>))
