import { PersonChip, Prose, Section, Src, Srcs, VoiceTag } from '../components/bits'
import { Bars } from '../components/Heat'
import { CONCEPT_KINDS } from '../data/schema'
import { cnNum } from '../lib/cn'
import { fmt, short, span } from '../lib/dates'
import { useMore } from '../lib/more'
import { quoted } from '../lib/quotes'
import { conceptHref, eventHref, href } from '../lib/router'
import { useAtlas } from '../state'

export function ConceptPage({ id }: { id: string }) {
  const a = useAtlas()
  const more = useMore()
  const c = a.concept.get(id)
  if (!c)
    return (
      <div className="page">
        <div className="empty">
          没有这个条目。<a href={href('ideas')}>返回思想</a>
        </div>
      </div>
    )
  const parent = c.parent ? a.concept.get(c.parent) : undefined
  const kids = a.db.concepts.filter((x) => x.parent === c.id)
  const congress = a.db.corpus.filter((d) => d.kind === 'congress')
  const gov = a.db.corpus.filter((d) => d.kind === 'gov')
  const counted = (docs: typeof congress) => docs.some((d) => d.counts[c.id])
  const events = (a.eventsOf.get(c.id) ?? []).slice().sort((x, y) => y.date.localeCompare(x.date))
  const steps = [
    ...(c.first ? [{ date: c.first.date, where: '首次出现', text: c.first.text, quote: c.first.quote, cite: c.first.cite }] : []),
    ...c.codified.map((x) => ({ date: x.date, where: x.where, text: '', quote: x.quote, cite: x.cite })),
  ].sort((x, y) => x.date.localeCompare(y.date))

  return (
    <div className="page">
      <section className="card phero lattice" style={{ gridTemplateColumns: '1fr' }}>
        <span className="ghost" aria-hidden style={{ right: 30 }}>
          {c.name.slice(0, 1)}
        </span>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow">
            <a href={href('ideas')}>思想</a> · {CONCEPT_KINDS[c.kind]}
            {parent && (
              <>
                {' · '}
                <a href={conceptHref(parent.id)}>{parent.name}</a>
              </>
            )}
          </div>
          <h1 className="bigname" style={{ fontSize: c.name.length > 10 ? 36 : 48 }}>{c.name}</h1>
          {c.en && <div className="pinyin">{c.en}</div>}
          {c.by.length > 0 && (
            <div className="chips" style={{ marginTop: 14 }}>
              {c.by.map((p) => (
                <PersonChip key={p} id={p} />
              ))}
            </div>
          )}
          {c.quote && (
            <blockquote className="starquote">
              {quoted(c.quote.text)}
              <footer>
                <Src cite={c.quote.cite} />
              </footer>
            </blockquote>
          )}
        </div>
      </section>

      <div className="pbody">
        <div style={{ minWidth: 0 }}>
          <Section title="释义">
            <Prose text={c.summary} lead />
            <div className="small">
              <Srcs cites={c.cites} />
            </div>
          </Section>

          {!more && (
            <Section title="详解">
              <p className="muted">载入中</p>
            </Section>
          )}
          {c.sections.length > 0 && (
            <Section title="详解">
              <div className="life">
                {c.sections.map((s, i) => (
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
            </Section>
          )}

          {c.lists.map((l) => (
            <Section key={l.title} title={l.title} note={<>原文逐条 · <Src cite={l.cite} /></>}>
              <ol className="cp-list">
                {l.items.map((t, i) => (
                  <li key={i}>
                    <span className="cp-n">{cnNum(i + 1)}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </Section>
          ))}

          {c.sides.length > 0 && (
            <Section title="各方立场" note="论争各方的主张、代表人物与出处，并列而不评判">
              <div className="cp-sides">
                {c.sides.map((s) => (
                  <div key={s.label} className="card pad cp-side">
                    <b className="serif">{s.label}</b>
                    <Prose text={s.text} />
                    {s.who.length > 0 && (
                      <div className="chips">
                        {s.who.map((p) => (
                          <PersonChip key={p} id={p} />
                        ))}
                      </div>
                    )}
                    <div className="small">
                      <Srcs cites={s.cites} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {c.policies.length > 0 && (
            <Section
              title="从思想到政策"
              note={
                <>
                  这一提法落成了哪些政策，政策又引出了哪些事件。<a href={href('ideas/chain')}>所有提法的落地图</a>
                </>
              }
            >
              <div className="cp-chain">
                {c.policies.map((x, i) => (
                  <div key={i} className="cp-policy">
                    <span className="tnum muted">{short(x.date)}</span>
                    <div>
                      <b>{x.name}</b>
                      <p>
                        {x.text} <Src cite={x.cite} />
                      </p>
                      {x.events.length > 0 && (
                        <div className="chips">
                          {x.events.map((id) => {
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
            </Section>
          )}

          {steps.length > 0 && (
            <Section title="从提出到写入" note="首次出现与写入党章、宪法、决议的原文">
              <div className="life">
                {steps.map((s, i) => (
                  <section key={i}>
                    <h4>
                      {s.where}
                      <small>{fmt(s.date)}</small>
                    </h4>
                    {s.text && <p>{s.text}</p>}
                    {s.quote && <p className="serif" style={{ color: 'var(--ink-2)' }}>{quoted(s.quote)}</p>}
                    <div className="small">
                      <Src cite={s.cite} />
                    </div>
                  </section>
                ))}
              </div>
            </Section>
          )}

          {(counted(congress) || counted(gov)) && (
            <Section title="词频" note={`计数词：${(c.terms.length ? c.terms : [c.name]).join('、')}；柱高为每万字次数，柱顶数字为原始次数`}>
              {counted(congress) && (
                <div className="card pad" style={{ marginBottom: 12 }}>
                  <div className="small muted" style={{ marginBottom: 6 }}>党代会报告</div>
                  <Bars id={c.id} docs={congress} />
                </div>
              )}
              {counted(gov) && (
                <div className="card pad">
                  <div className="small muted" style={{ marginBottom: 6 }}>政府工作报告</div>
                  <Bars id={c.id} docs={gov} />
                </div>
              )}
            </Section>
          )}

          {c.voices.length > 0 && (
            <Section title="各方解读">
              <div className="voices">
                {c.voices.map((v, i) => (
                  <div key={i} className={`vcard${v.quote ? ' q' : ''}`} style={{ borderLeftColor: `var(--v-${v.voice})` }}>
                    <VoiceTag v={v.voice} /> <Src cite={v.cite} />
                    <p>{v.quote ? quoted(v.text) : v.text}</p>
                    {v.zh && <div className="small muted">{v.zh}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <aside className="side">
          {(kids.length > 0 || c.related.length > 0) && (
            <div className="card pad">
              {kids.length > 0 && (
                <>
                  <div className="h3">下属提法</div>
                  <div className="chips" style={{ marginBottom: 12 }}>
                    {kids.map((k) => (
                      <a key={k.id} className="chip gold" href={conceptHref(k.id)}>
                        {k.name}
                      </a>
                    ))}
                  </div>
                </>
              )}
              {c.related.length > 0 && (
                <>
                  <div className="h3">相关</div>
                  <div className="chips">
                    {c.related.filter((r) => a.concept.has(r)).map((r) => (
                      <a key={r} className="chip" href={conceptHref(r)}>
                        {a.name(r)}
                      </a>
                    ))}
                  </div>
                </>
              )}
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
        </aside>
      </div>
    </div>
  )
}
