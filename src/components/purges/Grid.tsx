// 塌方与系统: falls by system and by province, year by year; a dark cell is a sweep through one place.
import { useTip } from '../bits'
import type { Fall } from '../../lib/purge'

export function Grid({ rows, list, from = 2012 }: { rows: { key: string; label: string; test: (f: Fall) => boolean }[]; list: Fall[]; from?: number }) {
  const tip = useTip()
  const last = Math.max(from, ...list.map((f) => Math.floor(f.t)))
  const years = Array.from({ length: last - from + 1 }, (_, i) => from + i)
  const data = rows
    .map((r) => {
      const mine = list.filter((f) => f.t >= from && r.test(f))
      return { ...r, mine, by: years.map((y) => mine.filter((f) => Math.floor(f.t) === y)) }
    })
    .filter((r) => r.mine.length)
  const max = Math.max(1, ...data.flatMap((r) => r.by.map((b) => b.length)))
  return (
    <div className="wording grid">
      <table>
        <thead>
          <tr>
            <th />
            {years.map((y) => (
              <th key={y}>
                <span>{String(y).slice(2)}</span>
              </th>
            ))}
            <th className="n">合计</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.key}>
              <th>{r.label}</th>
              {r.by.map((b, i) => (
                <td
                  key={years[i]}
                  style={{ background: b.length ? `color-mix(in oklab, var(--seal) ${Math.round(14 + (b.length / max) * 80)}%, var(--card))` : undefined, color: b.length / max > 0.5 ? '#fff' : undefined }}
                  onMouseMove={(e) =>
                    b.length &&
                    tip.show(
                      e,
                      <div className="pg-tip">
                        <b>
                          {years[i]} · {r.label} · {b.length} 人
                        </b>
                        <span>{b.map((f) => f.p.name).join('、')}</span>
                      </div>,
                    )
                  }
                  onMouseLeave={tip.hide}
                >
                  {b.length || ''}
                </td>
              ))}
              <td className="n">{r.mine.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {tip.node}
    </div>
  )
}
