import { useEffect, useMemo, useState } from 'react'
import { Portrait, Section } from '../components/bits'
import { Ledger } from '../components/provinces/Ledger'
import { ProvMap } from '../components/provinces/ProvMap'
import { Seal } from '../components/Seal'
import { FRAMES, PROVINCES, REGIONS, type Frame, type Province } from '../data/schema'
import { FIRST, POST_LABEL, fellAfter, holderAt, tenures, yearSpan, type Post } from '../lib/chiefs'
import { cnNum } from '../lib/cn'
import { short } from '../lib/dates'
import { NOW } from '../lib/faction'
import { personHref, useKept, useRoute } from '../lib/router'
import { useAtlas } from '../state'

const LAST = Math.floor(NOW)
type FramePick = Frame | 'auto'
// before the 18th congress the press sorted provincial chiefs by the Hu-era camps, after it by Xi's old colleagues
const autoFrame = (y: number): Frame => (y < 2012 ? 'classic' : 'xi')

export function Provinces() {
  const a = useAtlas()
  const list = useMemo(() => tenures(a), [a])
  const q = useRoute().q
  const [year, setYear] = useKept(() => Math.min(LAST, Math.max(FIRST, Number(q.get('y')) || LAST)))
  const [post, setPost] = useKept<Post>(q.get('post') === 'gov' ? 'gov' : 'sec')
  const [pick, setPick] = useKept<Province>(() => PROVINCES.find((p) => p === q.get('p')) ?? '重庆')
  const [framePick, setFramePick] = useKept<FramePick>('auto')
  const [playing, setPlaying] = useState(false)
  const frame = framePick === 'auto' ? autoFrame(year) : framePick

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setYear((y) => {
        if (y >= LAST) {
          setPlaying(false)
          return y
        }
        return y + 1
      })
    }, 900)
    return () => clearInterval(t)
  }, [playing])

  const holders = PROVINCES.map((p) => holderAt(list, p, post, year + 0.5))
  const known = holders.filter((t) => t).length
  const fell = holders.filter((t) => t && fellAfter(t)).length
  const mix = new Map<string, { name: string; color: string; n: number }>()
  for (const t of holders) {
    const f = t?.p && a.factionIn(t.p, frame)
    if (!f) continue
    const m = mix.get(f.id) ?? { name: f.name, color: f.color, n: 0 }
    m.n++
    mix.set(f.id, m)
  }
  const parts = [...mix.values()].sort((x, y) => y.n - x.n)
  const unlabelled = known - parts.reduce((s, m) => s + m.n, 0)
  const derivedOnly = list.every((t) => t.derived)

  return (
    <div className="page provinces">
      <div className="eyebrow">Provinces</div>
      <h1 className="h1">诸侯图</h1>
      <p className="lede">
        三十一个省级单位的党委书记与省长（主席、市长），逐年着色。地方主官是进入中央的必经之路，也是落马最密集的一层；看谁的旧部坐满了哪片地图，比读任何派系名单都直观。
      </p>

      <div className="pv-controls">
        <button className="pv-play" onClick={() => (year >= LAST ? (setYear(FIRST), setPlaying(true)) : setPlaying(!playing))} aria-label={playing ? '暂停' : '播放'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <div className="pv-year">
          <b>{year}</b>
          <input type="range" min={FIRST} max={LAST} value={year} onChange={(e) => (setPlaying(false), setYear(+e.target.value))} aria-label="年份" />
        </div>
        <div className="seg" role="tablist" aria-label="职位">
          {(['sec', 'gov'] as const).map((k) => (
            <button key={k} className={post === k ? 'on' : undefined} onClick={() => setPost(k)}>
              {k === 'sec' ? '党委书记' : '省长 / 主席'}
            </button>
          ))}
        </div>
        <div className="seg" role="tablist" aria-label="派系框架">
          <button className={framePick === 'auto' ? 'on' : undefined} onClick={() => setFramePick('auto')} title="2012 年前用经典框架，之后用习时期履历网络">
            按年份
          </button>
          {(Object.keys(FRAMES) as Frame[])
            .filter((f) => f !== 'army')
            .map((f) => (
              <button key={f} className={framePick === f ? 'on' : undefined} onClick={() => setFramePick(f)} title={FRAMES[f].name}>
                {FRAMES[f].short}
              </button>
            ))}
        </div>
      </div>

      <div className="pv-mix" aria-label="派系构成">
        <div className="pv-mix-bar">
          {parts.map((m) => (
            <span key={m.name} style={{ flex: m.n, background: m.color }} title={`${m.name} ${m.n}`} />
          ))}
          {unlabelled > 0 && <span style={{ flex: unlabelled }} className="none" title={`未标注 ${unlabelled}`} />}
          {31 - known > 0 && <span style={{ flex: 31 - known }} className="missing" title={`未收录 ${31 - known}`} />}
        </div>
        <div className="pv-mix-legend">
          <span className="m">{year} 年 · {FRAMES[frame].name} · {POST_LABEL[post]}已收录 {known}/31</span>
          {parts.map((m) => (
            <span key={m.name}>
              <i style={{ background: m.color }} />
              {m.name} {m.n}
            </span>
          ))}
          {fell > 0 && <span className="pv-fell">其中 {fell} 人后来落马</span>}
        </div>
      </div>

      <div className="pv-grid">
        <ProvMap year={year} post={post} frame={frame} pick={pick} onPick={setPick} />
        <ProvPanel prov={pick} frame={frame} year={year} />
      </div>

      <Section
        title="诸侯谱"
        note={
          <>
            按六大区排列，每省上条为书记、下条为省长；色块是任期，红竖线是任上或卸任后落马的时间点。点年份跳转，点色块进入传记。
            {derivedOnly && ' 主官名录仍在整理，目前由人物条目里的履历推得，空白处是尚未收录的人。'}
          </>
        }
      >
        <Ledger year={year} frame={frame} pick={pick} onPick={setPick} onYear={(y) => (setPlaying(false), setYear(y))} />
      </Section>
    </div>
  )
}

