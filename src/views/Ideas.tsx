import { useMemo } from 'react'
import { Portrait, Section } from '../components/bits'
import { Heat } from '../components/Heat'
import type { CorpusR } from '../data/db'
import { CONCEPT_KINDS, type Concept } from '../data/schema'
import { short } from '../lib/dates'
import { Lineage } from '../components/ideas/Lineage'
import { Press } from '../components/ideas/Press'
import { Spectrum } from '../components/ideas/Spectrum'
import { Stream } from '../components/ideas/Stream'
import { Targets } from '../components/ideas/Targets'
import { Versions } from '../components/ideas/Versions'
import { conceptHref, go, personHref, useKept, useRoute, withQuery } from '../lib/router'
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

const SUBNAV: [string, string][] = [
  ['lineage', '主义谱系'],
  ['spectrum', '光谱漂移'],
  ['stream', '主义词频'],
  ['press', '报刊词频'],
  ['guiding', '指导思想'],
  ['heat', '提法词频'],
  ['targets', '增长目标'],
  ['versions', '逐版对照'],
  ['debates', '论争'],
  ['thinkers', '思想者'],
]

export function Ideas() {
  const a = useAtlas()
  const pick = useRoute().q.get('m')
  const onPick = (id: string | null) => go(withQuery('m', id ?? undefined))
  const [ck, setCk] = useKept('congress')
  const [open, setOpen] = useKept<Set<string>>(new Set())
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
  const debates = a.db.concepts.filter((c) => c.kind === 'debate')
  const thinkers = useMemo(
    () =>
      a.db.people
        .filter((p) => p.roles.includes('scholar'))
        .map((p) => ({ p, ideas: a.db.concepts.filter((c) => c.by.includes(p.id)) }))
        .sort((x, y) => y.ideas.length - x.ideas.length || Number(y.p.life.length > 0) - Number(x.p.life.length > 0)),
    [a],
  )
  const kinds = CORPUS_KINDS.find((k) => k[0] === ck)![2]
  const corpus = a.db.corpus.filter((d) => kinds.includes(d.kind))
  const heatConcepts = a.db.concepts.filter((c) => c.kind !== 'trend')

  return (
    <div className="page">
      <div className="eyebrow">Ideas</div>
      <h1 className="h1">思想</h1>
      <p className="lede">
        党的指导思想每一代领导人增添一层：提法先在讲话中出现，再写进党代会报告，最后入党章、入宪法。体制内外的主义此消彼长，中央路线在经济、政治、对外三条轴上来回移动。下面先看主义的谱系与光谱，再看它们在官方文件和《人民日报》里的词频。
      </p>
      <nav className="subnav">
        {SUBNAV.map(([id, label]) => (
          <button key={id} className="chip" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {label}
          </button>
        ))}
      </nav>

      <Section id="lineage" title="主义谱系" note="1978 年至今的官方正统、党内路线、民间思潮、外来对立面与罪名。色条是它作为现实主张存在的年份；实线连向源头，虚线连向它所针对的对象">
        <Lineage pick={pick} onPick={onPick} />
      </Section>

      <Section id="spectrum" title="思想光谱漂移" note="三条轴：经济（国家主导 ↔ 市场）、政治（集中 ↔ 宽松多元）、对外（韬光养晦 ↔ 强硬）。红线是中央路线到此刻为止的轨迹，圆点是此刻存在的各家主张；位置是编者的判断，只表示相对立场">
        <Spectrum pick={pick} onPick={onPick} />
      </Section>

      <Section id="stream" title="主义词频" note="各主义的匹配词在官方文件或《人民日报》社论中逐年每万字出现的次数">
        <Stream pick={pick} onPick={onPick} />
      </Section>

      <Section id="press" title="报刊词频" note="一组口号与关键词在《人民日报》里的逐年起落，按首次出现排序，可以看出口号一代接一代地更替">
        <Press onPick={onPick} />
      </Section>

      <Section id="guiding" title="指导思想谱系" note="按首次提出时间排列；点击查看首次出现与写入党章的原文">
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
        id="heat"
        title="提法词频"
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

      <Section id="targets" title="增长目标" note="每年《政府工作报告》写下的经济增长预期目标：从“保八”到 7.5%、区间目标，2020 年未设目标，2026 年降到 4.5%—5%">
        <div className="card pad">
          <Targets />
        </div>
      </Section>

      <Section id="versions" title="党章、宪法逐版对照" note="选两版，看每一次修改删了什么、加了什么：红色删除线是删去的字，金色下划线是新增的字；右侧竖条标出改动在全文中的位置">
        <div className="card pad">
          <Versions />
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

      {debates.length > 0 && (
        <Section id="debates" title="论争" note="几场影响路线的大争论：各方主张、代表人物、出处并列">
          <div className="trend-grid">
            {debates.map((c) => (
              <ConceptCard key={c.id} c={c} />
            ))}
          </div>
        </Section>
      )}

      {thinkers.length > 0 && (
        <Section id="thinkers" title="思想者" note="提出或阐释这些提法的学者、理论家与体制外知识分子">
          <div className="thinkers">
            {thinkers.map(({ p, ideas }) => (
              <a key={p.id} className="card pad thinker" href={personHref(p.id)}>
                <Portrait p={p} size={52} />
                <span>
                  <b>{p.name}</b>
                  <span className="small muted">{p.headline}</span>
                  {ideas.length > 0 && <span className="small thinker-ideas">{ideas.map((c) => c.name).join('、')}</span>}
                </span>
              </a>
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
