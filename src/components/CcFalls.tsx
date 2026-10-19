// 各届中委落马率: every full and alternate member of each central committee as one cell, columns of five;
// solid seal red fell during the term, pale red after it, grey has a card here and has not fallen, outline has no card yet.
import { useMemo } from 'react'
import type { PersonR } from '../data/db'
import { congressName } from '../lib/cn'
import { fy, short } from '../lib/dates'
import { fellOn } from '../lib/fall'
import { NOW } from '../lib/faction'
import { go, personHref } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from './bits'

type State = 'in' | 'after' | 'clean' | 'unknown'
const ORDER: Record<State, number> = { in: 0, after: 1, clean: 2, unknown: 3 }
const TALL = 5
const LEFT = 92
const RIGHT = 118

interface Cell { name: string; p?: PersonR; state: State; fell?: string }

export function CcFalls() {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const W = Math.max(width, 560)

  const terms = useMemo(() => {
    const list = [...a.db.congresses].filter((c) => c.cc?.length).sort((x, y) => x.n - y.n)
    return list.map((c, i) => {
      const end = fy(list[i + 1]?.opened) ?? NOW
      const cells = (names: string[]): Cell[] =>
        names
          .map((name) => {
            const id = a.ccId(name, c)
            const p = id ? a.person.get(id) : undefined
            const fell = p && fellOn(p)
            const t = fy(fell)
            const state: State = !p ? 'unknown' : t === undefined ? 'clean' : t < end ? 'in' : 'after'
            return { name, p, state, fell }
          })
          .sort((x, y) => ORDER[x.state] - ORDER[y.state] || (y.fell ?? '').localeCompare(x.fell ?? ''))
      const full = cells(c.cc ?? [])
      const alt = cells(c.cca ?? [])
      return { n: c.n, year: Math.floor(fy(c.opened)!), full, alt }
    }).reverse()
  }, [a])

  const cols = Math.max(...terms.map((t) => Math.ceil(t.full.length / TALL) + Math.ceil(t.alt.length / TALL) + 2))
  const cell = Math.max(5, Math.min(12, (W - LEFT - RIGHT) / cols))
  const rowH = cell * TALL + 22
  const H = terms.length * rowH + 4

  const block = (list: Cell[], x0: number, y0: number) =>
    list.map((c, i) => {
      const cx = x0 + Math.floor(i / TALL) * cell
      const cy = y0 + (i % TALL) * cell
      return (
        <rect
          key={i}
          x={cx}
          y={cy}
          width={cell - 1.5}
          height={cell - 1.5}
          rx={1.5}
          className={`cf-${c.state}`}
          onMouseMove={(e) =>
            tip.show(
              e,
              <div>
                <b>{c.name}</b>
                <div className="m">{c.state === 'unknown' ? '尚无档案' : c.fell ? `${short(c.fell)} 落马` : '未见落马'}</div>
              </div>,
            )
          }
          onMouseLeave={tip.hide}
          onClick={() => c.p && go(personHref(c.p.id))}
          style={{ cursor: c.p ? 'pointer' : undefined }}
        />
      )
    })

  return (
    <div className="ccfalls" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="各届中央委员会委员与候补委员中的落马人数">
        {terms.map((t, i) => {
          const y0 = i * rowH + 16
          const altX = LEFT + (Math.ceil(t.full.length / TALL) + 1.5) * cell
          const fallen = [...t.full, ...t.alt].filter((c) => c.state === 'in' || c.state === 'after').length
          const total = t.full.length + t.alt.length
          return (
            <g key={t.n}>
              <text x={0} y={y0 + cell * 1.6} className="cf-term">
                {congressName(t.n)}
              </text>
              <text x={0} y={y0 + cell * 1.6 + 15} className="cf-year">
                {t.year} 年
              </text>
              <text x={LEFT} y={y0 - 4} className="cf-cap">委员 {t.full.length}</text>
              <text x={altX} y={y0 - 4} className="cf-cap">候补 {t.alt.length}</text>
              {block(t.full, LEFT, y0)}
              {block(t.alt, altX, y0)}
              <text x={W - 4} y={y0 + cell * 2} textAnchor="end" className="cf-rate">
                {((fallen / total) * 100).toFixed(1)}%
              </text>
              <text x={W - 4} y={y0 + cell * 2 + 16} textAnchor="end" className="cf-year">
                落马 {fallen} / {total}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="cf-key">
        <span><i className="cf-in" />任内落马</span>
        <span><i className="cf-after" />卸任后落马</span>
        <span><i className="cf-clean" />未见落马</span>
        <span><i className="cf-unknown" />尚无档案（按未落马计，所以比率是下限）</span>
      </div>
      {tip.node}
    </div>
  )
}
