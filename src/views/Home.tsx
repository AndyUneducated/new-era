import { useMemo } from 'react'
import { Portrait, Section, Src } from '../components/bits'
import { CcFalls } from '../components/CcFalls'
import { Hemicycle, layout } from '../components/Hemicycle'
import { Seal } from '../components/Seal'
import { Story } from '../components/story/Story'
import { FRAMES, type Frame } from '../data/schema'
import { short, today } from '../lib/dates'
import { cnNum, congressName } from '../lib/cn'
import { quoted } from '../lib/quotes'
import { href, personHref, useKept } from '../lib/router'
import { useAtlas } from '../state'

export function Home() {
  const a = useAtlas()
  const cs = a.db.congresses
  const [n, setN] = useKept(cs.at(-1)?.n ?? 20)
  const [chosen, setFrame] = useKept<Frame | null>(null)
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

  const quotes = a.db.people.reduce((s, p) => s + p.quotes.length, 0)

  return (
    <>
      <section className="cover lattice">
        <div className="cover-inner">
          <div className="eyebrow">China&apos;s politics since 2000 · 2000 年以来的中国大陆政治</div>
          <h1>
            新<i>时</i>代
          </h1>
          <p className="lede">
            从江泽民交班到习近平第三个任期：谁坐在政治局里，各国媒体说他们属于哪一派，发生了什么，官方提出了什么思想。每一句引文都可以点回原始出处；传闻来源单独标出。
          </p>
          <div className="cover-docno">
            <span>政治档案</span>
            <b className="tnum">〔2002—{today().slice(0, 4)}〕</b>
            <span>{cnNum(a.db.story.length)}章</span>
          </div>
          <div className="cover-cue" aria-hidden>
            向下滚动
            <i />
          </div>
        </div>
        <span className="cover-seal" aria-hidden>
          <Seal text="新时代" size={118} tilt={-12} />
        </span>
      </section>

      <Story />

      <section className="hero lattice">
        <div className="hero-inner">
          <div className="hero-title">
            <div>
              <div className="eyebrow">Seats</div>
              <h2 className="h1" style={{ margin: '6px 0 0' }}>逐届席位</h2>
              <p className="lede">十五届到二十届政治局，按所选框架里各家媒体的派系标注着色；点人进入传记。</p>
            </div>
            <div className="hero-controls">
              <div className="seg" role="tablist" aria-label="届别">
                {[...cs].reverse().map((x) => (
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

        <Section title="各届中委落马率" note="十五届以来每一位中央委员与候补委员一格，按落马时间排在前面；任内落马指在下一届党代会召开之前">
          <div className="card pad">
            <CcFalls />
          </div>
        </Section>

        <section className="section pillars">
          {[
            ['people', '人物', '常委、政治局、军委、落马官员、异见者、企业家与港澳台人物。传记、履历、名言与照片。'],
            ['factions', '派系', '五套框架并列：团派与太子党、精英与民粹、习家军、被清洗集团、军中派系。标签注明出自哪家媒体。'],
            ['provinces', '诸侯', '三十一省的书记与省长逐年着色：谁的旧部坐满了哪片地图，哪些省份的主官接连落马。'],
            ['purges', '打虎', '四百多名落马者按月排开：十八大后的第一波以省部级和政法、石油系统为主，二〇二三年起转向军队。'],
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
                <div className="serif" style={{ fontSize: 20, lineHeight: 1.6 }}>{quoted(quote.q.text)}</div>
                <div className="small muted" style={{ marginTop: 6 }}>
                  — <a href={personHref(quote.p.id)}>{quote.p.name}</a>
                  {quote.q.date && `，${short(quote.q.date)}`}
                  {quote.q.occasion && `，${quote.q.occasion}`} · <Src cite={quote.q.cite} />
                </div>
              </div>
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
    </>
  )
}