function ProvPanel({ prov, frame, year }: { prov: Province; frame: Frame; year: number }) {
  const a = useAtlas()
  const list = tenures(a)
    .filter((t) => t.prov === prov)
    .sort((x, y) => y.from - x.from)
  const region = Object.entries(REGIONS).find(([, ps]) => (ps as readonly string[]).includes(prov))?.[0]
  const now = (t: (typeof list)[number]) => t.from <= year + 0.5 && t.to > year + 0.5
  return (
    <aside className="pv-panel">
      <div className="eyebrow">
        {region} · 历任主官 {cnNum(list.length)} 任
      </div>
      <h2 className="h2">{prov}</h2>
      {list.length === 0 && <p className="m">尚未收录。</p>}
      <ol className="pv-list">
        {list.map((t, i) => {
          const f = t.p && a.factionIn(t.p, frame)
          const fell = fellAfter(t)
          const body = (
            <>
              <span className="pv-face-s">{t.p ? <Portrait p={t.p} size={38} /> : <span className="pv-init">{t.name.slice(0, 1)}</span>}</span>
              <span className="pv-who">
                <b>{t.name}</b>
                {t.acting && <span className="m">（代）</span>}
                <span className="m">
                  {POST_LABEL[t.post]} · {yearSpan(t)}
                </span>
                {f && (
                  <span className="pv-f" style={{ color: f.color }}>
                    ● {f.name}
                  </span>
                )}
              </span>
              {fell && (
                <span className="pv-seal" title={`${short(fell)} 落马`}>
                  <Seal size={34} tilt={-8} />
                </span>
              )}
            </>
          )
          return (
            <li key={i} className={now(t) ? 'on' : undefined}>
              {t.p ? <a href={personHref(t.p.id)}>{body}</a> : <div>{body}</div>}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
