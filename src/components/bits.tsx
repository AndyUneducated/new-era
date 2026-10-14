// Small shared pieces: portraits, source links, status, chips, tooltips.
import { useState, type ReactNode } from 'react'
import type { PersonR } from '../data/db'
import { STATUS, VOICES, type Faction, type Voice } from '../data/schema'
import { fmt } from '../lib/dates'
import { factionHref, personHref } from '../lib/router'
import { useAtlas } from '../state'

const FALLEN = new Set(['purged', 'detained'])

export function Portrait({ p, size = 56, square, w, h }: { p: PersonR; size?: number; square?: boolean; w?: number; h?: number }) {
  const [broken, setBroken] = useState(false)
  const src = p.photo?.src && !broken ? p.photo.src : undefined
  const width = w ?? size
  const height = h ?? size
  return (
    <span className={`portrait${square ? ' square' : ''}${FALLEN.has(p.status) ? ' fallen' : ''}`} style={{ width, height }}>
      {src ? (
        <img src={src} alt={p.name} loading="lazy" style={{ objectPosition: p.photo?.focus ?? '50% 25%' }} onError={() => setBroken(true)} />
      ) : (
        <span className="initial" style={{ fontSize: Math.min(width, height) * 0.42 }}>
          {p.name.slice(0, 1)}
        </span>
      )}
    </span>
  )
}

export function Status({ p }: { p: PersonR }) {
  return <span className={`status ${p.status}`}>{STATUS[p.status]}</span>
}

export function VoiceTag({ v }: { v: Voice }) {
  return <span className={`voice voice-${v}`}>{VOICES[v]}</span>
}

// one cite: "source-id" or "source-id@anchor"
export function Src({ cite }: { cite: string }) {
  const a = useAtlas()
  const [id, anchor] = cite.split('@')
  const s = a.source.get(id)
  if (!s) return <span className="src">{id}</span>
  const label = s.publisher ?? s.title
  return (
    <a
      className={s.rumor ? 'src rumor' : 'src'}
      href={s.url}
      target="_blank"
      rel="noreferrer"
      title={`${s.rumor ? '传闻来源，未经可靠媒体证实 · ' : ''}${s.title}${s.date ? ` · ${fmt(s.date)}` : ''}${anchor ? ` · ${anchor}` : ''}`}
    >
      {s.rumor && <span className="rumor-mark">传闻</span>}
      {label}
      {s.date ? ` ${s.date.slice(0, 4)}` : ''}
    </a>
  )
}

// a voice, tag or quote resting on a rumor source carries this next to its text
export function RumorMark({ cite }: { cite: string }) {
  const a = useAtlas()
  return a.source.get(cite.split('@')[0])?.rumor ? <span className="rumor-mark" title="传闻来源，未经可靠媒体证实">传闻</span> : null
}

export function Srcs({ cites }: { cites: string[] }) {
  if (!cites.length) return null
  return (
    <span className="srcs">
      {cites.map((c) => (
        <Src key={c} cite={c} />
      ))}
    </span>
  )
}

export function PersonChip({ id }: { id: string }) {
  const a = useAtlas()
  const p = a.person.get(id)
  if (!p) return <span className="chip">{id}</span>
  return (
    <a className="chip" href={personHref(id)} style={{ paddingLeft: 3 }}>
      <Portrait p={p} size={20} />
      {p.name}
    </a>
  )
}

export function FactionChip({ f }: { f: Faction }) {
  return (
    <a className="chip" href={factionHref(f.id)}>
      <span className="dot" style={{ background: f.color }} />
      {f.name}
    </a>
  )
}

export interface TipState { x: number; y: number; body: ReactNode }

export function useTip() {
  const [tip, setTip] = useState<TipState | null>(null)
  const show = (e: { clientX: number; clientY: number }, body: ReactNode) => setTip({ x: e.clientX, y: e.clientY, body })
  const hide = () => setTip(null)
  const node = tip ? (
    <div className="tip" style={{ left: Math.min(tip.x + 14, innerWidth - 310), top: tip.y + 14 }}>
      {tip.body}
    </div>
  ) : null
  return { node, show, hide }
}

export function Section({ title, note, children, right }: { title: string; note?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2 className="h2">{title}</h2>
          {note && <p>{note}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

// split prose on blank lines into paragraphs
export function Prose({ text, lead }: { text: string; lead?: boolean }) {
  return (
    <div className="prose">
      {text
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className={lead && i === 0 ? 'lead-para' : undefined}>
            {para}
          </p>
        ))}
    </div>
  )
}
