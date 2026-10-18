// 通报措辞: for each stock phrase of the CCDI, the share of that year's expulsion notices that use it.
// A notice counts in the year of the first step against the person.
import { PHRASES } from '../../lib/caseparse'
import type { Fall } from '../../lib/purge'
import { useTip } from '../bits'

export function Wording({ list }: { list: Fall[] }) {
  const tip = useTip()
  // falls whose notice text is in the library
  const read = list.filter((f) => f.c.phrases.length || f.c.disc.length)
  const years = [...new Set(read.map((f) => Math.floor(f.t)))].sort()
  const byYear = new Map(years.map((y) => [y, read.filter((f) => Math.floor(f.t) === y)]))
  const rows = PHRASES.map((ph) => ({ ph, hits: read.filter((f) => f.c.phrases.includes(ph.id)) }))
    .filter((r) => r.hits.length >= 2)
    .sort((a, b) => b.hits.length - a.hits.length)
  return (
    <div className="wording">
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
          {rows.map(({ ph, hits }) => (
            <tr key={ph.id}>
              <th>{ph.label}</th>
              {years.map((y) => {
                const all = byYear.get(y)!
                const got = hits.filter((f) => Math.floor(f.t) === y)
                const share = all.length ? got.length / all.length : 0
                return (
                  <td
                    key={y}
                    style={{ background: got.length ? `color-mix(in oklab, var(--seal) ${Math.round(12 + share * 80)}%, var(--card))` : undefined }}
                    onMouseMove={(e) =>
                      tip.show(
                        e,
                        <div className="pg-tip">
                          <b>
                            {y} 年 · {ph.label}
                          </b>
                          <span className="m">
                            {got.length} / {all.length} 份通报（{Math.round(share * 100)}%）
                          </span>
                          {got.length > 0 && <span>{got.map((f) => f.p.name).join('、')}</span>}
                        </div>,
                      )
                    }
                    onMouseLeave={tip.hide}
                  />
                )
              })}
              <td className="n">{hits.length}</td>
            </tr>
          ))}
          <tr className="base">
            <th>本站有通报原文</th>
            {years.map((y) => (
              <td key={y}>{byYear.get(y)!.length}</td>
            ))}
            <td className="n">{read.length}</td>
          </tr>
        </tbody>
      </table>
      {tip.node}
    </div>
  )
}
