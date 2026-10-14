import { useEffect, useState } from 'react'
import { EventDrawer } from './components/EventDrawer'
import { IsmDrawer } from './components/IsmDrawer'
import { Search } from './components/Search'
import { href, useRoute } from './lib/router'
import { useTheme } from './lib/theme'
import { useAtlas } from './state'
import { About } from './views/About'
import { ConceptPage } from './views/ConceptPage'
import { FactionPage } from './views/FactionPage'
import { Factions } from './views/Factions'
import { Home } from './views/Home'
import { Ideas } from './views/Ideas'
import { People } from './views/People'
import { PersonPage } from './views/PersonPage'
import { Timeline } from './views/Timeline'

const NAV = [
  ['people', '人物'],
  ['factions', '派系'],
  ['timeline', '时间线'],
  ['ideas', '思想'],
] as const

export function App() {
  const a = useAtlas()
  const r = useRoute()
  const [theme, toggle] = useTheme()
  const [searching, setSearching] = useState(false)
  const [top, id] = r.parts

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearching((v) => !v)
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        setSearching(true)
      }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])

  // a new page starts at the top; opening the drawer does not move the page
  const path = r.parts.join('/')
  useEffect(() => {
    scrollTo(0, 0)
  }, [path])
  useEffect(() => {
    const t = id ? a.name(id) : NAV.find((n) => n[0] === top)?.[1]
    document.title = t ? `${t} · 新时代` : '新时代 · New Era — 2000 年以来的中国政治'
  }, [a, top, id])

  let view
  if (top === 'people') view = id ? <PersonPage key={id} id={id} /> : <People />
  else if (top === 'factions') view = id ? <FactionPage key={id} id={id} /> : <Factions />
  else if (top === 'timeline') view = <Timeline />
  else if (top === 'ideas') view = id ? <ConceptPage key={id} id={id} /> : <Ideas />
  else if (top === 'about') view = <About />
  else view = <Home />

  const ev = r.q.get('e')
  const ism = r.q.get('m')
  return (
    <>
      <header className="topbar">
        <a className="brand" href={href('')}>
          <span className="seal">新</span>
          <b>
            新<i>时</i>代
          </b>
          <span>NEW ERA · 2000 —</span>
        </a>
        <nav className="nav">
          {NAV.map(([k, label]) => (
            <a key={k} href={href(k)} className={top === k ? 'on' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div className="spacer" />
        <button className="searchbtn" onClick={() => setSearching(true)} aria-label="搜索">
          <span aria-hidden>⌕</span>
          <span className="sb-long">搜索人物、派系、事件</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="iconbtn" onClick={toggle} aria-label={theme === 'dark' ? '切换到亮色' : '切换到暗色'} title="切换主题">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>
      <main className="main">{view}</main>
      {top !== 'timeline' && (
        <footer className="foot">
          <span>新时代 · New Era — 2000 年以来的中国大陆政治</span>
          <span>数据 {a.db.built}</span>
          <span>
            {a.db.people.length} 人 · {a.db.factions.length} 派系 · {a.db.events.length} 事件 · {a.db.sources.length} 来源
          </span>
          <a href={href('about')}>体例与来源说明</a>
          <a href="https://github.com/AndyUneducated/new-era" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </footer>
      )}
      {ev && <EventDrawer id={ev} />}
      {ism && !ev && <IsmDrawer id={ism} />}
      {searching && <Search onClose={() => setSearching(false)} />}
    </>
  )
}
