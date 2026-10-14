// K05: look up hand-written claims in the cited texts of a card. Prints each keyword with a hit or MISS.
//   node research/scripts/K05-verify.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const yaml = readFileSync(join(ROOT, 'content', 'people', 'K05.yaml'), 'utf8')
const CHECK: Record<string, string[]> = {
  'hu-changsheng': ['遂宁', '青海省委', '福建省委常委、组织部', '厦门'],
  'yin-hong': ['甘肃省委书记', '江西省委书记', '人大常委会主任'],
  'wei-gang': ['旅顺', '东部战区海军司令员'],
  'wang-yinfang': ['少将', '善后'],
  'cai-songtao': ['唯一', '分管日常工作'],
  'wang-yanling': ['政法委书记', '2020年'],
  'le-yucheng': ['退休', '广播电视总局'],
  'wang-hong': ['海警', '环境与资源保护委员会'],
  'shen-changyu': ['2026', '卸任', '免去'],
  'tang-huajun': ['遥感', '农业与农村委员会'],
  'lei-fanpei': ['动力', '军民融合'],
  'wu-xiaoguang': ['航母', '701'],
  'yang-jincheng': ['电力', '719', '七一九'],
  'feng-zhenglin': ['常委', '经济委员会'],
  'fan-ruiping': ['党组副书记', '人大常委会副主任'],
  'huang-zhixian': ['总会计师', '粮食'],
  'li-xiaobo': ['工业和信息化厅', '太原市长', '太原市人民政府市长'],
  'fang-xiang': ['军事科学院政', '火箭军政治工作部'],
  'pan-yue': ['统战部副部长', '文化文史和学习委员会', '民族事务委员会'],
  'ning-jizhe': ['经济委员会', '夏县', '合肥'],
  'zhang-jiangting': ['潍坊', '统战部'],
  'jiao-yanlong': ['新闻', '记者'],
  'deng-xiaogang-sichuan': ['农业和农村委员会', '常务副书记'],
  'li-jing': ['政协副主席', '2026'],
  'ma-tingli': ['2026', '人大常委会副主任'],
  'miao-jianmin': ['招商银行'],
  'wang-xi': ['统战部', '递补'],
  'wu-zhaohui': ['正部长级', '中国科学院副院长'],
  'xin-changxing': ['江苏省委书记', '安徽省委副书记'],
  'shi-xiaolin': ['普陀', '民政局', '四川省委副书记'],
  'tian-guoli': ['中信银行', '财政经济委员会'],
  'zhao-huan': ['文化和旅游部'],
  'yan-xiaodong': ['陕西省总队', '2023'],
  'shi-zhenglu': ['装甲', '北部战区陆军司令员'],
  'yang-guangyue': ['武警部队副司令员', '武警副司令员'],
  'chen-qing': ['政协副主席', '2020年1月'],
  'he-yaling': ['2015', '院士'],
  'wang-endong': ['2015', '首席科学家'],
  'wang-xiaoyun': ['2025', '总工程师'],
  'li-yinghong': ['院士', '空军工程大学'],
  'song-yushui': ['妇联', '知识产权法院'],
  'yao-zengke': ['社会和法制委员会'],
  'wang-jingqing': ['正部长级', '教科卫体'],
  'kong-changsheng': ['政协主席'],
  'wang-zhaoli': ['农垦'],
}
const out: string[] = []
for (const block of yaml.split(/\n(?=- id: )/)) {
  const id = block.match(/^- id: (\S+)/)?.[1]
  if (!id || !CHECK[id]) continue
  const cites = block.match(/\n {2}cites: \[([^\]]*)\]/)?.[1].split(',').map((s) => s.trim()) ?? []
  const texts = cites.map((c) => {
    const p = join(ROOT, 'sources', 'text', `${c}.txt`)
    return existsSync(p) ? readFileSync(p, 'utf8') : ''
  }).join('\n')
  for (const k of CHECK[id]) {
    const i = texts.indexOf(k)
    out.push(`${id} ${k}: ${i < 0 ? 'MISS' : texts.slice(Math.max(0, i - 50), i + 50).replace(/\s+/g, ' ')}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'K05-verify.txt'), out.join('\n') + '\n', 'utf8')
console.log(out.length)
