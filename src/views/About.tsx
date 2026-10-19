import { Section, VoiceTag } from '../components/bits'
import { QUOTE_KINDS, VOICES, type Voice } from '../data/schema'
import { useAtlas } from '../state'

export function About() {
  const a = useAtlas()
  const byVoice = new Map<Voice, number>()
  for (const s of a.db.sources) byVoice.set(s.voice, (byVoice.get(s.voice) ?? 0) + 1)
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="eyebrow">About</div>
      <h1 className="h1">体例与来源说明</h1>
      <div className="prose">
        <p>
          本站整理 2000 年以来中国大陆政治的人物、派系、事件与官方思想，重点在习近平时期。所有内容都来自可公开访问的来源，每条判断都标明出处。
        </p>
        <p>
          <b>引文逐字核对。</b>凡是加引号的话，构建时都会和本站存档的来源原文逐字比对，对不上就不能发布。官方文件全文存档；媒体报道和学者文章只存相关段落，并记录网页指纹。
        </p>
        <p>
          <b>派系是别人的判断。</b>中共不承认党内有派系。本站的派系标签全部来自西方、日本、港台与海外中文媒体、学者以及官方媒体，并附上原文中下判断的那一句。不收录大纪元、看中国、新唐人、博讯、多维等以传闻为主的网站。
        </p>
        <p>
          <b>名言分五类：</b>
          {Object.values(QUOTE_KINDS).join('、')}。“流传”类只说明哪篇报道载有此话，不代表其真实。
        </p>
        <p>
          <b>家族与财富</b>只收录有主流媒体调查报道的内容。照片优先使用维基共享资源的自由授权图片，其次为官方标准像，均注明出处与授权。
        </p>
      </div>
      <Section title="来源构成">
        <div className="chips">
          {(Object.keys(VOICES) as Voice[]).filter((v) => byVoice.get(v)).sort((x, y) => byVoice.get(y)! - byVoice.get(x)!).map((v) => (
            <span key={v} className="chip">
              <VoiceTag v={v} /> {byVoice.get(v)}
            </span>
          ))}
        </div>
      </Section>
    </div>
  )
}
