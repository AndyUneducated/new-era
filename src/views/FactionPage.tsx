import * as d3 from 'd3'
import { PersonChip, Portrait, Prose, RumorMark, Section, Src, Srcs, Status, VoiceTag } from '../components/bits'
import { SeatShare } from '../components/charts'
import { CoWork } from '../components/CoWork'
import { Galaxy } from '../components/Galaxy'
import { OriginMap } from '../components/OriginMap'
import { PatronTree } from '../components/PatronTree'
import { Rise } from '../components/Rise'
import { Subway } from '../components/Subway'
import type { PersonR } from '../data/db'
import { FRAMES, RANKS, VOICES, type Voice } from '../data/schema'
import { centre, level, membersOf, RING_ORDER } from '../lib/faction'
import { short, span } from '../lib/dates'
import { quoted } from '../lib/quotes'
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
  const ranked = membersOf(a, f)
  const rankOf = new Map(ranked.map((m) => [m.p.id, m]))
  const ringIx = (id: string) => (id === centre(f) ? -1 : RING_ORDER.indexOf(rankOf.get(id)?.rank ?? 'periphery'))
  const order = [...new Set([...(f.patron && a.person.has(f.patron) ? [f.patron] : []), ...core, ...tagged.map((m) => m.p.id)])].sort((x, y) => ringIx(x) - ringIx(y))
  const voiceCount = new Map<Voice, number>()
  for (const m of tagged) {
    const v = a.source.get(m.tag.cite.split('@')[0])?.voice
    if (v) voiceCount.set(v, (voiceCount.get(v) ?? 0) + 1)
  }
  const events = (a.eventsOf.get(f.id) ?? []).slice().sort((x, y) => x.date.localeCompare(y.date))
  const siblings = a.db.factions.filter((x) => x.frame === f.frame && x.id !== f.id)
  const lines = [...new Set([centre(f), ...ranked.map((m) => m.p.id)])]
    .map((pid) => pid && a.person.get(pid))
    .filter((p): p is PersonR => !!p && p.positions.filter((x) => x.from).length >= 3)
    .sort((x, y) => Number(y.id === centre(f)) - Number(x.id === centre(f)) || level(a, y) - level(a, x) || y.positions.length - x.positions.length)
    .slice(0, 8)
    .map((p, i) => ({ p, color: d3.schemeTableau10[i] }))

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
            {[f.en, ...f.aka.filter((a) => !f.en?.toLowerCase().includes(a.toLowerCase()))].filter(Boolean).join(' · ')}
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

      <Section title="派系星系" note="恩主居中，向外依次是元老、核心、骨干、外围；拖动年份看当年谁在任、谁已落马。分层有来源原句的注明，没有的标“编者归类”">
        <Galaxy f={f} />
      </Section>

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
                    <p>{v.quote ? quoted(v.text) : v.text}</p>
                    {v.zh && <div className="small muted">{v.zh}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="提携树" note="谁提拔了谁、谁当过谁的秘书；没有记载的成员按履历推算同地任职">
            <PatronTree f={f} />
          </Section>

          <Section title="共事泳道" note="每人一条：灰色为各项职务，派系色为与中心人物同在一省任职的年份">
            <CoWork f={f} />
          </Section>

          <Section title="兴衰曲线" note="本派成员历年在政治局、中央委员会与省级主官中的人数">
            <Rise f={f} />
          </Section>

          <Section title="发迹地图" note="成员任过职的省份，以及中心人物的任职路线">
            <OriginMap f={f} />
          </Section>

          {lines.length >= 2 && (
            <Section title="履历地铁图" note="级别最高的几位成员，一人一条线：同一条横线是同一地方，线在哪里交汇就是在哪里共事；圈粗的站是主官职位">
              <div className="card pad">
                <Subway people={lines} labels="names" />
              </div>
            </Section>
          )}

          <Section title="成员" note="按分层排列；每人附上作出判断的来源原句">
            <div className="members">
              {order.map((pid) => {
                const p = a.person.get(pid)!
                const tags = byPerson.get(pid) ?? []
                const m = rankOf.get(pid)
                return (
                  <div key={pid} className="card mcard">
                    <a href={personHref(pid)}>
                      <Portrait p={p} size={52} />
                    </a>
                    <div style={{ minWidth: 0 }}>
                      <a href={personHref(pid)}>
                        <b>{p.name}</b>
                      </a>{' '}
                      {pid === f.patron ? (
                        <span className="chip red" style={{ fontSize: 11 }}>恩主</span>
                      ) : (
                        m && (
                          <span className={`chip rank ${m.rank}`} style={{ fontSize: 11 }} title={m.rankBy === 'source' ? '分层出自来源原句' : m.rankBy === 'editor' ? '编者归类' : '未标注分层，按最高职级暂放'}>
                            {RANKS[m.rank]}
                            {m.rankBy !== 'source' && <span className="muted">{m.rankBy === 'editor' ? ' · 编者' : ' · 暂'}</span>}
                          </span>
                        )
                      )}{' '}
                      <Status p={p} />
                      <div className="small muted">{p.headline}</div>
                      {m?.rankTag?.rankQuote && (
                        <div className="q small">
                          {quoted(m.rankTag.rankQuote)} — <Src cite={m.rankTag.cite} />
                        </div>
                      )}
                      {tags.map(({ tag }, i) => (
                        <div key={i}>
                          <RumorMark cite={tag.cite} />
                          {tag.quote && <div className="q">{quoted(tag.quote)}</div>}
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
