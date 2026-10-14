import type { Frame } from '../../data/schema'
import { POST_LABEL, fellAfter, yearSpan, type Tenure } from '../../lib/chiefs'
import { short } from '../../lib/dates'
import { useAtlas } from '../../state'

// one tenure in a tooltip: post, name, years, faction in the frame, and the fall if any
export function TenureTip({ t, frame }: { t: Tenure; frame: Frame }) {
  const a = useAtlas()
  const f = t.p && a.factionIn(t.p, frame)
  const fell = fellAfter(t)
  return (
    <div style={{ marginTop: 4 }}>
      <span className="m">{POST_LABEL[t.post]}</span> <b>{t.name}</b>
      {t.acting && <span className="m">（代）</span>} <span className="m">{yearSpan(t)}</span>
      {f && <span style={{ color: f.color, fontWeight: 700 }}> ● {f.name}</span>}
      {fell && <div style={{ color: '#f6a38f' }}>{short(fell)} 落马</div>}
    </div>
  )
}
