// 党章宪法逐版对照: two versions side by side as one text, deletions struck in seal red and insertions
// underlined in gold; unchanged runs fold away, a minimap on the right marks where the changes sit.
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useKept } from '../../lib/router'
import type { CorpusR } from '../../data/db'
import { diff, paragraphs, type Row } from '../../lib/diff'
import { useAtlas } from '../../state'

const KINDS = { charter: '党章', constitution: '宪法' } as const
type Kind = keyof typeof KINDS
const HEAD = /^(序言|总纲|目录|第[一二三四五六七八九十]+章\s|第[一二三四五六七八九十]+节\s)/
const CONTEXT = 1

const cache = new Map<string, Promise<string>>()
const load = (id: string) => {
  if (!cache.has(id)) cache.set(id, fetch(`data/texts/${id}.txt`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status))))))
  return cache.get(id)!
}

function useText(id?: string) {
  const [text, setText] = useState<{ id: string; body: string | null }>()
  useEffect(() => {
    if (!id) return
    let live = true
    load(id).then(
      (body) => live && setText({ id, body }),
      () => live && setText({ id, body: null }),
    )
    return () => {
      live = false
    }
  }, [id])
  return text && text.id === id ? text.body : undefined
}

export function Versions() {
  const a = useAtlas()
  const [kind, setKind] = useKept<Kind>('charter')
  const docs = useMemo(() => a.db.corpus.filter((d) => d.kind === kind).sort((x, y) => x.date.localeCompare(y.date)), [a, kind])
  const [pick, setPick] = useKept<{ from?: string; to?: string }>({})
  const to = docs.find((d) => d.id === pick.to) ?? docs.at(-1)
  const from = docs.find((d) => d.id === pick.from && d.date < (to?.date ?? '')) ?? docs.filter((d) => d.date < (to?.date ?? '')).at(-1)
  const [numbers, setNumbers] = useKept(true)
  const [full, setFull] = useKept(false)
  const A = useText(from?.id)
  const B = useText(to?.id)
  const rows = useMemo(() => (A && B ? diff(paragraphs(A), paragraphs(B), numbers) : []), [A, B, numbers])
  // unfolded runs belong to one pair of versions
  const view = `${from?.id}|${to?.id}|${numbers}`
  const [unfolded, setUnfolded] = useState<{ view: string; rows: Set<number> }>({ view, rows: new Set() })
  const open = unfolded.view === view ? unfolded.rows : new Set<number>()
  const setOpen = (f: (s: Set<number>) => Set<number>) => setUnfolded({ view, rows: f(open) })

  const chips = (list: CorpusR[], on: CorpusR | undefined, set: (id: string) => void, disabled: (d: CorpusR) => boolean) => (
    <div className="vs-chips">
      {list.map((d) => (
        <button key={d.id} className={d.id === on?.id ? 'on' : undefined} disabled={disabled(d)} onClick={() => set(d.id)} title={d.title}>
          {d.date.slice(0, 4)}
        </button>
      ))}
    </div>
  )

  const tally = { changed: 0, added: 0, removed: 0, plus: 0, minus: 0 }
  for (const r of rows) {
    if (r.kind === 'changed') {
      tally.changed++
      tally.plus += r.plus
      tally.minus += r.minus
    } else if (r.kind === 'added') {
      tally.added++
      tally.plus += r.text.length
    } else if (r.kind === 'removed') {
      tally.removed++
      tally.minus += r.text.length
    }
  }
  // the heading each row sits under, for context above each change
  const heads: (string | undefined)[] = []
  let cur: string | undefined
  for (const r of rows) {
    const t = r.kind === 'changed' ? r.segs.map((s) => (s.op === '-' ? '' : s.text)).join('') : r.text
    if (HEAD.test(t) && t.length < 40) cur = t
    heads.push(cur)
  }
  const near = new Set<number>()
  rows.forEach((r, i) => {
    if (r.kind !== 'same') for (let k = i - CONTEXT; k <= i + CONTEXT; k++) near.add(k)
  })
  const show = (i: number) => i >= 0 && i < rows.length && (full || near.has(i) || open.has(i) || rows[i].kind !== 'same')

  return (
    <div className="versions">
      <div className="vs-bar">
        <div className="seg">
          {(Object.keys(KINDS) as Kind[]).map((k) => (
            <button key={k} className={k === kind ? 'on' : undefined} onClick={() => (setKind(k), setPick({}))}>
              {KINDS[k]}
            </button>
          ))}
        </div>
        <div className="vs-pick">
          <span className="m">旧版</span>
          {chips(docs, from, (id) => setPick({ ...pick, from: id }), (d) => d.date >= (to?.date ?? ''))}
          <span className="vs-arrow">→</span>
          <span className="m">新版</span>
          {chips(docs, to, (id) => setPick({ ...pick, to: id }), (d) => d.date <= (docs[0]?.date ?? ''))}
        </div>
        <label className="vs-opt">
          <input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /> 忽略条号变动
        </label>
        <label className="vs-opt">
          <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} /> 显示全文
        </label>
      </div>

      {docs.length < 2 ? (
        <div className="empty">{KINDS[kind]}目前只收录了 {docs.length} 版，其余版本的全文正在入库。</div>
      ) : A === null || B === null ? (
        <div className="empty">全文载入失败</div>
      ) : !rows.length ? (
        <div className="empty">载入中</div>
      ) : (
        <>
          <div className="vs-sum">
            <b>
              {from?.short} → {to?.short}
            </b>
            <span>改 {tally.changed} 段</span>
            <span>增 {tally.added} 段</span>
            <span>删 {tally.removed} 段</span>
            <span className="plus">+{tally.plus} 字</span>
            <span className="minus">−{tally.minus} 字</span>
          </div>
          <div className="vs-grid">
            <div className="vs-doc">
              {rows.map((r, i) => {
                if (!show(i)) {
                  if (i === 0 || show(i - 1)) {
                    let n = i
                    while (n < rows.length && !show(n)) n++
                    return (
                      <button key={i} className="vs-fold" onClick={() => setOpen((s) => new Set([...s, ...Array.from({ length: n - i }, (_, k) => i + k)]))}>
                        未改动 {n - i} 段{heads[n - 1] ? ` · ${heads[n - 1]}` : ''}
                      </button>
                    )
                  }
                  return null
                }
                const headChanged = r.kind !== 'same' && heads[i] && heads[i] !== heads[i - 1] && !show(i - 1)
                return (
                  <Fragment key={i}>
                    {headChanged && <div className="vs-head">{heads[i]}</div>}
                    <Para r={r} id={`vs-${i}`} />
                  </Fragment>
                )
              })}
            </div>
            <MiniMap rows={rows} onJump={(i) => {
              setOpen((s) => new Set([...s, i]))
              requestAnimationFrame(() => document.getElementById(`vs-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
            }} />
          </div>
        </>
      )}
    </div>
  )
}

function Para({ r, id }: { r: Row; id: string }) {
  const head = (t: string) => HEAD.test(t) && t.length < 40
  if (r.kind === 'same')
    return (
      <p id={id} className={head(r.text) ? 'vs-p same h' : 'vs-p same'}>
        {r.renumbered && <span className="vs-renum" title="条号变动">{r.renumbered[0]}→</span>}
        {r.text}
      </p>
    )
  if (r.kind === 'added')
    return (
      <p id={id} className="vs-p added">
        <ins>{r.text}</ins>
      </p>
    )
  if (r.kind === 'removed')
    return (
      <p id={id} className="vs-p removed">
        <del>{r.text}</del>
      </p>
    )
  return (
    <p id={id} className="vs-p changed">
      {r.segs.map((s, k) => (s.op === '=' ? <span key={k}>{s.text}</span> : s.op === '+' ? <ins key={k}>{s.text}</ins> : <del key={k}>{s.text}</del>))}
    </p>
  )
}

function MiniMap({ rows, onJump }: { rows: Row[]; onJump: (i: number) => void }) {
  return (
    <div className="vs-map" aria-label="改动位置">
      {rows.map((r, i) =>
        r.kind === 'same' ? null : (
          <button key={i} className={`vs-tick ${r.kind}`} style={{ top: `${(i / rows.length) * 100}%` }} onClick={() => onJump(i)} aria-label={`第 ${i + 1} 段`} />
        ),
      )}
    </div>
  )
}
