// 媒体判断对照: people labelled in one frame by two or more outlets, one column per outlet, so the cases
// where outlets put the same person in different factions stand out.
import { useMemo } from 'react'
import type { PersonR } from '../data/db'
import type { Faction, FactionTag, Frame } from '../data/schema'
import { shortName } from '../lib/faction'
import { outlet } from '../lib/outlet'
import { quoted } from '../lib/quotes'
import { personHref, useKept } from '../lib/router'
import { useAtlas } from '../state'
import { Portrait, useTip } from './bits'

const MAX_COLS = 9
const MAX_ROWS = 30

interface Row { p: PersonR; by: Map<string, { f: Faction; t: FactionTag }[]>; split: boolean }

export function MediaSplit({ frame }: { frame: Frame }) {
  const a = useAtlas()
  const tip = useTip()
  const [onlySplit, setOnlySplit] = useKept(true)
  const { rows, cols } = useMemo(() => {
    const rows: Row[] = []
    for (const p of a.db.people) {
      const by = new Map<string, { f: Faction; t: FactionTag }[]>()
      for (const t of p.factions) {
        const f = a.faction.get(t.f)
        const printed = a.source.get(t.cite.split('@')[0])?.publisher
        if (!f || f.frame !== frame || !printed) continue
        const pub = outlet(printed)
        by.set(pub, [...(by.get(pub) ?? []).filter((x) => x.f.id !== f.id), { f, t }])
      }
      if (by.size < 2) continue
      const views = [...by.values()].map((l) => l.map((x) => x.f.id).sort().join())
      rows.push({ p, by, split: new Set(views).size > 1 })
    }
    const freq = new Map<string, number>()
    for (const r of rows) for (const pub of r.by.keys()) freq.set(pub, (freq.get(pub) ?? 0) + 1)
    const cols = [...freq].sort((x, y) => y[1] - x[1]).slice(0, MAX_COLS).map(([k]) => k)
    rows.sort((x, y) => Number(y.split) - Number(x.split) || y.by.size - x.by.size)
    return { rows, cols }
  }, [a, frame])

  const shown = rows.filter((r) => !onlySplit || r.split).slice(0, MAX_ROWS)
  const splits = rows.filter((r) => r.split).length
  if (!rows.length) return <div className="empty">此框架下还没有被两家以上来源同时标注的人</div>
  return (
    <div>
      <div className="ms-head">
        <span className="m">
          {rows.length} 人被两家以上来源标注，其中 {splits} 人的归属不一致
        </span>
        <div className="seg">
          <button className={onlySplit ? 'on' : undefined} onClick={() => setOnlySplit(true)}>
            只看分歧
          </button>
          <button className={!onlySplit ? 'on' : undefined} onClick={() => setOnlySplit(false)}>
            全部
          </button>
        </div>
      </div>
      <div className="ms-wrap">
        <table className="ms">
          <thead>
            <tr>
              <th />
              {cols.map((c) => (
                <th key={c}>
                  <span>{c}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.p.id} className={r.split ? 'split' : undefined}>
                <th>
                  <a href={personHref(r.p.id)}>
                    <Portrait p={r.p} size={26} />
                    {r.p.name}
                  </a>
                </th>
                {cols.map((c) => (
                  <td key={c}>
                    {r.by.get(c)?.map(({ f, t }) => (
                      <span
                        key={f.id}
                        className="ms-chip"
                        style={{ background: f.color }}
                        onMouseMove={(e) =>
                          tip.show(
                            e,
                            <div>
                              <b>{c}</b>：{f.name}
                              {t.quote && <div style={{ marginTop: 4 }}>{quoted(t.quote)}</div>}
                              {t.zh && <div className="m">{t.zh}</div>}
                            </div>,
                          )
                        }
                        onMouseLeave={tip.hide}
                      >
                        {shortName(f)}
                      </span>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tip.node}
    </div>
  )
}
