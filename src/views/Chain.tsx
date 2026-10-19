// 思想落地: every idea that was turned into policy, on one time axis. Each row is an idea: when it was first
// said, when it entered the charter or a resolution, the policies made in its name, and the events they led to.
import * as d3 from 'd3'
import { useMemo } from 'react'
import { Section, Src, useTip } from '../components/bits'
import { CONCEPT_KINDS, LANES, type Concept } from '../data/schema'
import { fy, short } from '../lib/dates'
import { NOW } from '../lib/faction'
import { LANE_COLOR } from '../lib/lanes'
import { conceptHref, eventHref, go, href, useKept } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'

const FROM = 1990
const ROW = 36
const HEAD = 26
const LEFT = 156

type Order = 'new' | 'most'
const ORDERS: [Order, string][] = [
  ['new', '按提出时间'],
  ['most', '按政策数'],
]

// an idea dates from its first appearance, or failing that its first policy
const startOf = (c: Concept) => c.first?.date ?? c.policies.map((p) => p.date).sort()[0]

export function Chain() {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [order, setOrder] = useKept<Order>('new')

  const rows = useMemo(() => {
    const list = a.db.concepts.filter((c) => c.policies.length)
    return order === 'most'
      ? list.sort((x, y) => y.policies.length - x.policies.length || startOf(y).localeCompare(startOf(x)))
      : list.sort((x, y) => startOf(y).localeCompare(startOf(x)))
  }, [a, order])

  const stats = useMemo(() => {
    const policies = rows.flatMap((c) => c.policies)
    const events = new Set(policies.flatMap((p) => p.events).filter((id) => a.event.has(id)))
    const lags = rows
      .filter((c) => c.first)
      .map((c) => Math.min(...c.policies.map((p) => fy(p.date)!)) - fy(c.first!.date)!)
      .filter((d) => d >= 0)
    return { policies: policies.length, events: events.size, lag: d3.median(lags) }
  }, [a, rows])

  const all = useMemo(
    () =>
      rows
        .flatMap((c) => c.policies.map((p) => ({ c, p })))
        .sort((x, y) => y.p.date.localeCompare(x.p.date)),
    [rows],
  )
  const years = d3.groups(all, (x) => x.p.date.slice(0, 4))

  // on a phone the name sits above its track so the axis can use the full width
  const narrow = width < 640
  const W = narrow ? width : Math.max(width, 760)
  const row = narrow ? 46 : ROW
  const x = d3.scaleLinear().domain([FROM, NOW]).range([narrow ? 12 : LEFT, W - 14]).clamp(true)
  const H = HEAD + rows.length * row + 22
  const ticks = x.ticks(Math.floor((W - (narrow ? 12 : LEFT)) / (narrow ? 60 : 70)))
  const congresses = a.db.congresses.map((c) => fy(c.opened)!).filter((t) => t >= FROM)

  return (
    <div className="page">
      <div className="eyebrow">From idea to policy</div>
      <h1 className="h1">思想落地</h1>
      <p className="lede">
        一个提法从讲话里出现，到写进党章或决议，再变成具体的法律、文件、运动，最后在现实里引出一件件事。下图每行一个提法：空心圆是首次出现，红色菱形是写入党章、宪法或全会决议，黑色方块是以它为名出台的政策，彩色小点是政策引出的事件（颜色同时间线的分类）。
      </p>
      <div className="pg-stats">
        <div>
          <b>{rows.length}</b>
          <span>个提法</span>
        </div>
        <div>
          <b>{stats.policies}</b>
          <span>项政策</span>
        </div>
        <div>
          <b>{stats.events}</b>
          <span>件事件</span>
        </div>
        {stats.lag !== undefined && (
          <div>
            <b>{stats.lag.toFixed(1)}</b>
            <span>年（从提出到第一项政策，中位数）</span>
          </div>
        )}
      </div>

      <Section
        title="落地图"
        note="点行首的名称看提法全文，点方块看政策所在的提法，点彩色小点看事件。金色虚线为党代会。"
        right={
          <div className="seg">
            {ORDERS.map(([k, label]) => (
              <button key={k} className={order === k ? 'on' : undefined} onClick={() => setOrder(k)}>
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="card chain-v" ref={ref}>
          <svg width={W} height={H} role="img" aria-label="思想落地图">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={HEAD - 6} y2={H - 16} stroke="var(--rule)" />
                <text x={x(t)} y={14} textAnchor="middle" className="cw-tick">
                  {t}
                </text>
                <text x={x(t)} y={H - 4} textAnchor="middle" className="cw-tick">
                  {t}
                </text>
              </g>
            ))}
            {congresses.map((t) => (
              <line key={t} x1={x(t)} x2={x(t)} y1={HEAD - 6} y2={H - 16} stroke="var(--gold)" strokeOpacity={0.4} strokeDasharray="2 4" />
            ))}
            {rows.map((c, i) => {
              const top = HEAD + i * row
              const py = top + (narrow ? 27 : 13)
              const ey = py + (narrow ? 12 : 14)
              const x0 = x(fy(startOf(c))!)
              return (
                <g key={c.id}>
                  {i % 2 === 1 && <rect x={0} y={top} width={W} height={row} className="chain-alt" />}
                  <a href={conceptHref(c.id)}>
                    {narrow ? (
                      <text x={12} y={top + 14} className="chain-name">
                        {c.name}
                        <tspan className="chain-kind" dx={6}>
                          {CONCEPT_KINDS[c.kind]} · {c.policies.length} 项
                        </tspan>
                      </text>
                    ) : (
                      <>
                        <text x={10} y={py + 4} className="chain-name">
                          {c.name.length > 10 ? `${c.name.slice(0, 10)}…` : c.name}
                        </text>
                        <text x={10} y={py + 17} className="chain-kind">
                          {CONCEPT_KINDS[c.kind]} · {c.policies.length} 项
                        </text>
                      </>
                    )}
                  </a>
                  <line x1={x0} x2={x(NOW)} y1={py} y2={py} stroke="var(--rule)" strokeWidth={2} />
                  {c.policies.flatMap((p, j) =>
                    p.events.map((id) => {
                      const e = a.event.get(id)
                      if (!e) return null
                      const px = x(fy(p.date)!)
                      const ex = x(fy(e.date)!)
                      return (
                        <g
                          key={`${j}-${id}`}
                          className="chain-ev"
                          onClick={() => go(eventHref(id))}
                          onMouseMove={(m) =>
                            tip.show(
                              m,
                              <>
                                <b>{e.title}</b>
                                <div className="m">
                                  {LANES[e.lane]} · {short(e.date)}
                                </div>
                              </>,
                            )
                          }
                          onMouseLeave={tip.hide}
                        >
                          <path d={`M${px},${py + 4} C${px},${ey} ${ex},${py + 4} ${ex},${ey}`} fill="none" stroke={LANE_COLOR[e.lane]} strokeOpacity={0.55} />
                          <circle cx={ex} cy={ey} r={3.6} fill={LANE_COLOR[e.lane]} />
                          <circle cx={ex} cy={ey} r={9} fill="transparent" />
                        </g>
                      )
                    }),
                  )}
                  {c.first && (
                    <circle
                      cx={x(fy(c.first.date)!)}
                      cy={py}
                      r={4.5}
                      fill="var(--card)"
                      stroke="var(--gold)"
                      strokeWidth={2}
                      onMouseMove={(m) => tip.show(m, <><b>首次出现</b><div className="m">{short(c.first!.date)}</div><div style={{ maxWidth: 300 }}>{c.first!.text}</div></>)}
                      onMouseLeave={tip.hide}
                    />
                  )}
                  {c.codified.map((k, j) => (
                    <rect
                      key={j}
                      x={x(fy(k.date)!) - 4}
                      y={py - 4}
                      width={8}
                      height={8}
                      transform={`rotate(45 ${x(fy(k.date)!)} ${py})`}
                      fill="var(--seal)"
                      onMouseMove={(m) => tip.show(m, <><b>{k.where}</b><div className="m">{short(k.date)}</div></>)}
                      onMouseLeave={tip.hide}
                    />
                  ))}
                  {c.policies.map((p, j) => (
                    <g
                      key={j}
                      className="chain-pol"
                      onClick={() => go(conceptHref(c.id))}
                      onMouseMove={(m) =>
                        tip.show(
                          m,
                          <>
                            <b>{p.name}</b>
                            <div className="m">
                              {c.name} · {short(p.date)}
                            </div>
                            <div style={{ marginTop: 4, maxWidth: 300 }}>{p.text}</div>
                          </>,
                        )
                      }
                      onMouseLeave={tip.hide}
                    >
                      <rect x={x(fy(p.date)!) - 4} y={py - 4} width={8} height={8} rx={1.5} fill="var(--ink)" />
                      <rect x={x(fy(p.date)!) - 9} y={py - 9} width={18} height={18} fill="transparent" />
                    </g>
                  ))}
                </g>
              )
            })}
          </svg>
        </div>
        <div className="legend small">
          <span>
            <i style={{ background: 'var(--card)', border: '2px solid var(--gold)' }} />
            首次出现
          </span>
          <span>
            <i style={{ background: 'var(--seal)', borderRadius: 1, transform: 'rotate(45deg)', width: 8, height: 8 }} />
            写入党章、宪法或决议
          </span>
          <span>
            <i style={{ background: 'var(--ink)', borderRadius: 2 }} />
            政策
          </span>
          <span>
            <i style={{ background: LANE_COLOR.econ }} />
            事件
          </span>
        </div>
        {tip.node}
      </Section>

      <Section title="逐年" note="所有政策由近及远，附它所出自的提法和引出的事件">
        {years.map(([y, list]) => (
          <div key={y} className="chain-year">
            <div className="group-title">
              {y} <small>{list.length}</small>
            </div>
            <div className="cp-chain">
              {list.map(({ c, p }, i) => (
                <div key={`${c.id}-${i}`} className="cp-policy">
                  <span className="tnum muted">{short(p.date)}</span>
                  <div>
                    <b>{p.name}</b>
                    <a className="chip chain-of" href={conceptHref(c.id)}>
                      {c.name}
                    </a>
                    <p>
                      {p.text} <Src cite={p.cite} />
                    </p>
                    {p.events.some((id) => a.event.has(id)) && (
                      <div className="chips">
                        {p.events.map((id) => {
                          const e = a.event.get(id)
                          return e ? (
                            <a key={id} className="chip ev" href={eventHref(id)}>
                              {e.title}
                            </a>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="muted small">
          <a href={href('ideas')}>回到思想</a>
        </p>
      </Section>
    </div>
  )
}
