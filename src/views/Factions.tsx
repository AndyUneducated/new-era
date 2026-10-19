import { Portrait, Section } from '../components/bits'
import { AgeRule, SeatShare } from '../components/charts'
import { Constellation } from '../components/Constellation'
import { FactionRiver } from '../components/FactionRiver'
import { FrameFlow } from '../components/FrameFlow'
import { MediaSplit } from '../components/MediaSplit'
import { Overlap } from '../components/Overlap'
import { FRAMES, type Frame } from '../data/schema'
import { outlet } from '../lib/outlet'
import { factionHref, useKept } from '../lib/router'
import { useAtlas } from '../state'

const FRAME_NOTE: Record<Frame, string> = {
  classic: '胡温时期海外媒体最常用的分法：江泽民的上海帮、胡锦涛的共青团系、红二代太子党，以及石油帮、政法系等系统性派别。',
  binary: '布鲁金斯学会李成提出的“一党两派”：以太子党和上海帮为主的精英联盟，与以团派为主的民粹联盟相互制衡。',
  xi: '2012 年后的分析多按习近平本人的履历划分：福建、浙江、上海、陕西旧部，清华同学，以及军工航天系与秘书出身者。',
  purged: '反腐中被整体清算、官方或媒体以“团伙”相称的集团。',
  army: '军中派系：将门之后、福建出身的 31 集团军旧部、装备与火箭军系统，以及西北系。',
}

export function Factions() {
  const a = useAtlas()
  const [frame, setFrame] = useKept<Frame>('classic')
  const list = a.db.factions.filter((f) => f.frame === frame)
  return (
    <div className="page">
      <div className="eyebrow">Factions</div>
      <h1 className="h1">派系</h1>
      <p className="lede">
        派系不是官方概念。这里收录的是各国主流媒体与学者的判断，每个标签都注明出处，并附上原文中下判断的那一句。同一人在不同框架下可以有不同标签，框架之间并不互斥。
      </p>
      <div className="seg" style={{ margin: '20px 0 8px' }}>
        {(Object.keys(FRAMES) as Frame[]).map((f) => (
          <button key={f} className={f === frame ? 'on' : undefined} onClick={() => setFrame(f)}>
            {FRAMES[f].name}
          </button>
        ))}
      </div>
      <p className="muted" style={{ maxWidth: 760, fontSize: 13.5 }}>{FRAME_NOTE[frame]}</p>

      <div className="card pad" style={{ marginTop: 14 }}>
        <Constellation frame={frame} />
      </div>

      <div className="fgrid" style={{ marginTop: 18 }}>
        {list.map((f) => {
          const tagged = a.members.get(f.id) ?? []
          const ids = [...new Set([...f.core, ...tagged.map((m) => m.p.id)])]
          const outlets = new Set(tagged.flatMap((m) => a.source.get(m.tag.cite.split('@')[0])?.publisher ?? []).map(outlet))
          return (
            <a key={f.id} className="card fcard" href={factionHref(f.id)}>
              <span className="bar" style={{ background: f.color }} />
              <h3>{f.name}</h3>
              <div className="en">
                {f.en}
                {f.aka.length > 0 && ` · ${f.aka.join('、')}`}
              </div>
              <div className="small" style={{ color: 'var(--gold)', fontWeight: 600, marginTop: 6 }}>
                {f.basis}
              </div>
              <p>{f.summary}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="avatars">
                  {ids.slice(0, 8).map((id) => {
                    const p = a.person.get(id)
                    return p ? <Portrait key={id} p={p} size={32} /> : null
                  })}
                  {ids.length > 8 && <span className="more">+{ids.length - 8}</span>}
                </div>
                <span className="small muted">
                  {ids.length} 人 · {outlets.size} 家来源
                </span>
              </div>
            </a>
          )
        })}
        {!list.length && <div className="empty">此框架下暂无派系</div>}
      </div>

      <Section title="派系河流" note={`在任中央委员按「${FRAMES[frame].name}」的派系分流，每季度一格：党代会换届时河道改线，任内有人落马时变窄。只计本站已有档案的委员`}>
        <div className="card pad">
          <FactionRiver frame={frame} />
        </div>
      </Section>

      <Section title="媒体判断对照" note="同一个人，各家媒体与学者分到哪一派：一列一家来源，悬停看原话">
        <div className="card pad">
          <MediaSplit frame={frame} />
        </div>
      </Section>

      <Section title="框架之间的流向" note="同一批人，换一种分法会落到哪里：左边一种框架的派系，右边另一种">
        <FrameFlow />
      </Section>

      <Section title="派系重叠" note="两个派系点名了多少相同的人">
        <Overlap />
      </Section>

      <Section title="政治局席位构成" note={`按「${FRAMES[frame].name}」给第十五至二十届政治局全体委员着色；一人有多个标签时取第一个`}>
        <div className="card pad">
          <SeatShare frame={frame} />
        </div>
      </Section>

      <Section title="七上八下" note="每届党代会召开时，上届政治局委员的年龄与去留。红线为 68 岁的惯例分界，2002 年起逐渐成形，2022 年被打破">
        <div className="card pad">
          <AgeRule />
        </div>
      </Section>
    </div>
  )
}
