// The case file on a person page: what the notice said, the sum, the charges, the sentence, what set it off,
// who went down with them, and the editor's reading of its politics, apart from the sourced facts.
import { CASE_SYS, CHAIN_RELS, DISCIPLINES, GRADES, OUTCOMES, POLITICS, TERMS, TRIGGERS } from '../../data/schema'
import type { PersonR } from '../../data/db'
import { PHRASES } from '../../lib/caseparse'
import { short } from '../../lib/dates'
import { quoted } from '../../lib/quotes'
import { href, personHref } from '../../lib/router'
import { useAtlas } from '../../state'
import { Src, VoiceTag } from '../bits'
import { EditorBox, money } from './Tally'

const PH = new Map(PHRASES.map((x) => [x.id, x.label]))

export function CaseFile({ p }: { p: PersonR }) {
  const a = useAtlas()
  const c = p.case
  if (!c) return null
  const studies = a.db.cases.filter((k) => k.people.includes(p.id))
  const term = c.term && (c.term === 'years' || c.term === 'probation' ? `${TERMS[c.term]}${c.years ? ` ${c.years} 年` : ''}` : TERMS[c.term])
  const rows: [string, React.ReactNode][] = [
    ['结局', OUTCOMES[c.outcome]],
    ['系统', c.sys && CASE_SYS[c.sys]],
    ['级别', c.grade && GRADES[c.grade]],
    ['退休后被查', c.retired && `${short(c.retired)} 已离开最后职务`],
    [
      '起因',
      c.trigger && (
        <>
          <b>{TRIGGERS[c.trigger.kind]}</b> {c.trigger.text} <Src cite={c.trigger.cite} />
        </>
      ),
    ],
    [
      '违反纪律',
      c.disc.length > 0 && c.disc.map((d) => DISCIPLINES[d]).join('、'),
    ],
    [
      '通报措辞',
      (c.notice?.quotes.length || c.phrases.length) && (
        <>
          {c.notice?.quotes.map((q) => (
            <span key={q} className="notice-q">
              {quoted(q)}
            </span>
          ))}
          {!c.notice && c.phrases.map((id) => <span key={id} className="notice-q">{PH.get(id)}</span>)}
          {c.notice && <Src cite={c.notice.cite} />}
        </>
      ),
    ],
    ['罪名', c.charges.length > 0 && c.charges.join('、')],
    [
      '涉案金额',
      c.yuan && (
        <>
          {money(c.yuan)}
          {c.amount && (
            <>
              {' '}
              <span className="muted">{c.amount.text}</span> <Src cite={c.amount.cite} />
            </>
          )}
        </>
      ),
    ],
    [
      '判决',
      term && (
        <>
          {term}
          {c.sentenced && <span className="muted"> · {short(c.sentenced)}</span>}
          {c.sentence && <Src cite={c.sentence.cite} />}
        </>
      ),
    ],
  ]
  return (
    <div className="card pad casefile">
      <dl>
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {c.with.length > 0 && (
        <div className="casefile-with">
          <div className="h3">牵连</div>
          {c.with.map((w) => {
            const q = w.id ? a.person.get(w.id) : undefined
            return (
              <div key={w.id ?? w.name}>
                <span className="chain-rel">{CHAIN_RELS[w.rel]}</span> {q ? <a href={personHref(q.id)}>{q.name}</a> : <b>{w.name}</b>} {w.text} <Src cite={w.cite} />
              </div>
            )
          })}
        </div>
      )}
      {c.politics && <EditorBox title={`编者分析 · ${POLITICS[c.politics.level]}`} text={c.politics.why} cites={c.politics.cites} />}
      {c.voices.length > 0 && (
        <div className="voices" style={{ marginTop: 12 }}>
          {c.voices.map((v, i) => (
            <div key={i} className="vcard" style={{ borderLeftColor: `var(--v-${v.voice})` }}>
              <VoiceTag v={v.voice} /> <Src cite={v.cite} />
              <p>{v.text}</p>
            </div>
          ))}
        </div>
      )}
      {studies.length > 0 && (
        <div className="small" style={{ marginTop: 10 }}>
          专题：
          {studies.map((k) => (
            <a key={k.id} href={href(`purges/${k.id}`)} style={{ marginRight: 10 }}>
              {k.title}
            </a>
          ))}
        </div>
      )}
      <div className="small muted" style={{ marginTop: 8 }}>
        罪名、刑期、金额未单独标注出处的，由本站从所引判决和通报原文中读出。
      </div>
    </div>
  )
}
