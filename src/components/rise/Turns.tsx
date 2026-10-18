// The 上位之路 section of a person page: the moments that lifted them, what they did, who mattered, the age
// at each rung against the others on record, and what an ordinary reader can and cannot take from it.
import { useMemo } from 'react'
import type { PersonR } from '../../data/db'
import { ROUTES, RUNGS, type Rung } from '../../data/schema'
import { short } from '../../lib/dates'
import { ageAt, median, rungAges } from '../../lib/rise'
import { href, personHref } from '../../lib/router'
import { useAtlas } from '../../state'
import { Portrait, Prose, Section, Src, Srcs } from '../bits'
import { EditorBox } from '../purges/Tally'

export function Turns({ p }: { p: PersonR }) {
  const a = useAtlas()
  const t = p.turn
  const ages = useMemo(() => rungAges(a.db.people), [a])
  if (!t) return null
  return (
    <Section id="turn" title="上位之路" note={<>什么时候、因为哪件事脱颖而出。路线分类和“可以学 / 学不来”是编者分析，其余各条均有出处。<a href={href('rise')}>看所有人的上位之路</a></>}>
      <div className="rise-routes">
        {t.routes.map((r) => (
          <a key={r} className="chip gold" href={href('rise', { r })}>
            {ROUTES[r]}
          </a>
        ))}
      </div>
      {t.rungs.length > 0 && (
        <div className="rise-ladder">
          {t.rungs.map((r) => {
            const age = ageAt(p.born, r.date)
            const peers = ages[r.rung as Rung].filter((x) => x.p.id !== p.id)
            const mid = median(peers.map((x) => x.age))
            const diff = age !== undefined && mid !== undefined && peers.length >= 3 ? Math.round(age - mid) : undefined
            return (
              <div key={r.rung} className="rise-rung">
                <span className="rise-rung-name">{RUNGS[r.rung]}</span>
                <b className="tnum">{age ?? '—'}</b>
                <span className="m">岁 · {short(r.date)}</span>
                <span className="rise-rung-post">
                  {r.post} <Src cite={r.cite} />
                </span>
                {diff !== undefined && (
                  <span className={diff < 0 ? 'rise-diff early' : diff > 0 ? 'rise-diff late' : 'rise-diff'}>
                    {diff === 0 ? '与同级中位数相同' : `比同级中位数${diff < 0 ? '早' : '晚'} ${Math.abs(diff)} 岁`}
                    <span className="m">（{peers.length} 人）</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="rise-turns">
        {t.turns.map((x, i) => (
          <article key={i} className="card pad rise-turn">
            <header>
              <span className="rise-n">{i + 1}</span>
              <div>
                <b>{x.h}</b>
                <span className="m">
                  {short(x.date)}
                  {p.born && ` · ${ageAt(p.born, x.date)} 岁`}
                </span>
              </div>
            </header>
            <Prose text={x.text} />
            <div className="rise-did">
              <span className="rise-did-label">他做了什么</span>
              <p>{x.did}</p>
            </div>
            {x.who.length > 0 && (
              <div className="rise-who">
                <span className="rise-did-label">关键的人</span>
                {x.who.map((id) => {
                  const q = a.person.get(id)
                  return q ? (
                    <a key={id} href={personHref(id)} className="case-person">
                      <Portrait p={q} size={28} />
                      {q.name}
                    </a>
                  ) : null
                })}
              </div>
            )}
            <div className="small">
              <Srcs cites={x.cites} />
            </div>
          </article>
        ))}
      </div>
      <div className="pg-two">
        <EditorBox title="编者分析 · 可以学的" text={t.can.text} cites={t.can.cites} />
        <EditorBox title="编者分析 · 学不来的" text={t.cannot.text} cites={t.cannot.cites} />
      </div>
      {t.counter.length > 0 && (
        <div className="rise-counter">
          <div className="h3">同路而不同命</div>
          {t.counter.map((c) => {
            const q = c.id ? a.person.get(c.id) : undefined
            return (
              <div key={c.id ?? c.name} className="rise-counter-row">
                {q ? (
                  <a href={personHref(q.id)} className="case-person">
                    <Portrait p={q} size={32} />
                    {q.name}
                  </a>
                ) : (
                  <b>{c.name}</b>
                )}
                <span>
                  {c.text} <Src cite={c.cite} />
                </span>
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}
