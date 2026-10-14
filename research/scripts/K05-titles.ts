// Uses each page's own headline (first line of the unmarked first fetch, saved in .probe/K05-peek.txt) as the
// manifest title, and sets the excerpt keeps of the zh-voice sources.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const file = join(ROOT, 'research', 'manifests', 'K05.yaml')

const heads = new Map<string, string>()
const peek = readFileSync(join(ROOT, '.probe', 'K05-peek.txt'), 'utf8').split('\n')
for (let k = 0; k < peek.length; k++) {
  const m = peek[k].match(/^### (k05-[a-z0-9-]+) \(\d+\)/)
  if (!m) continue
  const t = peek[k + 1]
    .replace(/[-_](中新网|新华网|中央纪委网站)$/, '')
    .replace(/ \| (联合早报|每日经济新闻)$/, '')
    .replace(/ \| 兩岸 \| 中央社 CNA$/, '')
    .replace(/_新闻频道_央视网\(cctv\.com\)$/, '')
    .replace(/--组织人事-人民网$/, '')
    .replace(/_人事风向_澎湃新闻-The Paper$/, '')
    .replace(/_天津政务网$/, '')
    .replace(/ - 人民网 地方领导资料库$/, '')
    .trim()
  if (t) heads.set(m[1], t)
}
heads.set('k05-ce-2021-08-20-bu-xiaolin', '内蒙古自治区原主席布小林任全国人大环资委副主任委员(图|简历)')
heads.set('k05-thepaper-2024-12-21-kou-wei', '大唐集团原总经理寇伟退休2年后被查，曾任国家电网公司董事长')
heads.set('k05-chinanews-2025-06-06-kou-wei', '中国大唐原党组副书记、总经理寇伟严重违纪违法被开除党籍')
heads.set('k05-chinanews-2026-04-01-kou-wei', '受贿数额特别巨大 中国大唐原总经理寇伟一审被判死缓')

const KEEPS: Record<string, string> = {
  'k05-cna-2025-12-24-cppcc': '馬正武, 曹建國',
  'k05-zaobao-2026-03-20-cas': '刘国治, 杨伟',
  'k05-cna-2022-09-27-20th-delegates': '尚宏',
  'k05-zaobao-2023-08-03-shang-hong': '尚宏',
  'k05-cna-2026-07-03-air-force': '常丁求',
}

const q = (s: string) => (/[:#{}\[\],&*?|<>=!%@`'"]/.test(s) ? JSON.stringify(s) : s)
const out = readFileSync(file, 'utf8').split('\n').map((line) => {
  const id = line.match(/id: (k05-[a-z0-9-]+),/)?.[1]
  if (!id || id.startsWith('k05-wiki-')) return line
  const h = heads.get(id)
  if (h) line = line.replace(/title: (?:"(?:[^"\\]|\\.)*"|[^,]*), publisher:/, () => `title: ${q(h)}, publisher:`)
  if (KEEPS[id] && !line.includes('keep:')) line = line.replace(/ \}\s*$/, `, excerpt: true, keep: [ ${KEEPS[id]} ] }`)
  return line
})
writeFileSync(file, out.join('\n'), 'utf8')
console.log('titles', heads.size)
