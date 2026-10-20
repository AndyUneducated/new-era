import { useMemo } from 'react'
import { CcFalls } from '../components/CcFalls'
import { Portrait, Section } from '../components/bits'
import { Chains } from '../components/purges/Chains'
import { Durations } from '../components/purges/Durations'
import { FallMonths } from '../components/purges/FallMonths'
import { Grid } from '../components/purges/Grid'
import { Sums } from '../components/purges/Sums'
import { EditorBox, Tally, type TallyRow } from '../components/purges/Tally'
import { Timing } from '../components/purges/Timing'
import { Wording } from '../components/purges/Wording'
import { Seal } from '../components/Seal'
import { CASE_KINDS, CASE_SYS, DISCIPLINES, OUTCOMES, PLEAS, POLITICS, TRIGGERS } from '../data/schema'
import { short } from '../lib/dates'
import { LEVELS, falls, months, placeAtFall, postAtFall, sysOf, type Fall } from '../lib/purge'
import { href, personHref, useKept } from '../lib/router'
import { useAtlas } from '../state'

type Scope = 'all' | 'high' | 'army'
const SCOPES: Record<Scope, string> = { all: '全部', high: '中委以上', army: '只看军队' }
const OFFICIAL_POLITICS = (Object.keys(POLITICS) as (keyof typeof POLITICS)[]).filter((k) => k !== 'repression')
const inScope = (f: Fall, s: Scope) => s === 'all' || (s === 'army' ? f.army : f.level === 'top' || f.level === 'cc')

const SUBNAV: [string, string][] = [
  ['months', '按月分布'],
  ['top', '最高一层'],
  ['army', '军中清洗'],
  ['cc', '中委落马率'],
  ['why', '落马原因'],
  ['wording', '通报措辞'],
  ['politics', '与政治斗争'],
  ['ends', '结局'],
  ['sums', '金额与刑期'],
  ['time', '过程时长'],
  ['chains', '牵连'],
  ['systems', '系统与地方'],
  ['trigger', '起因'],
  ['retired', '退休后被查'],
  ['cases', '专题'],
  ['roll', '名录'],
]

// group a list by keys, keeping the order of the given keys
function by<K extends string>(list: Fall[], keys: readonly K[], of: (f: Fall) => K | K[] | undefined, label: (k: K) => string, color?: (k: K) => string): TallyRow[] {
  return keys.map((k) => ({ key: k, label: label(k), color: color?.(k), list: list.filter((f) => [of(f)].flat().includes(k)) }))
}
// categories with no order of their own run largest first; scales (politics, sentence and gap bands) keep theirs
const most = (rows: TallyRow[]) => [...rows].sort((x, y) => y.list.length - x.list.length)

// sentences in bands, for the distribution of outcomes
const BANDS: [string, string, (f: Fall) => boolean][] = [
  ['exempt', '免予刑事处罚、缓刑', (f) => f.c.term === 'exempt' || f.c.term === 'probation'],
  ['y5', '五年以下', (f) => f.c.term === 'years' && (f.c.years ?? 0) <= 5],
  ['y10', '五至十年', (f) => f.c.term === 'years' && (f.c.years ?? 0) > 5 && (f.c.years ?? 0) <= 10],
  ['y15', '十至十五年', (f) => f.c.term === 'years' && (f.c.years ?? 0) > 10 && (f.c.years ?? 0) <= 15],
  ['y20', '十五年以上', (f) => f.c.term === 'years' && (f.c.years ?? 0) > 15],
  ['life', '无期徒刑', (f) => f.c.term === 'life'],
  ['ds', '死缓', (f) => f.c.term === 'death-suspended'],
  ['dl', '死缓，终身监禁', (f) => f.c.term === 'death-life'],
  ['death', '死刑立即执行', (f) => f.c.term === 'death'],
]

