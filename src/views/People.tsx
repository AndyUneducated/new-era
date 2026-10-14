import { useMemo, useState } from 'react'
import { Portrait, Status } from '../components/bits'
import type { PersonR } from '../data/db'
import { FRAMES, ROLES, STATUS, type Role, type Status as St } from '../data/schema'
import { age } from '../lib/dates'
import { personHref } from '../lib/router'
import { useAtlas } from '../state'

// each person is shown once, under the first of these groups they belong to
const GROUPS: [string, Role[]][] = [
  ['政治局常委', ['psc']],
  ['政治局委员与书记处', ['pb', 'sec']],
  ['军委与将领', ['cmc', 'general']],
  ['落马官员', ['tiger']],
  ['中央委员、省部级', ['cc', 'acc', 'ccdi', 'prov', 'minister']],
  ['体制外与异见者', ['dissent']],
  ['企业家', ['biz']],
  ['港澳台', ['hkmt']],
  ['学者与媒体人', ['scholar', 'media']],
  ['家属', ['family']],
]

const groupOf = (p: PersonR) => GROUPS.findIndex(([, rs]) => rs.some((r) => p.roles.includes(r)))

export function People() {
  const a = useAtlas()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [status, setStatus] = useState<St | ''>('')
  const [fac, setFac] = useState('')
  const [full, setFull] = useState(false)

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return a.db.people.filter(
      (p) =>
        (!t || [p.name, p.pinyin, ...p.aka, p.headline].join(' ').toLowerCase().includes(t)) &&
        (!role || p.roles.includes(role)) &&
        (!status || p.status === status) &&
        (!fac || p.factions.some((x) => x.f === fac)) &&
        (!full || p.tier === 1),
    )
  }, [a, q, role, status, fac, full])

  const groups = GROUPS.map(([name], gi) => ({
    name,
    list: shown.filter((p) => groupOf(p) === gi).sort((x, y) => x.tier - y.tier || (x.born ?? '9').localeCompare(y.born ?? '9')),
  })).filter((g) => g.list.length)

  return (
    <div className="page">
      <div className="eyebrow">People</div>
      <h1 className="h1">人物</h1>
      <p className="lede">
        共 {a.db.people.length} 人，其中 {a.db.people.filter((p) => p.tier === 1).length} 人有完整传记。照片为灰度者已落马或在押。
      </p>
      <div className="filters">
        <input type="search" placeholder="姓名、拼音、职务" value={q} onChange={(e) => setQ(e.target.value)} aria-label="筛选人物" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="身份">
          <option value="">全部身份</option>
          {Object.entries(ROLES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as St)} aria-label="状态">
          <option value="">全部状态</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={fac} onChange={(e) => setFac(e.target.value)} aria-label="派系">
          <option value="">全部派系</option>
          {(Object.keys(FRAMES) as (keyof typeof FRAMES)[]).map((fr) => (
            <optgroup key={fr} label={FRAMES[fr].name}>
              {a.db.factions
                .filter((f) => f.frame === fr)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <button className={`chip${full ? ' on' : ''}`} onClick={() => setFull(!full)} style={{ height: 36, padding: '0 14px' }}>
          仅完整传记
        </button>
        <span className="muted small">{shown.length} 人</span>
      </div>
      {groups.map((g) => (
        <div key={g.name}>
          <div className="group-title">
            {g.name} <small>{g.list.length}</small>
          </div>
          <div className="grid-people">
            {g.list.map((p) => (
              <PersonCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      ))}
      {!groups.length && <div className="empty">没有符合条件的人物</div>}
    </div>
  )
}

export function PersonCard({ p }: { p: PersonR }) {
  const a = useAtlas()
  const tags = p.factions.map((t) => a.faction.get(t.f)).filter((f, i, all) => f && all.indexOf(f) === i).slice(0, 3)
  const yrs = age(p.born, p.died)
  return (
    <a className="card pcard" href={personHref(p.id)}>
      <Portrait p={p} size={60} />
      <div className="who" style={{ minWidth: 0 }}>
        <b>
          {p.name}
          {p.tier === 1 && <span className="tier1">传</span>}
        </b>
        <div className="hl">{p.headline}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Status p={p} />
          {yrs !== undefined && <span className="small muted">{p.died ? `享年 ${yrs}` : `${yrs} 岁`}</span>}
          {tags.map((f) => (
            <span key={f!.id} title={f!.name} style={{ width: 8, height: 8, borderRadius: 4, background: f!.color, display: 'inline-block' }} />
          ))}
        </div>
      </div>
    </a>
  )
}
