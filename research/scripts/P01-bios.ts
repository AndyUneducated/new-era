// P01 one-off: map governor / secretary names to zh.wikipedia biography titles (via the list pages' links)
// and report which biographies are already registered in research/manifests/.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

export const NAMES: Record<string, string[]> = {
  天津: ['李盛霖', '戴相龙', '黄兴国', '王东峰', '张国清', '廖国勋', '张工'],
  河北: ['钮茂生', '季允石', '郭庚茂', '胡春华', '陈全国', '张庆伟', '许勤', '王正谱'],
  山西: ['刘振华', '张宝顺', '于幼军', '孟学农', '王君', '李小鹏', '楼阳生', '林武', '蓝佛安', '金湘军', '卢东亮'],
  内蒙古: ['云布龙', '乌云其木格', '杨晶', '巴特尔', '布小林', '王莉霞', '包钢'],
  辽宁: ['张国光', '薄熙来', '张文岳', '陈政高', '李希', '陈求发', '唐一军', '刘宁', '李乐成', '王新伟'],
  吉林: ['洪虎', '王珉', '韩长赋', '王儒林', '巴音朝鲁', '蒋超良', '刘国中', '景俊海', '韩俊', '胡玉亭'],
  黑龙江: ['田凤山', '宋法棠', '张左己', '张左已', '栗战书', '王宪魁', '陆昊', '王文涛', '胡昌升', '梁惠玲'],
  上海: ['徐匡迪', '陈良宇', '韩正', '杨雄', '应勇', '龚正', '朱忠明'],
  江苏: ['季允石', '梁保华', '罗志军', '李学勇', '石泰峰', '吴政隆', '许昆林', '刘小涛'],
  浙江: ['柴松岳', '习近平', '吕祖善', '夏宝龙', '李强', '车俊', '袁家军', '郑栅洁', '王浩', '刘捷'],
  安徽: ['王太华', '许仲林', '王金山', '王三运', '李斌', '王学军', '李锦斌', '李国英', '王清宪', '王东伟'],
  福建: ['习近平', '卢展工', '黄小晶', '苏树林', '于伟国', '唐登杰', '王宁', '赵龙'],
  江西: ['舒圣佑', '黄智权', '吴新雄', '鹿心社', '刘奇', '易炼红', '叶建春'],
  山东: ['李春亭', '张高丽', '韩寓群', '姜大明', '郭树清', '龚正', '李干杰', '周乃翔'],
}

const wt = readFileSync('.probe/P01-gov-wt.txt', 'utf8')
const links = new Map<string, Set<string>>()
for (const m of wt.matchAll(/\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g)) {
  const title = m[1].trim()
  const shown = (m[2] ?? m[1]).replace(/[\s\u3000]/g, '')
  const base = title.replace(/\s*\(.*\)$/, '').replace(/[\s\u3000]/g, '')
  for (const k of [shown, base]) links.set(k, (links.get(k) ?? new Set()).add(title))
}

const registered = new Map<string, string>()
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const e of (parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) as { id: string; url: string }[]) {
      const m = decodeURIComponent(e.url ?? '').match(/zh\.wikipedia\.org\/(?:wiki|zh-hans|zh-cn|zh-hant|zh-tw)\/(.+)$/)
      if (m) registered.set(m[1].replace(/_/g, ' '), `${e.id} [${f}] ${e.url}`)
    }
  } catch {}
}

const out: string[] = []
for (const [prov, names] of Object.entries(NAMES))
  for (const n of names) {
    const ts = [...(links.get(n) ?? [])].filter((t) => !/列表|人民政府|委员会|省$|市$/.test(t))
    out.push(`${prov}\t${n}\t${ts.join(' / ') || '??'}\t${ts.map((t) => registered.get(t)).filter(Boolean).join(' ; ')}`)
  }
writeFileSync('.probe/P01-bios.txt', out.join('\n') + '\n')