// how long after leaving the last post the first step came
function retiredFor(f: Fall): number | undefined {
  if (f.c.retired) return months(f.c.retired, f.date)
  const post = postAtFall(f)
  if (!post?.to || post.to >= f.date.slice(0, 7)) return undefined
  const gap = months(post.to, f.date)
  return gap >= 6 ? gap : undefined
}

export function Purges() {
  const a = useAtlas()
  const [missing, setMissing] = useKept(false)
  const all = useMemo(() => falls(a.db.people, { missing }), [a, missing])
  const gone = useMemo(() => falls(a.db.people, { missing: true }).filter((f) => f.p.status === 'missing'), [a])
  const [scope, setScope] = useKept<Scope>('all')
  const [year, setYear] = useKept<number>()
  const list = all.filter((f) => inScope(f, scope))

  const since18 = all.filter((f) => f.t >= 2012.87).length
  const high = all.filter((f) => f.level === 'top' || f.level === 'cc').length
  const army = all.filter((f) => f.army)
  const tops = all.filter((f) => f.level === 'top').reverse()
  const armyLate = army.filter((f) => f.t >= 2023).reverse()
  const byYear = new Map<number, Fall[]>()
  for (const f of list) byYear.set(Math.floor(f.t), [...(byYear.get(Math.floor(f.t)) ?? []), f])
  const years = [...byYear.keys()].sort((x, y) => y - x).filter((y) => year === undefined || y === year)

  // the anatomy runs on the scope picked above
  const sentenced = list.filter((f) => f.c.term)
  const charges = [...new Set(list.flatMap((f) => f.c.charges))]
    .map((ch) => ({ key: ch, label: ch, list: list.filter((f) => f.c.charges.includes(ch)) }))
    .sort((x, y) => y.list.length - x.list.length)
  const charged = list.filter((f) => f.c.charges.length).length
  const withDisc = list.filter((f) => f.c.disc.length)
  // people outside the system who were repressed are counted apart from fallen officials (decisions #70)
  const repressed = list.filter((f) => f.c.politics?.level === 'repression' || f.c.trigger?.kind === 'persecution').reverse()
  const rated = list.filter((f) => f.c.politics && f.c.politics.level !== 'repression')
  const political = rated.filter((f) => f.c.politics!.level !== 'none').sort((x, y) => (x.c.politics!.level === 'core' ? 0 : 1) - (y.c.politics!.level === 'core' ? 0 : 1) || y.t - x.t)
  const triggered = list.filter((f) => f.c.trigger && f.c.trigger.kind !== 'persecution')
  const pleaded = sentenced.filter((f) => f.c.pleas.length)
  const retired = list.map((f) => ({ f, m: retiredFor(f) })).filter((r) => r.m !== undefined)
  const guessed = list.filter((f) => sysOf(f).guessed).length
  const places = [...new Set(list.filter((f) => f.t >= 2012).map(placeAtFall).filter((x) => x !== undefined))]
    .map((pl) => ({ key: pl, label: pl, test: (f: Fall) => placeAtFall(f) === pl, n: list.filter((f) => f.t >= 2012 && placeAtFall(f) === pl).length }))
    .sort((x, y) => y.n - x.n)
  const systems = (Object.keys(CASE_SYS) as (keyof typeof CASE_SYS)[])
    .map((k) => ({ key: k, label: CASE_SYS[k], test: (f: Fall) => sysOf(f).sys === k }))
    .map((r) => ({ ...r, n: list.filter((f) => f.t >= 2012 && r.test(f)).length }))
    .sort((x, y) => y.n - x.n)
  const cases = [...a.db.cases].sort((x, y) => y.people.length - x.people.length)

  return (
    <div className="page purges">
      <div className="eyebrow">Purges</div>
      <h1 className="h1">打虎</h1>
      <p className="lede">
        二〇〇〇年以来本站收录的落马者，每人记在第一次官方通报（核查、立案、免职或开除）的月份。十八大后的第一波以省部级和政法、石油系统为主；二〇二三年起的第二波转向军队，火箭军、装备系统和军委本身相继出事。
      </p>

      <div className="pg-stats">
        <div>
          <b>{all.length}</b>
          <span>收录落马</span>
        </div>
        <div>
          <b>{since18}</b>
          <span>十八大以来</span>
        </div>
        <div>
          <b>{high}</b>
          <span>中委以上</span>
        </div>
        <div>
          <b>{army.length}</b>
          <span>军队</span>
        </div>
        <div>
          <b>{all.filter((f) => f.c.term).length}</b>
          <span>已判刑</span>
        </div>
      </div>

      <nav className="subnav">
        {SUBNAV.map(([id, label]) => (
          <button key={id} className="chip" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {label}
          </button>
        ))}
        <span className="subnav-gap" />
        <div className="seg" role="tablist" aria-label="范围">
          {(Object.keys(SCOPES) as Scope[]).map((k) => (
            <button key={k} className={scope === k ? 'on' : undefined} onClick={() => setScope(k)}>
              {SCOPES[k]}
            </button>
          ))}
        </div>
        <label className="pg-toggle" title={`${gone.length} 人官方未说明去向，默认不计入`}>
          <input type="checkbox" checked={missing} onChange={(e) => setMissing(e.target.checked)} />
          计入下落不明（{gone.length}）
        </label>
      </nav>

      <Section id="months" title="落马按月分布" note="悬停看人与第一条通报，点格子进入传记，点年份筛选下方名录。官方披露有先后，个别人的核查早于公开通报，以本站所记第一步为准。">
        <FallMonths list={list} onYear={(y) => setYear(year === y ? undefined : y)} />
      </Section>

      <Section id="top" title="最高一层" note="政治局委员以上与军委委员。">
        <div className="pg-wall">
          {tops.map((f) => (
            <Tile key={f.p.id} f={f} big />
          ))}
        </div>
      </Section>

      <Section id="army" title="二〇二三年以来的军中清洗" note={`${armyLate.length} 名将领，由近及远。只见于罢免人大代表资格或久未露面、官方未说明原因的记为下落不明，见本页末。`}>
        <div className="pg-wall">
          {armyLate.map((f) => (
            <Tile key={f.p.id} f={f} />
          ))}
        </div>
      </Section>

      <Section id="cc" title="各届中委落马率" note="每格一名中央委员或候补委员。深红为任内落马，浅红为卸任后落马。">
        <CcFalls />
      </Section>

      <Section id="why" title="落马原因" note={`罪名从所引起诉、判决报道读出，${charged} 人有罪名；违反的纪律从开除通报读出，${withDisc.length} 人有通报原文。点一行看名单。`}>
        <div className="pg-two">
          <div>
            <div className="h3">罪名</div>
            <Tally rows={charges} of={charged} fold={10} />
          </div>
          <div>
            <div className="h3">违反的纪律</div>
            <Tally rows={most(by(withDisc, Object.keys(DISCIPLINES) as (keyof typeof DISCIPLINES)[], (f) => f.c.disc, (k) => DISCIPLINES[k], () => 'var(--gold)'))} of={withDisc.length} />
          </div>
        </div>
      </Section>

      <Section id="wording" title="通报措辞" note="中纪委开除通报的固定用语，按年统计出现在多少份通报里。颜色越深，当年用得越普遍；悬停看是谁。只统计本站存有通报原文的，早年的通报多未收录。">
        <Wording list={list} />
      </Section>

      <Section
        id="politics"
        title="与政治斗争的关系"
        note={`每个已整理的官员案件，由编者按能找到的材料判断一级：${OFFICIAL_POLITICS.map((k) => POLITICS[k]).join('、')}。已评估 ${rated.length} 人，其余尚未整理。这是解读，不是事实，所以每条都写明依据。异见者、律师等体制外人物另列在本节末。`}
      >
        <Tally rows={by(rated, OFFICIAL_POLITICS, (f) => f.c.politics?.level, (k) => POLITICS[k], (k) => (k === 'core' ? 'var(--seal)' : k === 'linked' ? 'var(--gold)' : 'var(--muted)'))} of={rated.length} />
        <div className="pg-politics">
          {political.map((f) => (
            <div key={f.p.id} className="pg-pol">
              <a href={personHref(f.p.id)} className="pg-pol-who">
                <Portrait p={f.p} size={40} />
                <span>
                  <b>{f.p.name}</b>
                  <span className="m">{f.date.slice(0, 4)}</span>
                </span>
              </a>
              <EditorBox title={`编者分析 · ${POLITICS[f.c.politics!.level]}`} text={f.c.politics!.why} cites={f.c.politics!.cites} />
            </div>
          ))}
        </div>
        <div className="h3" style={{ marginTop: 22 }}>
          与换届的时间关系
        </div>
        <Timing list={list} />
        {repressed.length > 0 && (
          <>
            <div className="h3" style={{ marginTop: 22 }}>
              体制外：政治打压
            </div>
            <p className="muted">编者判断为政治打压或起因为迫害的 {repressed.length} 名异见者、维权律师、作家与商人，不计入上面的官员统计。</p>
            <div className="pg-wall">
              {repressed.map((f) => (
                <Tile key={f.p.id} f={f} />
              ))}
            </div>
          </>
        )}
      </Section>

      <Section id="ends" title="结局" note="每人取目前已知的最后一步。“审查调查中”包括官方只公布了立案、尚无下文的。">
        <div className="pg-two">
          <div>
            <div className="h3">去向</div>
            <Tally rows={most(by(list, Object.keys(OUTCOMES) as (keyof typeof OUTCOMES)[], (f) => f.c.outcome, (k) => OUTCOMES[k], (k) => (['suicide', 'died', 'fled'].includes(k) ? 'var(--ink)' : k === 'back' || k === 'released' ? 'var(--gold)' : 'var(--red)')))} of={list.length} />
          </div>
          <div>
            <div className="h3">刑期</div>
            <Tally rows={BANDS.map(([key, label, test]) => ({ key, label, list: sentenced.filter(test) }))} of={sentenced.length} />
          </div>
        </div>
        <div className="h3" style={{ marginTop: 18 }}>
          量刑情节
        </div>
        <p className="muted">法院认定的从轻情节，从所引判决报道读出。已判刑 {sentenced.length} 人中 {pleaded.length} 人的报道写明了情节，其余未写或尚未收录判决原文。</p>
        <Tally rows={most(by(pleaded, Object.keys(PLEAS) as (keyof typeof PLEAS)[], (f) => f.c.pleas, (k) => PLEAS[k], () => 'var(--gold)'))} of={pleaded.length} />
      </Section>

      <Section id="sums" title="金额与刑期" note="横轴为法院认定的受贿等金额（对数），纵轴为刑期。点进人物。二〇一六年四月起施行的两高司法解释提高了受贿罪的数额标准，同样的刑期对应的金额此后普遍更高。">
        <Sums list={list} />
      </Section>

      <Section id="time" title="过程时长" note="从第一条官方通报到开除党籍、到一审判决，各过了多少个月，按第一步所在年份排开。">
        <Durations list={list} />
      </Section>

      <Section id="chains" title="牵连" note="案件记录里写明的靠山、秘书、下属、家属、商人。同一人出现在几个案子里，这几个案子就连成一串。">
        <Chains list={list} />
      </Section>

      <Section id="systems" title="系统与地方" note={`十八大以来按年统计。没有案件记录的 ${guessed} 人，系统由落马时职务推断；地方按落马时所任职务所在省份。一行里集中变深的几年，多是一地或一系统的“塌方”。`}>
        <div className="h3">系统</div>
        <Grid list={list} rows={systems} />
        <div className="h3" style={{ marginTop: 18 }}>
          省份
        </div>
        <Grid list={list} rows={places} />
      </Section>

      <Section id="trigger" title="起因" note={`官方或可靠报道写明了从哪里查起的 ${triggered.length} 人。多数案件的线索来源不公开。体制外人物遭迫害的不计入，见“与政治斗争”一节末。`}>
        <Tally rows={most(by(triggered, (Object.keys(TRIGGERS) as (keyof typeof TRIGGERS)[]).filter((k) => k !== 'persecution'), (f) => f.c.trigger?.kind, (k) => TRIGGERS[k]))} of={triggered.length} />
      </Section>

      <Section id="retired" title="退休后被查" note="离开最后一个职务至少半年后才被通报的。“退休不是避风港”是十八大以来反复出现的说法。">
        <Tally
          rows={[
            { key: 'y1', label: '离职一年内', list: retired.filter((r) => r.m! < 12).map((r) => r.f) },
            { key: 'y3', label: '一至三年', list: retired.filter((r) => r.m! >= 12 && r.m! < 36).map((r) => r.f) },
            { key: 'y5', label: '三至五年', list: retired.filter((r) => r.m! >= 36 && r.m! < 60).map((r) => r.f) },
            { key: 'y9', label: '五年以上', list: retired.filter((r) => r.m! >= 60).map((r) => r.f) },
          ]}
          of={list.length}
        />
      </Section>

      <Section id="cases" title="专题" note="单个大案、一省塌方、一个系统的清洗，逐篇写清来龙去脉。">
        {cases.length ? (
          <div className="pg-cases">
            {cases.map((k) => (
              <a key={k.id} href={href(`purges/${k.id}`)} className="card pad pg-case">
                <span className="m">
                  {CASE_KINDS[k.kind]} · {k.years}
                </span>
                <b>{k.title}</b>
                <p>{k.summary}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">专题正在撰写。</p>
        )}
      </Section>

      <Section
        id="roll"
        title="名录"
        note={year ? `${year} 年 · 点上方年份取消筛选` : `${SCOPES[scope]} · 按年由近及远`}
        right={
          year !== undefined && (
            <button className="chip" onClick={() => setYear(undefined)}>
              全部年份
            </button>
          )
        }
      >
        <div className="pg-roll">
          {years.map((y) => (
            <div key={y} className="pg-roll-year">
              <h3>
                {y}
                <span className="m">{byYear.get(y)!.length} 人</span>
              </h3>
              <div className="pg-chips">
                {byYear
                  .get(y)!
                  .slice()
                  .reverse()
                  .map((f) => (
                    <a key={f.p.id} href={personHref(f.p.id)} className={`pg-chip lv-${f.level}`} title={f.p.headline}>
                      <i style={{ background: LEVELS[f.level].color }} />
                      {f.p.name}
                      {f.date.length > 4 && <span className="m">{Number(f.date.slice(5, 7))}月</span>}
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {gone.length > 0 && (
        <Section title="下落不明" note="被罢免人大代表资格、从名单上消失或久未露面，官方没有说明原因。不计入上面的统计，除非勾选“计入下落不明”。">
          <div className="pg-wall">
            {[...gone].reverse().map((f) => (
              <Tile key={f.p.id} f={f} />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Tile({ f, big }: { f: Fall; big?: boolean }) {
  return (
    <a className={big ? 'pg-tile big' : 'pg-tile'} href={personHref(f.p.id)} title={f.p.headline}>
      <span className="pg-tile-face">
        <Portrait p={f.p} size={big ? 64 : 48} />
        {big && (
          <span className="pg-tile-seal">
            <Seal size={30} tilt={-10} />
          </span>
        )}
      </span>
      <b>{f.p.name}</b>
      <span className="m">{short(f.date)}</span>
    </a>
  )
}
