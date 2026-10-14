import { useMemo, useState } from 'react'
import { Portrait, Section, Src } from '../components/bits'
import { Hemicycle, layout } from '../components/Hemicycle'
import { FRAMES, LANES, type Frame } from '../data/schema'
import { short, today } from '../lib/dates'
import { cnNum, congressName } from '../lib/cn'
import { eventHref, href, personHref } from '../lib/router'
import { useAtlas } from '../state'

export function Home() {
  const a = useAtlas()
  const cs = a.db.congresses
  const [n, setN] = useState(cs.at(-1)?.n ?? 20)
  const [chosen, setFrame] = useState<Frame | null>(null)
  const c = a.congress.get(n)
  const frame: Frame = chosen ?? (n >= 19 ? 'xi' : 'classic')

  const legend = useMemo(() => {
    if (!c) return []
    const m = new Map<string, { name: string; color: string; n: number }>()
    let none = 0
    for (const s of layout(c, (id) => a.person.get(id))) {
      const f = a.factionIn(s.p, frame)
      if (!f) none++
      else m.set(f.id, { name: f.name, color: f.color, n: (m.get(f.id)?.n ?? 0) + 1 })
    }
    const out = [...m.values()].sort((x, y) => y.n - x.n)
    if (none) out.push({ name: '未标注', color: 'var(--rule-2)', n: none })
    return out
  }, [a, c, frame])

  const quote = useMemo(() => {
    const stars = a.db.people.flatMap((p) => p.quotes.filter((q) => q.star).map((q) => ({ p, q })))
    return stars[Number(today().slice(8)) % Math.max(stars.length, 1)]
  }, [a])

  const recent = a.db.events.filter((e) => e.major).slice(-8).reverse()
  const quotes = a.db.people.reduce((s, p) => s + p.quotes.length, 0)

  return (
    <>
      <section className="hero lattice">
        <div className="hero-inner">
          <div className="hero-title">
            <div>
              <div className="eyebrow">China&apos;s politics since 2000 · 2000 年以来的中国大陆政治</div>
              <h1>
                新<i>时</i>代
              </h1>
              <p className="lede">
                从江泽民交班到习近平第三个任期：谁坐在政治局里，各国媒体说他们属于哪一派，发生了什么，官方提出了什么思想。每一句引文都可以点回原始出处。
              </p>
            </div>
            <div className="hero-controls">
              <div className="seg" role="tablist" aria-label="届别">
                {cs.map((x) => (
                  <button key={x.n} className={x.n === n ? 'on' : undefined} onClick={() => setN(x.n)}>
                    {cnNum(x.n)}届
                  </button>
                ))}
              </div>
              <div className="seg" role="tablist" aria-label="派系框架">
                {(Object.keys(FRAMES) as Frame[]).map((f) => (
                  <button key={f} className={f === frame ? 'on' : undefined} onClick={() => setFrame(f)} title={FRAMES[f].name}>
                    {FRAMES[f].short}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {c ? (
            <>
              <Hemicycle c={c} frame={frame} />
              <div className="legend">
                {legend.map((l) => (
                  <span key={l.name}>
                    <i style={{ background: l.color }} />
                    {l.name} <b className="tnum">{l.n}</b>
                  </span>
                ))}
              </div>
              <CongressFoot n={n} />
            </>
          ) : (
            <div className="empty" style={{ marginTop: 24 }}>届别数据尚未载入</div>
          )}
        </div>
      </section>

      <div className="page">
        <div className="stats">
          {[
            [a.db.people.length, '人物'],
            [a.db.people.filter((p) => p.tier === 1).length, '完整传记'],
            [a.db.factions.length, '派系'],
            [a.db.events.length, '事件'],
            [a.db.concepts.length, '思想概念'],
            [quotes, '名言'],
            [a.db.sources.length, '来源'],
          ].map(([v, l]) => (
            <div key={l} className="card stat">
              <b className="tnum">{v}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>

        <section className="section pillars">
          {[
            ['people', '人物', '常委、政治局、军委、落马官员、异见者、企业家与港澳台人物。传记、履历、名言与照片。'],
            ['factions', '派系', '五套框架并列：团派与太子党、精英与民粹、习家军、被清洗集团、军中派系。标签注明出自哪家媒体。'],
            ['timeline', '时间线', '十一条泳道，从 1989 年的前史到当下：人事、清洗、军队、意识形态、经济、社会、港澳台、外交与民间话语。'],
            ['ideas', '思想', '从“三个代表”到习近平思想：提法何时出现、何时写入党章，以及历次报告中的词频起落。'],
          ].map(([k, t, d], i) => (
            <a key={k} className="card pillar" href={href(k)}>
              <span className="num">{cnNum(i + 1)}</span>
              <h3>{t}</h3>
              <p>{d}</p>
              <div className="go">进入 →</div>
            </a>
          ))}
        </section>

        {quote && (
          <Section title="今日一句" note="名言库中标星的引文，按日期轮换">
            <div className="card pad" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <a href={personHref(quote.p.id)}>
                <Portrait p={quote.p} size={72} />
              </a>
              <div>
                <div className="serif" style={{ fontSize: 20, lineHeight: 1.6 }}>“{quote.q.text}”</div>
                <div className="small muted" style={{ marginTop: 6 }}>
                  — <a href={personHref(quote.p.id)}>{quote.p.name}</a>
                  {quote.q.date && `，${short(quote.q.date)}`}
                  {quote.q.occasion && `，${quote.q.occasion}`} · <Src cite={quote.q.cite} />
                </div>
              </div>
            </div>
          </Section>
        )}

        {!!recent.length && (
          <Section title="近期大事" note="时间线中标为重大的最近事件" right={<a className="chip" href={href('timeline')}>完整时间线 →</a>}>
            <div className="card" style={{ padding: '6px 0' }}>
              {recent.map((e) => (
                <a key={e.id} href={eventHref(e.id)} style={{ display: 'grid', gridTemplateColumns: '110px 96px 1fr', gap: 12, padding: '10px 22px', borderTop: '1px solid var(--rule)' }}>
                  <span className="tnum muted">{short(e.date)}</span>
                  <span className="small" style={{ color: 'var(--gold)' }}>{LANES[e.lane]}</span>
                  <span>{e.title}</span>
                </a>
              ))}
            </div>
          </Section>
        )}
      </div>
    </>
  )
}

// the military commission and the mid-term changes of the chosen congress
function CongressFoot({ n }: { n: number }) {
  const a = useAtlas()
  const c = a.congress.get(n)!
  const out = new Set(c.changes.filter((x) => x.kind !== 'in').map((x) => x.person))
  return (
    <>
      {!!c.cmc.length && (
        <div className="cmc-strip">
          <span className="lbl">{congressName(n)}军委</span>
          {c.cmc.map((m) => {
            const p = a.person.get(m.id)
            return p ? (
              <a key={m.id} href={personHref(m.id)} className={out.has(m.id) ? 'out' : undefined} title={m.title}>
                <Portrait p={p} size={26} />
                {p.name}
                <span className="muted">{m.title.replace('中央军委', '')}</span>
              </a>
            ) : null
          })}
        </div>
      )}
      {!!c.changes.length && (
        <div style={{ maxWidth: 820, margin: '18px auto 0', fontSize: 13 }}>
          <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 6 }}>届内变动</div>
          {c.changes.map((x, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: 10, padding: '4px 0', borderTop: '1px dashed var(--rule)' }}>
              <span className="tnum" style={{ color: x.kind === 'in' ? 'var(--jade)' : 'var(--red)' }}>{short(x.date)}</span>
              <span>
                <a href={personHref(x.person)} style={{ fontWeight: 600 }}>{a.name(x.person)}</a> {x.text} <Src cite={x.cite} />
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
