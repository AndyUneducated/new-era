import { useMemo, useState } from 'react'
import { CcFalls } from '../components/CcFalls'
import { Portrait, Section } from '../components/bits'
import { FallMonths } from '../components/purges/FallMonths'
import { Seal } from '../components/Seal'
import { short } from '../lib/dates'
import { LEVELS, falls, type Fall } from '../lib/purge'
import { personHref } from '../lib/router'
import { useAtlas } from '../state'

type Scope = 'all' | 'high' | 'army'
const SCOPES: Record<Scope, string> = { all: '全部', high: '中委以上', army: '只看军队' }
const inScope = (f: Fall, s: Scope) => s === 'all' || (s === 'army' ? f.army : f.level === 'top' || f.level === 'cc')

export function Purges() {
  const a = useAtlas()
  const all = useMemo(() => falls(a.db.people), [a])
  const [scope, setScope] = useState<Scope>('all')
  const [year, setYear] = useState<number | undefined>()
  const list = all.filter((f) => inScope(f, scope))

  const since18 = all.filter((f) => f.t >= 2012.87).length
  const high = all.filter((f) => f.level === 'top' || f.level === 'cc').length
  const army = all.filter((f) => f.army)
  const tops = all.filter((f) => f.level === 'top')
  const armyLate = army.filter((f) => f.t >= 2023).reverse()
  const byYear = new Map<number, Fall[]>()
  for (const f of list) byYear.set(Math.floor(f.t), [...(byYear.get(Math.floor(f.t)) ?? []), f])
  const years = [...byYear.keys()].sort((x, y) => y - x).filter((y) => year === undefined || y === year)

  return (
    <div className="page purges">
      <div className="eyebrow">Purges</div>
      <h1 className="h1">打虎</h1>
      <p className="lede">
        二〇〇〇年以来本站收录的落马者，每人记在第一次官方通报（核查、立案、免职或开除）的月份。十八大后的第一波以省部级和政法、石油系统为主；二〇二三年起的第二波转向军队，火箭军、装备系统和军委本身相继出事。
      </p>

      <div className="pg-stats">
        <div>
          <b>{all.length}</b>
          <span>收录落马</span>
        </div>
        <div>
          <b>{since18}</b>
          <span>十八大以来</span>
        </div>
        <div>
          <b>{high}</b>
          <span>中委以上</span>
        </div>
        <div>
          <b>{army.length}</b>
          <span>军队</span>
        </div>
        <div>
          <b>{tops.length}</b>
          <span>政治局、军委</span>
        </div>
      </div>

      <Section
        title="落马按月分布"
        note="悬停看人与第一条通报，点格子进入传记，点年份筛选下方名录。官方披露有先后，个别人的核查早于公开通报，以本站所记第一步为准。"
        right={
          <div className="seg" role="tablist" aria-label="范围">
            {(Object.keys(SCOPES) as Scope[]).map((k) => (
              <button key={k} className={scope === k ? 'on' : undefined} onClick={() => setScope(k)}>
                {SCOPES[k]}
              </button>
            ))}
          </div>
        }
      >
        <FallMonths list={list} onYear={(y) => setYear(year === y ? undefined : y)} />
      </Section>

      <Section title="最高一层" note="政治局委员以上与军委委员。">
        <div className="pg-wall">
          {tops.map((f) => (
            <Tile key={f.p.id} f={f} big />
          ))}
        </div>
      </Section>

      <Section title="二〇二三年以来的军中清洗" note={`${armyLate.length} 名将领，由近及远。不少人只见于罢免人大代表资格或久未露面，官方未说明原因的记为下落不明，不在此列。`}>
        <div className="pg-wall">
          {armyLate.map((f) => (
            <Tile key={f.p.id} f={f} />
          ))}
        </div>
      </Section>

      <Section title="各届中委落马率" note="每格一名中央委员或候补委员。深红为任内落马，浅红为卸任后落马。">
        <CcFalls />
      </Section>

      <Section
        title="名录"
        note={year ? `${year} 年 · 点上方年份取消筛选` : `${SCOPES[scope]} · 按年由近及远`}
        right={
          year !== undefined && (
            <button className="chip" onClick={() => setYear(undefined)}>
              全部年份
            </button>
          )
        }
      >
        <div className="pg-roll">
          {years.map((y) => (
            <div key={y} className="pg-roll-year">
              <h3>
                {y}
                <span className="m">{byYear.get(y)!.length} 人</span>
              </h3>
              <div className="pg-chips">
                {byYear
                  .get(y)!
                  .slice()
                  .reverse()
                  .map((f) => (
                    <a key={f.p.id} href={personHref(f.p.id)} className={`pg-chip lv-${f.level}`} title={f.p.headline}>
                      <i style={{ background: LEVELS[f.level].color }} />
                      {f.p.name}
                      {f.date.length > 4 && <span className="m">{Number(f.date.slice(5, 7))}月</span>}
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Tile({ f, big }: { f: Fall; big?: boolean }) {
  return (
    <a className={big ? 'pg-tile big' : 'pg-tile'} href={personHref(f.p.id)} title={f.p.headline}>
      <span className="pg-tile-face">
        <Portrait p={f.p} size={big ? 64 : 48} />
        {big && (
          <span className="pg-tile-seal">
            <Seal size={30} tilt={-10} />
          </span>
        )}
      </span>
      <b>{f.p.name}</b>
      <span className="m">{short(f.date)}</span>
    </a>
  )
}