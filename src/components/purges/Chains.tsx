// 牵连网络: who went down together. Each case record names the people it drew in; cases that share a
// person are joined into one chain, largest first.
import { CHAIN_RELS } from '../../data/schema'
import type { Fall } from '../../lib/purge'
import { personHref } from '../../lib/router'
import { useAtlas } from '../../state'
import { Portrait, Srcs } from '../bits'

export function Chains({ list }: { list: Fall[] }) {
  const a = useAtlas()
  const withLinks = list.filter((f) => f.c.with.length)
  // union of cases that name each other or a common person
  const key = (x: { id?: string; name: string }) => x.id ?? `name:${x.name}`
  const parent = new Map<string, string>()
  const find = (k: string): string => {
    const p = parent.get(k) ?? k
    if (p === k) return k
    const r = find(p)
    parent.set(k, r)
    return r
  }
  const join = (x: string, y: string) => parent.set(find(x), find(y))
  for (const f of withLinks) for (const w of f.c.with) join(f.p.id, key(w))
  const groups = new Map<string, Fall[]>()
  for (const f of withLinks) groups.set(find(f.p.id), [...(groups.get(find(f.p.id)) ?? []), f])
  const chains = [...groups.values()]
    .map((fs) => ({ fs, size: new Set(fs.flatMap((f) => [f.p.id, ...f.c.with.map(key)])).size }))
    .sort((x, y) => y.size - x.size)
  if (!chains.length) return <p className="muted">案件记录里还没有牵连关系。</p>
  return (
    <div className="chains">
      {chains.slice(0, 24).map(({ fs, size }) => (
        <div key={fs[0].p.id} className="chain">
          <div className="chain-head">
            <b>{fs.map((f) => f.p.name).join('、')}</b>
            <span className="m">{size} 人</span>
          </div>
          {fs.map((f) => (
            <div key={f.p.id} className="chain-case">
              <a href={personHref(f.p.id)} className="chain-lead">
                <Portrait p={f.p} size={30} />
                {f.p.name}
              </a>
              <ul>
                {f.c.with.map((w) => {
                  const p = w.id ? a.person.get(w.id) : undefined
                  return (
                    <li key={key(w)}>
                      <span className="chain-rel">{CHAIN_RELS[w.rel]}</span>
                      {p ? <a href={personHref(p.id)}>{p.name}</a> : <span>{w.name}</span>}
                      <span className="chain-text">{w.text}</span>
                      <Srcs cites={[w.cite]} />
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
