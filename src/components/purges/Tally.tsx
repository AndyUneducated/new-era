// Counted bars for the anatomy of the falls: one row per category, a click lists who is in it.
import { useState } from 'react'
import type { Fall } from '../../lib/purge'
import { personHref } from '../../lib/router'
import { Srcs } from '../bits'

export interface TallyRow { key: string; label: string; list: Fall[]; color?: string; note?: string }

export function Tally({ rows, of, unit = '人', fold }: { rows: TallyRow[]; of?: number; unit?: string; fold?: number }) {
  const [open, setOpen] = useState<string>()
  const [all, setAll] = useState(false)
  const max = Math.max(1, ...rows.map((r) => r.list.length))
  const shown = rows.filter((r) => r.list.length)
  const rest = fold && !all ? shown.length - fold : 0
  return (
    <div className="tally">
      {shown
        .slice(0, rest > 0 ? fold : undefined)
        .map((r) => (
          <div key={r.key} className={open === r.key ? 'tally-row on' : 'tally-row'}>
            <button className="tally-head" onClick={() => setOpen(open === r.key ? undefined : r.key)} aria-expanded={open === r.key}>
              <span className="tally-label">{r.label}</span>
              <span className="tally-bar">
                <i style={{ width: `${(r.list.length / max) * 100}%`, background: r.color ?? 'var(--red)' }} />
              </span>
              <span className="tally-n">
                {r.list.length}
                <span className="m">
                  {unit}
                  {of ? ` · ${Math.round((r.list.length / of) * 100)}%` : ''}
                </span>
              </span>
            </button>
            {open === r.key && (
              <div className="tally-list">
                {r.note && <p className="muted">{r.note}</p>}
                {r.list.map((f) => (
                  <a key={f.p.id} href={personHref(f.p.id)} className="pg-chip" title={f.p.headline}>
                    {f.p.name}
                    <span className="m">{f.date.slice(0, 4)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      {rest > 0 && (
        <button className="chip tally-more" onClick={() => setAll(true)}>
          其余 {rest} 项
        </button>
      )}
    </div>
  )
}

// the editor's own reading, kept apart from sourced facts (decisions #43)
export function EditorBox({ text, cites, title = '编者分析' }: { text: string; cites: string[]; title?: string }) {
  return (
    <aside className="editor-box">
      <b className="editor-label">{title}</b>
      <p>{text}</p>
      {cites.length > 0 && (
        <div className="editor-basis">
          依据：<Srcs cites={cites} />
        </div>
      )}
    </aside>
  )
}

export const money = (yuan: number) => (yuan >= 1e8 ? `${(yuan / 1e8).toFixed(yuan >= 1e9 ? 1 : 2)} 亿元` : `${Math.round(yuan / 1e4).toLocaleString('zh-CN')} 万元`)
