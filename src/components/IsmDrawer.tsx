// The ism drawer, opened from any page with ?m=<ism id>.
import { useEffect } from 'react'
import { ISM_KINDS } from '../data/schema'
import { fmt } from '../lib/dates'
import { describe, ismColor } from '../lib/isms'
import { quoted } from '../lib/quotes'
import { conceptHref, go, ismHref, withQuery } from '../lib/router'
import { useAtlas } from '../state'
import { PersonChip, Prose, Src, Srcs, VoiceTag } from './bits'

export function IsmDrawer({ id }: { id: string }) {
  const a = useAtlas()
  const m = a.ism.get(id)
  const close = () => go(withQuery('m', undefined))
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === 'Escape' && close()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })
  if (!m) return null
  const kids = a.db.isms.filter((x) => x.parents.includes(m.id))
  const foes = a.db.isms.filter((x) => x.against.includes(m.id))
  const chip = (ids: string[]) =>
    ids.map((k) => {
      const x = a.ism.get(k)
      return x ? (
        <a key={k} className="chip" href={ismHref(k)}>
          <span className="dot" style={{ background: ismColor(x.kind) }} />
          {x.name}
        </a>
      ) : null
    })
  return (
    <>
      <div className="drawer-back" onClick={close} />
      <aside className="drawer" role="dialog" aria-label={m.name}>
        <button className="iconbtn close" onClick={close} aria-label="关闭">
          ✕
        </button>
        <div className="eyebrow" style={{ color: ismColor(m.kind) }}>
          {ISM_KINDS[m.kind]} · {fmt(m.from)} — {m.to ? fmt(m.to) : '今'}
        </div>
        <h2>{m.name}</h2>
        {m.en && <div className="small muted">{m.en}</div>}
        <Prose text={m.summary} />
        {m.concept && (
          <a className="chip gold" href={conceptHref(m.concept)} style={{ marginTop: 10 }}>
            思想条目：{a.name(m.concept)}
          </a>
        )}
        {!!m.carriers.length && (
          <>
            <h4 className="drawer-h">代表人物</h4>
            <div className="chips">{m.carriers.map((p) => <PersonChip key={p} id={p} />)}</div>
          </>
        )}
        {!!(m.parents.length || kids.length) && (
          <>
            <h4 className="drawer-h">源流</h4>
            {!!m.parents.length && <div className="chips">来自 {chip(m.parents)}</div>}
            {!!kids.length && <div className="chips" style={{ marginTop: 6 }}>衍生 {chip(kids.map((x) => x.id))}</div>}
          </>
        )}
        {!!(m.against.length || foes.length) && (
          <>
            <h4 className="drawer-h">对立</h4>
            {!!m.against.length && <div className="chips">针对 {chip(m.against)}</div>}
            {!!foes.length && <div className="chips" style={{ marginTop: 6 }}>被针对 {chip(foes.map((x) => x.id))}</div>}
          </>
        )}
        {!!m.pos.length && (
          <>
            <h4 className="drawer-h">光谱位置</h4>
            <div className="fall">
              {m.pos.map((p) => (
                <div key={p.at}>
                  <b>{p.at}</b>
                  <span>
                    {describe(p)}
                    {p.note && <span className="muted"> · {p.note}</span>}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        {!!m.voices.length && (
          <div className="voices" style={{ marginTop: 18 }}>
            {m.voices.map((v, i) => (
              <div key={i} className={`vcard${v.quote ? ' q' : ''}`} style={{ borderLeftColor: `var(--v-${v.voice})` }}>
                <VoiceTag v={v.voice} /> <Src cite={v.cite} />
                <p>{v.quote ? quoted(v.text) : v.text}</p>
                {v.zh && <div className="small muted">{v.zh}</div>}
              </div>
            ))}
          </div>
        )}
        <hr className="goldrule" />
        <div className="small muted">
          来源：<Srcs cites={m.cites} />
        </div>
      </aside>
    </>
  )
}
