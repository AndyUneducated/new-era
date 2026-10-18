// The pictures behind the home page story. Each keeps its elements keyed by person, so a step that
// changes congress, years or date moves the same seats and dots instead of redrawing them.
import { useMemo } from 'react'
import type { PersonR } from '../../data/db'
import { FRAMES, type Stage } from '../../data/schema'
import { congressName, cnNum } from '../../lib/cn'
import { fmt, short } from '../../lib/dates'
import { go, personHref } from '../../lib/router'
import { useAtlas } from '../../state'
import { Portrait, Src, useTip } from '../bits'
import { Hemicycle } from '../Hemicycle'
import { fellOn, SEAL_TEXT } from '../../lib/fall'
import { Seal } from '../Seal'

type Of<K extends Stage['kind']> = Extract<Stage, { kind: K }>

export function SeatsStage({ st }: { st: Of<'seats'> }) {
  const a = useAtlas()
  const c = a.congress.get(st.n)
  const legend = useMemo(() => {
    if (!c) return []
    const m = new Map<string, { name: string; color: string; n: number }>()
    for (const id of new Set([...c.psc, ...c.pb])) {
      const p = a.person.get(id)
      const f = p && a.factionIn(p, st.frame)
      if (f) m.set(f.id, { name: f.name, color: f.color, n: (m.get(f.id)?.n ?? 0) + 1 })
    }
    return [...m.values()].sort((x, y) => y.n - x.n).slice(0, 5)
  }, [a, c, st.frame])
  if (!c) return null
  return (
    <figure className="stage-fig">
      <Hemicycle c={c} frame={st.frame} focus={st.focus} />
      <figcaption>
        <b>{congressName(st.n)}中央政治局</b>
        <span className="muted"> · 按“{FRAMES[st.frame].name}”着色</span>
        <span className="stage-legend">
          {legend.map((l) => (
            <span key={l.name}>
              <i style={{ background: l.color }} />
              {l.name}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  )
}

const FW = 1000
const FH = 560
const BASE = FH - 46

export function FallsStage({ st }: { st: Of<'falls'> }) {
  const a = useAtlas()
  const tip = useTip()
  const all = useMemo(() => {
    const top = (p: PersonR) => (a.seats.get(p.id) ?? []).some((m) => m.seat !== 'alt' && m.seat !== 'sec')
    return a.db.people
      .map((p) => ({ p, d: fellOn(p) }))
      .filter((x): x is { p: PersonR; d: string } => !!x.d && Number(x.d.slice(0, 4)) >= 2000)
      .map((x) => ({ ...x, y: Number(x.d.slice(0, 4)), big: top(x.p), army: x.p.roles.includes('general') || x.p.roles.includes('cmc') }))
      .sort((x, y) => Number(y.big) - Number(x.big) || x.d.localeCompare(y.d))
  }, [a])
  const years = Array.from({ length: st.to - st.from + 1 }, (_, i) => st.from + i)
  const band = (FW - 40) / years.length
  const byYear = new Map<number, typeof all>()
  for (const x of all) if (x.y >= st.from && x.y <= st.to) byYear.set(x.y, [...(byYear.get(x.y) ?? []), x])
  const most = Math.max(1, ...[...byYear.values()].map((l) => l.length))
  // the largest cell at which every year's column fits under the top margin
  let cell = 46
  while (cell > 5 && Math.ceil(most / Math.max(1, Math.floor((band - 8) / cell))) * cell > BASE - 70) cell -= 1
  const cols = Math.max(1, Math.floor((band - 8) / cell))
  const lit = new Set(st.focus)
  const pos = new Map<string, { x: number; y: number; r: number }>()
  for (const [y, list] of byYear) {
    const x0 = 20 + (y - st.from) * band + (band - cols * cell) / 2 + cell / 2
    list.forEach((it, i) => pos.set(it.p.id, { x: x0 + (i % cols) * cell, y: BASE - cell / 2 - Math.floor(i / cols) * cell, r: (it.big ? 0.46 : 0.32) * cell }))
  }
  const shown = all.filter((x) => pos.has(x.p.id)).length
  return (
    <figure className="stage-fig">
      <svg className="falls" viewBox={`0 0 ${FW} ${FH}`} role="img" aria-label="落马者按年份">
        {years.map((y, i) => (
          <g key={y} style={{ transform: `translateX(${20 + i * band + band / 2}px)`, transition: 'transform .7s' }}>
            <text y={BASE + 22} textAnchor="middle" className="fl-year">
              {years.length > 10 ? `’${String(y).slice(2)}` : y}
            </text>
            {byYear.get(y) && (
              <text y={BASE - 10 - Math.ceil(byYear.get(y)!.length / cols) * cell} textAnchor="middle" className="fl-count">
                {byYear.get(y)!.length}
              </text>
            )}
          </g>
        ))}
        <line x1={14} x2={FW - 14} y1={BASE + 2} y2={BASE + 2} stroke="var(--gold)" strokeOpacity={0.5} />
        {all.map(({ p, d, big, army }) => {
          const at = pos.get(p.id)
          const on = lit.has(p.id)
          return (
            <circle
              key={p.id}
              r={at?.r ?? 2}
              fill={army ? 'var(--sys-army)' : 'var(--red)'}
              stroke={on ? 'var(--gold)' : big ? 'var(--card)' : 'none'}
              strokeWidth={on ? 3 : 1}
              style={{
                transform: `translate(${at?.x ?? FW + 20}px, ${at?.y ?? BASE}px)`,
                opacity: !at ? 0 : lit.size && !on ? 0.3 : big ? 1 : 0.78,
                transition: 'transform .8s cubic-bezier(.2,.8,.2,1), opacity .5s, r .5s',
                cursor: 'pointer',
              }}
              onClick={() => go(personHref(p.id))}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <div>
                    <b>{p.name}</b> <span className="m">{short(d)}</span>
                    <div className="m">{p.headline}</div>
                  </div>,
                )
              }
              onMouseLeave={tip.hide}
            />
          )
        })}
        {st.focus.map((id) => {
          const at = pos.get(id)
          const p = a.person.get(id)
          if (!at || !p) return null
          return (
            <g key={id} className="fl-label" style={{ transform: `translate(${at.x}px, ${at.y}px)` }}>
              <line y1={-at.r - 2} y2={-46} stroke="var(--gold)" />
              <text y={-52} textAnchor="middle">
                {p.name}
              </text>
            </g>
          )
        })}
      </svg>
      {tip.node}
      <figcaption>
        <b>
          本站收录的落马者 · {st.from}—{st.to} · {shown} 人
        </b>
        <span className="stage-legend">
          <span>
            <i style={{ background: 'var(--red)' }} />
            地方与中央机关
          </span>
          <span>
            <i style={{ background: 'var(--sys-army)' }} />
            军队
          </span>
          <span className="muted">大点：曾任政治局委员或军委委员</span>
        </span>
      </figcaption>
    </figure>
  )
}

export function DocStage({ st }: { st: Of<'doc'> }) {
  const [before, after] = st.strike ? st.text.split(st.strike) : [st.text, undefined]
  return (
    <figure className="stage-fig doc-wrap">
      <div className="doc-sheet">
        <div className="doc-red">{st.head.replace(/（.*$/, '')}</div>
        <div className="doc-rule">
          <span>★</span>
        </div>
        <div className="doc-no">{st.head.match(/（.*$/)?.[0] ?? ''}</div>
        <p className="doc-body">
          {before}
          {after !== undefined && (
            <>
              <span className="doc-strike">{st.strike}</span>
              {after}
            </>
          )}
        </p>
        <div className="doc-src">
          <Src cite={st.cite} />
        </div>
      </div>
    </figure>
  )
}

export function CmcStage({ st }: { st: Of<'cmc'> }) {
  const a = useAtlas()
  const rows = st.n.map((n) => ({ n, list: (a.congress.get(n)?.cmc ?? []).map((m) => ({ ...m, p: a.person.get(m.id) })) }))
  const last = rows.at(-1)!
  const down = (p?: PersonR) => {
    const d = p && fellOn(p)
    return !!d && d <= st.at
  }
  const fallen = last.list.filter((m) => down(m.p)).length
  return (
    <figure className="stage-fig">
      <div className="cmc-stage">
        <div className="cmc-date">
          <span>截至</span>
          <b>{fmt(st.at)}</b>
          <span>
            {congressName(last.n)}军委 {cnNum(last.list.length)}人中 <em>{cnNum(fallen)}</em> 人落马
          </span>
        </div>
        {rows.map(({ n, list }) => (
          <div key={n} className="cmc-row">
            <div className="cmc-n">{congressName(n)}</div>
            <div className="cmc-faces">
              {list.map(({ id, title, p }) =>
                p ? (
                  <a key={id} href={personHref(id)} className={down(p) ? 'cmc-face down' : 'cmc-face'}>
                    <span className="cmc-photo">
                      <Portrait p={p} size={68} mark={down(p) ? 'fell' : null} />
                      {down(p) && (
                        <span className="cmc-seal">
                          <Seal text={SEAL_TEXT[p.status] ?? '落马'} size={58} stamp />
                        </span>
                      )}
                    </span>
                    <b>{p.name}</b>
                    <span>{title.replace('中央军委', '')}</span>
                  </a>
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
    </figure>
  )
}
