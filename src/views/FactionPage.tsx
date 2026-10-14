import { PersonChip, Portrait, Prose, Section, Src, Srcs, Status, VoiceTag } from '../components/bits'
import { SeatShare } from '../components/charts'
import { FRAMES, VOICES, type Voice } from '../data/schema'
import { short, span } from '../lib/dates'
import { eventHref, factionHref, href, personHref } from '../lib/router'
import { useAtlas } from '../state'

export function FactionPage({ id }: { id: string }) {
  const a = useAtlas()
  const f = a.faction.get(id)
  if (!f)
    return (
      <div className="page">
        <div className="empty">
          没有这个派系。<a href={href('factions')}>返回派系</a>
        </div>
      </div>
    )
  const tagged = a.members.get(f.id) ?? []
  const byPerson = new Map<string, typeof tagged>()
  for (const m of tagged) byPerson.set(m.p.id, [...(byPerson.get(m.p.id) ?? []), m])
  const core = f.core.filter((c) => a.person.has(c))
  const order = [...new Set([...core, ...tagged.map((m) => m.p.id)])]
  const voiceCount = new Map<Voice, number>()
  for (const m of tagged) {
    const v = a.source.get(m.tag.cite.split('@')[0])?.voice
    if (v) voiceCount.set(v, (voiceCount.get(v) ?? 0) + 1)
  }
  const events = (a.eventsOf.get(f.id) ?? []).slice().sort((x, y) => x.date.localeCompare(y.date))
  const siblings = a.db.factions.filter((x) => x.frame === f.frame && x.id !== f.id)

  return (
    <div className="page">
      <section className="card phero lattice" style={{ gridTemplateColumns: '1fr', borderTop: `4px solid ${f.color}` }}>
        <span className="ghost" aria-hidden style={{ right: 30, color: f.color }}>
          {f.name.slice(0, 1)}
        </span>
        <div style={{ position: 'relative' }}>
          <div className="eyebrow">
            <a href={href('factions')}>派系</a> · {FRAMES[f.frame].name}
          </div>
          <h1 className="bigname">{f.name}</h1>
          <div className="pinyin">
            {f.en}
            {f.aka.length > 0 && ` · ${f.aka.join(' · ')}`}
          </div>
          <div className="headline">
            <span className="chip gold">{f.basis}</span> {(f.from || f.to) && <span className="muted small">{span(f.from, f.to)}</span>}
          </div>
          <div className="keyfacts">
            <div>
              <b className="tnum">{order.length}</b>
              <span>人</span>
            </div>
            <div>
              <b className="tnum">{tagged.length}</b>
              <span>条标签</span>
            </div>
            <div>
              <b className="tnum">{new Set(tagged.map((m) => a.source.get(m.tag.cite.split('@')[0])?.publisher)).size}</b>
              <span>家来源</span>
            </div>
          </div>
          {voiceCount.size > 0 && (
            <div className="chips" style={{ marginTop: 14 }}>
              {[...voiceCount].map(([v, n]) => (
                <span key={v} className="chip">
                  <span className="dot" style={{ background: `var(--v-${v})` }} />
                  {VOICES[v]} {n}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="pbody">
        <div style={{ minWidth: 0 }}>
          <Section title="概述">
            <Prose text={f.summary} lead />
            <div className="small">
              <Srcs cites={f.cites} />
            </div>
          </Section>

          {f.voices.length > 0 && (
            <Section title="各方说法">
              <div className="voices">
                {f.voices.map((v, i) => (
                  <div key={i} className={`vcard${v.quote ? ' q' : ''}`} style={{ borderLeftColor: `var(--v-${v.voice})` }}>
                    <VoiceTag v={v.voice} /> <Src cite={v.cite} />
                    <p>{v.quote ? `“${v.text}”` : v.text}</p>
                    {v.zh && <div className="small muted">{v.zh}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="成员" note="核心人物在前；每人附上作出判断的来源原句">
            <div className="members">
              {order.map((pid) => {
                const p = a.person.get(pid)!
                const tags = byPerson.get(pid) ?? []
                return (
                  <div key={pid} className="card mcard">
                    <a href={personHref(pid)}>
                      <Portrait p={p} size={52} />
                    </a>
                    <div style={{ minWidth: 0 }}>
                      <a href={personHref(pid)}>
                        <b>{p.name}</b>
                      </a>{' '}
                      {core.includes(pid) && <span className="chip red" style={{ fontSize: 11 }}>核心</span>} <Status p={p} />
                      <div className="small muted">{p.headline}</div>
                      {tags.map(({ tag }, i) => (
                        <div key={i}>
                          {tag.quote && <div className="q">“{tag.quote}”</div>}
                          {tag.zh && <div className="q muted">{tag.zh}</div>}
                          <div className="small">
                            — <Src cite={tag.cite} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {!order.length && <div className="empty">尚无成员标注</div>}
          </Section>

          <Section title="政治局席位" note={`本派在历届政治局中的位置，同框架其他派系淡化显示`}>
            <div className="card pad">
              <SeatShare frame={f.frame} highlight={f.id} />
            </div>
          </Section>
        </div>

        <aside className="side">
          {core.length > 0 && (
            <div className="card pad">
              <div className="h3">核心人物</div>
              <div className="chips">
                {core.map((c) => (
                  <PersonChip key={c} id={c} />
                ))}
              </div>
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
          {siblings.length > 0 && (
            <div className="card pad">
              <div className="h3">同框架</div>
              <div className="chips">
                {siblings.map((s) => (
                  <a key={s.id} className="chip" href={factionHref(s.id)}>
                    <span className="dot" style={{ background: s.color }} />
                    {s.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
