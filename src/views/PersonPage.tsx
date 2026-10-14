import { Career } from '../components/Career'
import { Network } from '../components/Network'
import { FactionChip, Portrait, Prose, Section, Src, Srcs, Status, VoiceTag } from '../components/bits'
import { SEATS } from '../data/db'
import { QUOTE_KINDS, ROLES } from '../data/schema'
import { age, fmt, short, span } from '../lib/dates'
import { congressName } from '../lib/cn'
import { quoted } from '../lib/quotes'
import { eventHref, href } from '../lib/router'
import { useAtlas } from '../state'

export function PersonPage({ id }: { id: string }) {
  const a = useAtlas()
  const p = a.person.get(id)
  if (!p)
    return (
      <div className="page">
        <div className="empty">
          没有这个人物。<a href={href('people')}>返回人物</a>
        </div>
      </div>
    )

  const yrs = age(p.born, p.died)
  const seats = a.seats.get(p.id) ?? []
  const pbTerms = new Set(seats.filter((s) => ['gs', 'psc', 'pb'].includes(s.seat)).map((s) => s.n)).size
  const star = p.quotes.find((q) => q.star) ?? p.quotes[0]
  const events = (a.eventsOf.get(p.id) ?? []).slice().sort((x, y) => x.date.localeCompare(y.date))
  const dossier: [string, React.ReactNode][] = [
    ['出生', p.born && `${fmt(p.born)}${p.birthplace ? `，${p.birthplace}` : ''}`],
    ['逝世', p.died && fmt(p.died)],
    ['籍贯', p.origin],
    ['民族', p.ethnicity],
    ['入党', p.joinedParty && fmt(p.joinedParty)],
    ['参加工作', p.joinedWork && fmt(p.joinedWork)],
    [
      '学历',
      p.education.length > 0 &&
        p.education.map((e, i) => (
          <div key={i}>
            {e.school}
            {e.degree && ` · ${e.degree}`}
            {(e.from || e.to) && <span className="muted small"> {span(e.from, e.to)}</span>}
          </div>
        )),
    ],
    ['别名', p.aka.length > 0 && p.aka.join('、')],
    ['身份', p.roles.map((r) => ROLES[r]).join('、')],
  ]

  return (
    <div className="page">
      <section className="card phero lattice">
        <span className="ghost" aria-hidden>
          {p.name.slice(0, 1)}
        </span>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow">
            <a href={href('people')}>人物</a> · {p.roles.slice(0, 3).map((r) => ROLES[r]).join(' / ')}
          </div>
          <h1 className="bigname">{p.name}</h1>
          {p.pinyin && <div className="pinyin">{p.pinyin}</div>}
          <div className="headline">{p.headline}</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Status p={p} />
            {p.statusNote && <span className="small muted">{p.statusNote}</span>}
          </div>
          <div className="keyfacts">
            {yrs !== undefined && (
              <div>
                <b className="tnum">{yrs}</b>
                <span>{p.died ? '享年' : '岁'}</span>
              </div>
            )}
            {p.born && (
              <div>
                <b className="tnum">{p.born.slice(0, 4)}</b>
                <span>生于{p.birthplace ? ` ${p.birthplace}` : ''}</span>
              </div>
            )}
            {pbTerms > 0 && (
              <div>
                <b className="tnum">{pbTerms}</b>
                <span>届政治局</span>
              </div>
            )}
            {p.fall[0] && (
              <div>
                <b className="tnum" style={{ color: 'var(--red)' }}>
                  {p.fall[0].date.slice(0, 4)}
                </b>
                <span>落马</span>
              </div>
            )}
            {p.factions.length > 0 && (
              <div>
                <b className="tnum">{new Set(p.factions.map((t) => t.f)).size}</b>
                <span>个派系标签</span>
              </div>
            )}
          </div>
          {star && (
            <blockquote className="starquote">
              {quoted(star.text)}
              <footer>
                {star.date && `${short(star.date)} · `}
                {star.occasion && `${star.occasion} · `}
                <Src cite={star.cite} />
              </footer>
            </blockquote>
          )}
        </div>
        <div className="frame">
          <Portrait p={p} w={260} h={320} square />
          {p.photo && (
            <div className="credit">
              {p.photo.author && `摄影 ${p.photo.author} · `}
              {p.photo.license}
              {p.photo.url && (
                <>
                  {' · '}
                  <a className="src" href={p.photo.url} target="_blank" rel="noreferrer">
                    出处
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <Career p={p} />

      <div className="pbody">
        <div style={{ minWidth: 0 }}>
          <Section title="生平">
            <Prose text={p.bio} lead />
            {p.life.length > 0 && (
              <div className="life">
                {p.life.map((s, i) => (
                  <section key={i}>
                    <h4>
                      {s.h}
                      <small>{span(s.from, s.to)}</small>
                    </h4>
                    <Prose text={s.text} />
                    <div className="small">
                      <Srcs cites={s.cites} />
                    </div>
                  </section>
                ))}
              </div>
            )}
          </Section>

          {p.fall.length > 0 && (
            <Section title="落马经过">
              <div className="card pad fall">
                {p.fall.map((f, i) => (
                  <div key={i}>
                    <b>{short(f.date)}</b>
                    <span>
                      {f.text} <Src cite={f.cite} />
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Network p={p} />

          {p.quotes.length > 0 && (
            <Section title="名言" note="“流传”类未经证实，仅注明出自哪篇报道">
              <div className="quotes">
                {p.quotes.map((q, i) => (
                  <div key={i} className="card qcard">
                    <blockquote>{q.text}</blockquote>
                    {q.zh && <div className="zh">{q.zh}</div>}
                    <footer>
                      <span className={`kind ${q.kind}`}>{QUOTE_KINDS[q.kind]}</span>
                      {q.date && <span>{short(q.date)}</span>}
                      {q.occasion && <span>{q.occasion}</span>}
                      <Src cite={q.cite} />
                    </footer>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {p.assess.length > 0 && (
            <Section title="评价" note="不同立场的说法并列，不代表本站观点">
              <div className="voices">
                {p.assess.map((v, i) => (
                  <div key={i} className={`vcard${v.quote ? ' q' : ''}`} style={{ borderLeftColor: `var(--v-${v.voice})` }}>
                    <VoiceTag v={v.voice} /> <Src cite={v.cite} />
                    <p>{v.quote ? quoted(v.text) : v.text}</p>
                    {v.zh && <div className="small muted">{v.zh}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {p.family.length > 0 && (
            <Section title="家族" note="仅收录有主流调查报道的内容">
              <div className="voices">
                {p.family.map((m, i) => (
                  <div key={i} className="vcard">
                    <b className="serif">{m.name}</b> <span className="muted small">{m.rel}</span>
                    <p>{m.text}</p>
                    <div className="small">
                      <Srcs cites={m.cites} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="side">
          <div className="card pad dossier">
            <div className="h3">档案</div>
            <dl>
              {dossier
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {p.factions.length > 0 && (
            <div className="card pad">
              <div className="h3">派系标签</div>
              <div className="small muted" style={{ marginBottom: 8 }}>谁说的、原话如何</div>
              {p.factions.map((t, i) => {
                const f = a.faction.get(t.f)
                if (!f) return null
                return (
                  <div key={i} className="tagline">
                    <FactionChip f={f} />
                    {t.quote && <div className="q">{quoted(t.quote)}</div>}
                    {t.zh && <div className="zh">{t.zh}</div>}
                    <div className="small">
                      — <Src cite={t.cite} />
                      {(t.from || t.to) && <span className="muted"> · {span(t.from, t.to)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {seats.length > 0 && (
            <div className="card pad">
              <div className="h3">中央领导机构任职</div>
              {seats.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: i ? '1px solid var(--rule)' : 0, fontSize: 13.5 }}>
                  <span>{congressName(s.n)}</span>
                  <span className="muted">{s.title ?? SEATS[s.seat]}</span>
                </div>
              ))}
            </div>
          )}

          {events.length > 0 && (
            <div className="card pad">
              <div className="h3">相关事件</div>
              {events.map((e) => (
                <a key={e.id} href={eventHref(e.id)} style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: 8, padding: '6px 0', borderTop: '1px solid var(--rule)', fontSize: 13.5 }}>
                  <span className="tnum muted">{short(e.date)}</span>
                  <span>{e.title}</span>
                </a>
              ))}
            </div>
          )}

          <div className="card pad">
            <div className="h3">来源</div>
            <div className="small" style={{ display: 'grid', gap: 6 }}>
              {p.cites.map((c) => {
                const s = a.source.get(c.split('@')[0])
                return (
                  <div key={c}>
                    {s && <VoiceTag v={s.voice} />} <Src cite={c} />
                    {s && <div className="muted" style={{ fontSize: 11.5 }}>{s.title}</div>}
                  </div>
                )
              })}
            </div>
            {p.verify && <div className="small" style={{ color: 'var(--gold)', marginTop: 8 }}>部分细节有待进一步核实</div>}
          </div>
        </aside>
      </div>
    </div>
  )
}
