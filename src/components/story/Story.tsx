// The home page story (decisions #35): chapters of steps on the left, one sticky stage on the right
// that follows whichever step is in the middle of the screen.
import { Fragment, useEffect, useRef, useState } from 'react'
import type { Chapter, Stage } from '../../data/schema'
import { short } from '../../lib/dates'
import { eventHref } from '../../lib/router'
import { useAtlas } from '../../state'
import { PersonChip } from '../bits'
import { CmcStage, DocStage, FallsStage, SeatsStage } from './Stages'

const NUM = '壹贰叁肆伍陆柒捌玖拾'

export function Story() {
  const a = useAtlas()
  const steps = a.db.story.flatMap((c, ci) => c.steps.map((s, si) => ({ ...s, c, ci, si })))
  const [at, setAt] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    // on a phone the stage fills the top half, so a step takes over when it crosses a line lower down
    const phone = matchMedia('(max-width: 860px)').matches
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) setAt(Number((e.target as HTMLElement).dataset.i))
      },
      { rootMargin: phone ? '-72% 0px -27% 0px' : '-48% 0px -48% 0px' },
    )
    for (const el of refs.current) if (el) io.observe(el)
    return () => io.disconnect()
  }, [steps.length])
  if (!steps.length) return null
  const cur = steps[Math.min(at, steps.length - 1)]
  const jump = (ci: number) => refs.current[steps.findIndex((s) => s.ci === ci)]?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <section className="story" aria-label="2002 年以来的七个章节">
      <div className="story-stage">
        <div className="stage-sticky">
          <ol className="story-rail">
            {a.db.story.map((c, i) => (
              <li key={c.id} className={i === cur.ci ? 'on' : i < cur.ci ? 'past' : undefined}>
                <button onClick={() => jump(i)}>
                  <span>{NUM[i]}</span>
                  {c.title}
                </button>
              </li>
            ))}
          </ol>
          <div className="stage-body" key={cur.stage.kind}>
            <StageView st={cur.stage} />
          </div>
        </div>
      </div>
      <div className="story-steps">
        {steps.map((s, i) => (
          <Fragment key={`${s.c.id}-${s.si}`}>
            {s.si === 0 && <ChapterHead c={s.c} i={s.ci} />}
            <article
              ref={(el) => {
                refs.current[i] = el
              }}
              data-i={i}
              className={i === at ? 'step on' : i < at ? 'step past' : 'step'}
            >
              <div className="step-card">
                <p>{s.text}</p>
                {(s.events.length > 0 || s.people.length > 0) && (
                  <div className="step-links">
                    {s.events.map((id) => (
                      <EventChip key={id} id={id} />
                    ))}
                    {s.people.map((id) => (
                      <PersonChip key={id} id={id} />
                    ))}
                  </div>
                )}
              </div>
            </article>
          </Fragment>
        ))}
        <div className="story-end" />
      </div>
    </section>
  )
}

function ChapterHead({ c, i }: { c: Chapter; i: number }) {
  return (
    <header className="ch-head">
      <span className="ch-num">{NUM[i]}</span>
      <div>
        <div className="ch-years tnum">{c.years}</div>
        <h2>{c.title}</h2>
      </div>
    </header>
  )
}

function StageView({ st }: { st: Stage }) {
  if (st.kind === 'seats') return <SeatsStage st={st} />
  if (st.kind === 'falls') return <FallsStage st={st} />
  if (st.kind === 'doc') return <DocStage st={st} />
  return <CmcStage st={st} />
}

// an event the step is about; one resting only on rumor sources says so
function EventChip({ id }: { id: string }) {
  const a = useAtlas()
  const e = a.event.get(id)
  if (!e) return null
  const rumor = e.cites.every((c) => a.source.get(c.split('@')[0])?.rumor)
  return (
    <a className={rumor ? 'chip ev rumor' : 'chip ev'} href={eventHref(id)}>
      <span className="tnum muted">{short(e.date).slice(0, 7)}</span>
      {e.title}
      {rumor && <span className="rumor-mark">传闻</span>}
    </a>
  )
}
