import { useMemo, useState } from 'react'
import { Section } from '../components/bits'
import { Heat } from '../components/Heat'
import type { CorpusR } from '../data/db'
import { CONCEPT_KINDS, type Concept } from '../data/schema'
import { short } from '../lib/dates'
import { conceptHref } from '../lib/router'
import { useAtlas } from '../state'

const ERA: Record<string, string> = {
  'deng-theory': '邓小平',
  'three-represents': '江泽民',
  'scientific-development': '胡锦涛',
  'xi-thought': '习近平',
}

const FOLD = 8

const CORPUS_KINDS: [string, string, CorpusR['kind'][]][] = [
  ['congress', '党代会报告', ['congress']],
  ['gov', '政府工作报告', ['gov']],
  ['basic', '党章、宪法、决议', ['charter', 'constitution', 'resolution', 'plenum']],
]

export function Ideas() {
  const a = useAtlas()
  const [ck, setCk] = useState('congress')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setOpen((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const guiding = a.db.concepts.filter((c) => c.kind === 'guiding').sort((x, y) => (x.first?.date ?? '').localeCompare(y.first?.date ?? ''))
  const rootOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of a.db.concepts) {
      let cur: Concept | undefined = c
      const seen = new Set<string>()
      while (cur?.parent && !seen.has(cur.id)) {
        seen.add(cur.id)
        cur = a.concept.get(cur.parent)
      }
      if (cur && cur.kind === 'guiding' && cur.id !== c.id) m.set(c.id, cur.id)
    }
    return m
  }, [a])
  const loose = a.db.concepts.filter((c) => (c.kind === 'component' || c.kind === 'formula') && !rootOf.has(c.id))
  const docs = a.db.concepts.filter((c) => c.kind === 'document')
  const trends = a.db.concepts.filter((c) => c.kind === 'trend')
  const kinds = CORPUS_KINDS.find((k) => k[0] === ck)![2]
  const corpus = a.db.corpus.filter((d) => kinds.includes(d.kind))
  const heatConcepts = a.db.concepts.filter((c) => c.kind !== 'trend')

  return (
    <div className="page">
      <div className="eyebrow">Ideas</div>
      <h1 className="h1">思想</h1>
      <p className="lede">
        党的指导思想每一代领导人增添一层：提法先在讲话中出现，再写进党代会报告，最后入党章、入宪法。下面按代际排列，并统计每个提法在历次官方文件中出现的频率。
      </p>

      <Section title="指导思想谱系" note="按首次提出时间排列；点击查看首次出现与写入党章的原文">
        <div className="lineage">
          {guiding.map((g) => {
            const kids = a.db.concepts.filter((c) => rootOf.get(c.id) === g.id).sort((x, y) => (x.first?.date ?? '9').localeCompare(y.first?.date ?? '9'))
            return (
              <div key={g.id} className="era-col">
                <h3>{ERA[g.id] ?? g.by.map((b) => a.name(b)).join('、')}</h3>
                <a className="card gcard" href={conceptHref(g.id)}>
                  <b>{g.name}</b>
                  <span className="small muted">
                    {g.first && `${short(g.first.date).slice(0, 4)} 提出`}
                    {g.codified[0] && ` · ${g.codified[0].date.slice(0, 4)} ${g.codified[0].where}`}
                  </span>
                </a>
                {(open.has(g.id) ? kids : kids.slice(0, FOLD)).map((c) => (
                  <a key={c.id} className="card ccard" href={conceptHref(c.id)}>
                    <b>{c.name}</b>
                    <span>
                      {CONCEPT_KINDS[c.kind]}
                      {c.first && ` · ${c.first.date.slice(0, 4)}`}
                    </span>
                  </a>
                ))}
                {kids.length > FOLD && (
                  <button className="chip fold" onClick={() => toggle(g.id)} aria-expanded={open.has(g.id)}>
                    {open.has(g.id) ? '收起' : `展开其余 ${kids.length - FOLD} 项`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {!guiding.length && <div className="empty">思想条目尚未载入</div>}
      </Section>

      {loose.length > 0 && (
        <Section title="其他提法">
          <div className="trend-grid">
            {loose.map((c) => (
              <ConceptCard key={c.id} c={c} />
            ))}
          </div>
        </Section>
      )}

      <Section
        title="词频"
        note="每万字出现次数；颜色越深越频繁。点击行查看该提法详情"
        right={
          <div className="seg">
            {CORPUS_KINDS.map(([k, l]) => (
              <button key={k} className={k === ck ? 'on' : undefined} onClick={() => setCk(k)}>
                {l}
              </button>
            ))}
          </div>
        }
      >
        <div className="card pad">
          <Heat concepts={heatConcepts} docs={corpus} />
        </div>
      </Section>

      {docs.length > 0 && (
        <Section title="意识形态文件" note="内部通知、历史决议与体制外宣言">
          <div className="trend-grid">
            {docs.map((c) => (
              <ConceptCard key={c.id} c={c} />
            ))}
          </div>
        </Section>
      )}

      {trends.length > 0 && (
        <Section title="民间思潮" note="体制外与网络上的主要思想流派">
          <div className="trend-grid">
            {trends.map((c) => (
              <ConceptCard key={c.id} c={c} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function ConceptCard({ c }: { c: Concept }) {
  return (
    <a className="card pad" href={conceptHref(c.id)}>
      <div className="small" style={{ color: 'var(--gold)', fontWeight: 600 }}>
        {CONCEPT_KINDS[c.kind]}
        {c.first && ` · ${c.first.date.slice(0, 4)}`}
      </div>
      <div className="h3" style={{ margin: '4px 0' }}>{c.name}</div>
      {c.en && <div className="small muted">{c.en}</div>}
      <p className="small" style={{ color: 'var(--ink-2)', margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {c.summary}
      </p>
    </a>
  )
}
