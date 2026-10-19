import { useMemo } from 'react'
import { Portrait, Section } from '../components/bits'
import { Tally } from '../components/purges/Tally'
import { AgeStrip } from '../components/rise/AgeStrip'
import { ROUTES, type Route } from '../data/schema'
import { short } from '../lib/dates'
import { ageAt, rungAges } from '../lib/rise'
import { go, href, personHref, useRoute, withQuery } from '../lib/router'
import { useAtlas } from '../state'

export function Rise() {
  const a = useAtlas()
  const pick = useRoute().q.get('r') as Route | null
  const all = useMemo(() => a.db.people.filter((p) => p.turn), [a])
  const shown = pick ? all.filter((p) => p.turn!.routes.includes(pick)) : all
  const ages = useMemo(() => rungAges(all), [all])
  const deep = shown.filter((p) => p.turn!.deep).sort((x, y) => x.tier - y.tier || y.turn!.turns.length - x.turn!.turns.length)
  const moments = shown
    .flatMap((p) => p.turn!.turns.map((t) => ({ p, t, age: ageAt(p.born, t.date) })))
    .sort((x, y) => y.t.date.localeCompare(x.t.date))
  const decades = [...new Set(moments.map((m) => Math.floor(Number(m.t.date.slice(0, 4)) / 10) * 10))]
  const firstOf = (r: Route) => all.filter((p) => p.turn!.routes[0] === r)
  const routes = (Object.keys(ROUTES) as Route[])
    .map((r) => ({ r, n: all.filter((p) => p.turn!.routes.includes(r)).length }))
    .sort((x, y) => y.n - x.n)
    .map((x) => x.r)
  const byMain = [...routes].sort((x, y) => firstOf(y).length - firstOf(x).length)
  return (
    <div className="page rise">
      <div className="eyebrow">Paths to power</div>
      <h1 className="h1">上位之路</h1>
      <p className="lede">
        他们在什么时候、因为哪一件事脱颖而出：做了什么，谁起了作用，各级台阶在几岁迈上。每人另有编者写的“可以学的”和“学不来的”两段——哪些是普通人在任何单位都用得上的做法，哪些来自出身、机遇和靠山。
      </p>
      <div className="pg-stats">
        <div>
          <b>{all.length}</b>
          <span>已整理</span>
        </div>
        <div>
          <b>{all.reduce((n, p) => n + p.turn!.turns.length, 0)}</b>
          <span>个转折点</span>
        </div>
        <div>
          <b>{all.filter((p) => p.turn!.deep).length}</b>
          <span>深度案例</span>
        </div>
        <div>
          <b>{all.reduce((n, p) => n + p.turn!.counter.length, 0)}</b>
          <span>反例</span>
        </div>
      </div>

      <Section
        title="路线"
        note="编者按履历归的类，一人可兼几条，第一条为主。点一行看名单，点下方标签筛选全页。"
        right={
          pick && (
            <button className="chip" onClick={() => go(withQuery('r', undefined))}>
              全部路线
            </button>
          )
        }
      >
        <div className="pg-two">
          <div>
            <div className="h3">主路线</div>
            <Tally rows={byMain.map((r) => ({ key: r, label: ROUTES[r], list: firstOf(r).map((p) => ({ p })), color: 'var(--gold)' }))} of={all.length} />
          </div>
          <div>
            <div className="h3">兼有</div>
            <Tally rows={routes.map((r) => ({ key: r, label: ROUTES[r], list: all.filter((p) => p.turn!.routes.includes(r)).map((p) => ({ p })) }))} of={all.length} />
          </div>
        </div>
        <div className="rise-routes" style={{ marginTop: 12 }}>
          {routes
            .filter((r) => all.some((p) => p.turn!.routes.includes(r)))
            .map((r) => (
              <a key={r} className={pick === r ? 'chip on' : 'chip'} href={withQuery('r', pick === r ? undefined : r)}>
                {ROUTES[r]}
              </a>
            ))}
        </div>
      </Section>

      <Section title="几岁上台阶" note={`每个点是一人迈上这一级的年龄，竖线为中位数。${pick ? `红点为“${ROUTES[pick]}”路线。` : ''}只计履历里写明年份的。`}>
        <AgeStrip ages={ages} mark={pick ? (id) => shown.some((p) => p.id === id) : undefined} />
      </Section>

      {deep.length > 0 && (
        <Section title="深度案例" note="转折点写得最细、附有反例的几位。">
          <div className="pg-cases">
            {deep.map((p) => (
              <a key={p.id} href={personHref(p.id)} className="card pad pg-case rise-deep">
                <span className="rise-deep-head">
                  <Portrait p={p} size={48} />
                  <span>
                    <b>{p.name}</b>
                    <span className="m">{p.turn!.routes.map((r) => ROUTES[r]).join(' · ')}</span>
                  </span>
                </span>
                <ol>
                  {p.turn!.turns.map((t, i) => (
                    <li key={i}>
                      <span className="m">{t.date.slice(0, 4)}</span> {t.h}
                    </li>
                  ))}
                </ol>
              </a>
            ))}
          </div>
        </Section>
      )}

      <Section title="转折点年表" note="所有人的转折点按年代排开，由近及远，看同一时期的人是被什么事推上去的。">
        {decades.map((d) => (
          <div key={d} className="pg-roll-year">
            <h3>{d} 年代</h3>
            <div className="rise-moments">
              {moments
                .filter((m) => Math.floor(Number(m.t.date.slice(0, 4)) / 10) * 10 === d)
                .map((m, i) => (
                  <a key={i} href={personHref(m.p.id)} className="rise-moment">
                    <Portrait p={m.p} size={30} />
                    <span>
                      <b>{m.p.name}</b> {m.t.h}
                      <span className="m">
                        {short(m.t.date)}
                        {m.age !== undefined && ` · ${m.age} 岁`}
                      </span>
                    </span>
                  </a>
                ))}
            </div>
          </div>
        ))}
        {!moments.length && <p className="muted">正在整理。</p>}
      </Section>

      <p className="small muted">
        方法：转折点取官方简历和可靠报道写明的任职与事件；“关键的人”只列有报道指明其作用的。路线分类、年龄对比与经验总结是编者分析。<a href={href('purges')}>落马者的另一面见打虎</a>。
      </p>
    </div>
  )
}
