// Ctrl/⌘ K palette over people, factions, events and concepts.
import { useEffect, useMemo, useRef, useState } from 'react'
import { short } from '../lib/dates'
import { conceptHref, eventHref, factionHref, go, personHref } from '../lib/router'
import { useAtlas } from '../state'

interface Hit { kind: string; title: string; sub: string; to: string; keys: string; rank: number }

export function Search({ onClose }: { onClose: () => void }) {
  const a = useAtlas()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.focus(), [])

  const all = useMemo<Hit[]>(
    () => [
      ...a.db.people.map((p) => ({ kind: '人物', title: p.name, sub: p.headline, to: personHref(p.id), keys: [p.name, p.pinyin, ...p.aka, p.id].join(' ').toLowerCase(), rank: p.tier === 1 ? 0 : 1 })),
      ...a.db.factions.map((f) => ({ kind: '派系', title: f.name, sub: f.basis, to: factionHref(f.id), keys: [f.name, f.en, ...f.aka, f.id].join(' ').toLowerCase(), rank: 0 })),
      ...a.db.concepts.map((c) => ({ kind: '思想', title: c.name, sub: c.en ?? '', to: conceptHref(c.id), keys: [c.name, c.en, c.id, ...c.terms].join(' ').toLowerCase(), rank: 1 })),
      ...a.db.events.map((e) => ({ kind: '事件', title: e.title, sub: short(e.date), to: eventHref(e.id), keys: `${e.title} ${e.date} ${e.id}`.toLowerCase(), rank: e.major ? 1 : 2 })),
    ],
    [a],
  )
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return all.filter((h) => h.rank === 0).slice(0, 12)
    return all
      .filter((h) => h.keys.includes(t))
      .sort((x, y) => Number(!x.title.toLowerCase().startsWith(t)) - Number(!y.title.toLowerCase().startsWith(t)) || x.rank - y.rank)
      .slice(0, 40)
  }, [q, all])

  const pick = (h: Hit) => {
    onClose()
    go(h.to)
  }

  return (
    <div className="palette-back" onMouseDown={onClose}>
      <div className="palette card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="搜索">
        <input
          ref={input}
          value={q}
          placeholder="搜索人物、派系、事件、思想……"
          onChange={(e) => {
            setQ(e.target.value)
            setI(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowDown') setI((v) => Math.min(v + 1, hits.length - 1))
            else if (e.key === 'ArrowUp') setI((v) => Math.max(v - 1, 0))
            else if (e.key === 'Enter' && hits[i]) pick(hits[i])
            else return
            e.preventDefault()
          }}
        />
        <ul>
          {hits.map((h, k) => (
            <li key={h.to}>
              <a
                href={h.to}
                className={k === i ? 'on' : undefined}
                onMouseEnter={() => setI(k)}
                onClick={(e) => {
                  e.preventDefault()
                  pick(h)
                }}
              >
                <span className="k">{h.kind}</span>
                <span className="t">{h.title}</span>
                <span className="s">{h.sub}</span>
              </a>
            </li>
          ))}
          {!hits.length && <li className="muted small" style={{ padding: 16 }}>没有匹配</li>}
        </ul>
      </div>
    </div>
  )
}
