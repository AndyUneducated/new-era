// The event drawer, opened from any page with ?e=<event id>.
import { useEffect } from 'react'
import { LANES } from '../data/schema'
import { fmt } from '../lib/dates'
import { conceptHref, go, withQuery } from '../lib/router'
import { useAtlas } from '../state'
import { FactionChip, PersonChip, Prose, Src, Srcs, VoiceTag } from './bits'

export function EventDrawer({ id }: { id: string }) {
  const a = useAtlas()
  const e = a.event.get(id)
  const close = () => go(withQuery('e', undefined))
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === 'Escape' && close()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })
  if (!e) return null
  return (
    <>
      <div className="drawer-back" onClick={close} />
      <aside className="drawer" role="dialog" aria-label={e.title}>
        <button className="iconbtn close" onClick={close} aria-label="关闭">
          ✕
        </button>
        <div className="eyebrow">
          {LANES[e.lane]} · {fmt(e.date)}
          {e.end ? ` — ${fmt(e.end)}` : ''}
        </div>
        <h2>{e.title}</h2>
        <Prose text={e.summary} />
        {!!e.people.length && (
          <div className="chips" style={{ margin: '14px 0' }}>
            {e.people.map((p) => (
              <PersonChip key={p} id={p} />
            ))}
          </div>
        )}
        {!!(e.factions.length || e.concepts.length) && (
          <div className="chips" style={{ margin: '0 0 14px' }}>
            {e.factions.map((f) => {
              const x = a.faction.get(f)
              return x ? <FactionChip key={f} f={x} /> : null
            })}
            {e.concepts.map((c) => (
              <a key={c} className="chip gold" href={conceptHref(c)}>
                {a.name(c)}
              </a>
            ))}
          </div>
        )}
        {!!e.voices.length && (
          <div className="voices" style={{ marginTop: 18 }}>
            {e.voices.map((v, i) => (
              <div key={i} className={`vcard${v.quote ? ' q' : ''}`} style={{ borderLeftColor: `var(--v-${v.voice})` }}>
                <VoiceTag v={v.voice} /> <Src cite={v.cite} />
                <p>{v.quote ? `“${v.text}”` : v.text}</p>
                {v.zh && <div className="small muted">{v.zh}</div>}
              </div>
            ))}
          </div>
        )}
        <hr className="goldrule" />
        <div className="small muted">
          来源：<Srcs cites={e.cites} />
        </div>
        {e.verify && <div className="small" style={{ color: 'var(--gold)', marginTop: 6 }}>部分细节有待进一步核实</div>}
      </aside>
    </>
  )
}
