import { Portrait, Prose, Section, Src, Srcs, VoiceTag } from '../components/bits'
import { EditorBox } from '../components/purges/Tally'
import { CASE_KINDS } from '../data/schema'
import { short, span } from '../lib/dates'
import { eventHref, href, personHref } from '../lib/router'
import { useAtlas } from '../state'

export function CasePage({ id }: { id: string }) {
  const a = useAtlas()
  const k = a.db.cases.find((x) => x.id === id)
  if (!k)
    return (
      <div className="page">
        <div className="empty">
          没有这篇专题。<a href={href('purges')}>返回打虎</a>
        </div>
      </div>
    )
  const people = k.people.map((x) => a.person.get(x)).filter((p) => p !== undefined)
  const events = k.events.map((x) => a.event.get(x)).filter((e) => e !== undefined)
  return (
    <div className="page casepage">
      <div className="eyebrow">
        <a href={href('purges')}>打虎</a> · {CASE_KINDS[k.kind]} · {k.years}
      </div>
      <h1 className="h1">{k.title}</h1>
      <p className="lede">{k.summary}</p>
      <div className="case-people">
        {people.map((p) => (
          <a key={p.id} href={personHref(p.id)} className="case-person" title={p.headline}>
            <Portrait p={p} size={44} />
            <b>{p.name}</b>
          </a>
        ))}
      </div>

      <div className="pbody">
        <div style={{ minWidth: 0 }}>
          <Section title="经过">
            {k.lead && <Prose text={k.lead} lead />}
            <div className="life">
              {k.sections.map((s, i) => (
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
          {k.editor.length > 0 && (
            <Section title="编者分析" note="本站对材料的解读，与上文有出处的事实分开；每段注明依据">
              {k.editor.map((e, i) => (
                <EditorBox key={i} text={e.text} cites={e.cites} />
              ))}
            </Section>
          )}
          {k.voices.length > 0 && (
            <Section title="各方说法" note="不同立场并列，传闻类已标注">
              <div className="voices">
                {k.voices.map((v, i) => (
                  <div key={i} className="vcard" style={{ borderLeftColor: `var(--v-${v.voice})` }}>
                    <VoiceTag v={v.voice} /> <Src cite={v.cite} />
                    <p>{v.text}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
        <aside className="side">
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
              {k.cites.map((c) => (
                <div key={c}>
                  <Src cite={c} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
