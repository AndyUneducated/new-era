// One-off: point R06 notices that 403 at spp.gov.cn to Xinhua / People reprints, with matching markers.
import { readFileSync, writeFileSync } from 'node:fs'
import { parseDocument } from 'yaml'

const file = 'research/manifests/R06.yaml'
const doc = parseDocument(readFileSync(file, 'utf8'))
const fix: Record<string, { publisher: string; start: string }> = {
  'r06-spp-2026-02-06-ni-qiang-expel': { publisher: '新华网（转载中央纪委国家监委网站）', start: '经中共中央批准' },
  'r06-spp-2026-06-15-ni-qiang-charged': { publisher: '新华网', start: '新华社北京6月15日电' },
  'r06-spp-2026-01-04-feng-zhibin-expel': { publisher: '人民网（转载新华网）', start: '新华社北京1月4日电' },
  'r06-spp-2025-09-04-zhou-derui-expel': { publisher: '新华网（转载中央纪委国家监委网站）', start: '经中共中央批准' },
  'r06-spp-2025-07-30-chen-shifei-expel': { publisher: '新华网', start: '经中共中央批准' },
  'r06-spp-2025-04-23-lu-kehua-expel': { publisher: '新华网（转载中央纪委国家监委网站）', start: '经中共中央批准' },
  'r06-spp-2025-03-14-qi-tongsheng-expel': { publisher: '新华网（转载中央纪委国家监委网站）', start: '经中共中央批准' },
  'r06-spp-2025-03-14-sun-yuning-expel': { publisher: '新华网', start: '经中共中央批准' },
  'r06-spp-2025-03-02-du-yubo-expel': { publisher: '人民网（转载人民日报）', start: '本报北京3月2日电' },
  'r06-spp-2024-12-12-gou-zhongwen-expel': { publisher: '人民日报', start: '本报北京12月12日电' },
  'r06-spp-2024-10-11-qin-rupei-expel': { publisher: '新华网', start: '经中共中央批准' },
  'r06-ccdi-2024-10-21-zhang-xiaolian-probe': { publisher: '新华网', start: '新华社北京10月21日电' },
}
const rename = (id: string) =>
  id
    .replace('r06-spp-2026-02-06', 'r06-xinhua-2026-02-06')
    .replace('r06-spp-2026-06-15', 'r06-xinhua-2026-06-15')
    .replace('r06-spp-2026-01-04', 'r06-people-2026-01-04')
    .replace('r06-spp-2025-09-04', 'r06-xinhua-2025-09-04')
    .replace('r06-spp-2025-07-30', 'r06-xinhua-2025-07-30')
    .replace('r06-spp-2025-04-23', 'r06-xinhua-2025-04-23')
    .replace('r06-spp-2025-03-14', 'r06-xinhua-2025-03-14')
    .replace('r06-spp-2025-03-02', 'r06-people-2025-03-02')
    .replace('r06-spp-2024-12-12', 'r06-rmrb-2024-12-12')
    .replace('r06-spp-2024-10-11', 'r06-xinhua-2024-10-11')
    .replace('r06-ccdi-2024-10-21', 'r06-xinhua-2024-10-21')
const web = doc.get('web') as { items: { get: (k: string) => unknown; set: (k: string, v: unknown) => void }[] }
for (const e of web.items) {
  const id = String(e.get('id'))
  const f = fix[id]
  if (!f) continue
  e.set('publisher', f.publisher)
  e.set('start', f.start)
  e.set('id', rename(id))
}
writeFileSync(file, doc.toString({ lineWidth: 0 }))
console.log('ok')
