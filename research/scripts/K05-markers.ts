// Sets start/end markers (and fixes keeps) on hand-registered K05 sources after a first look at the fetched pages.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const file = join(ROOT, 'research', 'manifests', 'K05.yaml')

const MARKS: Record<string, [string, string]> = {
  'k05-chinanews-2026-05-17-wang-xiaodong': ['中新网5月17日电', '纪律审查和监察调查。'],
  'k05-chinanews-2025-07-22-qi-zhala': ['中新社北京7月22日电', '所涉财物一并移送。(完)'],
  'k05-chinanews-2026-06-05-qi-zhala': ['2026年6月5日，重庆市第一中级人民法院', '并当庭表示认罪悔罪。'],
  'k05-xinhua-2025-12-08-bi-jingquan': ['新华社北京12月8日电', '所涉财物一并移送。'],
  'k05-chinanews-2026-09-15-bi-jingquan': ['中新社北京9月15日电', '毕井泉当庭表示认罪悔罪。(完)'],
  'k05-xinhua-2024-12-10-wu-yingjie': ['新华社北京12月10日电', '所涉财物一并移送。'],
  'k05-chinanews-2025-07-16-wu-yingjie': ['中新社北京7月16日电', '法庭遂作出上述判决。(完)'],
  'k05-chinanews-2025-12-08-gou-zhongwen': ['中新社北京12月8日电', '苟仲文当庭表示认罪悔罪。(完)'],
  'k05-chinanews-2024-10-29-sun-zhigang': ['中新社北京10月29日电', '法庭遂作出上述判决。(完)'],
  'k05-xinhua-2025-06-05-wu-cunrong': ['经中共中央批准，中央纪委国家监委对山西省政协原党组书记', '所涉财物一并移送。'],
  'k05-chinanews-2026-03-20-wu-cunrong': ['2026年3月20日，北京市第二中级人民法院', '冀成海)'],
  'k05-chinanews-2026-01-07-wu-shenghua': ['中新社北京1月7日电', '待召开中央委员会全体会议时予以追认。(完)'],
  'k05-chinanews-2023-03-17-jiang-zhigang': ['中新社北京3月17日电', '姜志刚不再担任上述职务。(完)'],
  'k05-rmrb-2023-08-31-jiang-zhigang': ['本报北京8月30日电', '所涉财物一并移送。'],
  'k05-xinhua-2024-10-23-jiang-zhigang': ['新华社石家庄10月23日电', '法庭遂作出上述判决。'],
  'k05-thepaper-2024-12-21-kou-wei': ['中央纪委国家监委网站12月21日午间发布消息', '纪律审查和监察调查。'],
  'k05-chinanews-2025-06-06-kou-wei': ['中新网 6月6日电', '所涉财物一并移送。'],
  'k05-chinanews-2026-04-01-kou-wei': ['2026年4月1日，内蒙古自治区兴安盟中级人民法院', '旁听了庭审。'],
  'k05-xinhua-2026-04-12-ding-yexian': ['新华社北京4月12日电', '纪律审查和监察调查。'],
  'k05-xinhua-2026-10-09-ding-yexian': ['新华社北京10月9日电', '所涉财物一并移送。'],
  'k05-xinhua-2026-02-12-wang-lixia': ['新华社北京2月12日电', '待召开中央委员会全体会议时予以追认。'],
  'k05-chinanews-2026-06-03-wang-lixia': ['中新社北京6月3日电', '“对家属失管失教”等。(完)'],
  'k05-ccdi-2019-05-19-liu-shiyu': ['中华全国供销合作总社党组副书记、理事会主任刘士余同志涉嫌违纪违法', '（简历摘自中国共产党新闻网）'],
  'k05-cctv-2019-10-04-liu-shiyu': ['日前，经中共中央批准', '（简历综合自中国共产党新闻网）'],
  'k05-nbd-2019-10-31-4th-plenum': ['新华社消息，中国共产党第十九届中央委员会第四次全体会议', '留党察看二年的处分。'],
  'k05-chinanews-2021-12-01-zhang-jinghua': ['中新社北京12月1日电', '张敬华参加了审议。(完)'],
  'k05-xinhua-2022-05-31-zhang-jinghua': ['日前，经中共中央批准', '待召开中央委员会全体会议时予以追认。'],
  'k05-xinhua-2023-11-21-zhang-jinghua': ['新华社武汉11月21日电', '法庭遂作出上述判决。'],
  'k05-xinhua-2026-03-02-cppcc': ['新华社北京3月2日电', '何松第十四届全国政协委员资格的决定。'],
  'k05-xinhua-2018-10-21-zheng-xiaosong': ['中央人民政府驻澳门特别行政区联络办公室主任郑晓松同志', '慰问郑晓松同志亲属。'],
  'k05-xinhua-2020-03-18-guan-qing': ['新华社北京3月18日电', '第十九届中央委员会候补委员。'],
  'k05-ce-2021-08-20-bu-xiaolin': ['中国经济网北京8月20日综合报道', '十九届中央委员，十二届全国人大代表。'],
  'k05-xinhua-2023-06-14-xu-qin': ['许勤，男，1961年10月生', '黑龙江省委书记、省人大常委会主任'],
  'k05-people-zhou-naixiang': ['周乃翔，男，汉族', '第十九届中央候补委员。'],
  'k05-xinhua-2023-10-28-tang-dengjie': ['新华网太原10月28日电', '二十届中央委员。'],
  'k05-xinhua-2017-03-03-zhang-gong': ['据江西日报消息', '市政府党组副书记、常务副市长。'],
  'k05-tjgov-zhang-gong': ['张工，男，汉族', '分管审计工作。'],
  'k05-xinhua-2026-09-22-hu-changsheng': ['新华网拉萨9月22日电', '不再担任区党委书记职务。'],
  'k05-people-2017-05-31-yan-zhichan': ['中国共产党新闻网北京5月31日电', '2017年5月任广东省委常委、统战部部长。'],
  'k05-thepaper-2018-song-dan': ['军方权威媒体近日的公开新闻报道披露', '宋丹是十三届全国人大代表。'],
}
const KEEPS: Record<string, string> = {
  'k05-cna-2025-12-24-cppcc': '馬正武, 曹建國',
}
const DROP = ['k05-spp-2024-12-12-gou-zhongwen', 'k05-spp-2024-02-05-sun-zhigang', 'k05-bjnews-2026-04-01-kou-wei']
const ADD_AFTER = 'k05-bjnews-2026-04-01-kou-wei'
const ADD = [
  '  - { id: k05-thepaper-2024-12-21-kou-wei, title: 大唐集团原总经理寇伟退休2年后被查, publisher: 澎湃新闻, date: 2024-12-21, voice: official, url: https://www.thepaper.cn/newsDetail_forward_29716356 }',
  '  - { id: k05-chinanews-2025-06-06-kou-wei, title: 中国大唐原党组副书记、总经理寇伟严重违纪违法被开除党籍, publisher: 中国新闻网, date: 2025-06-06, voice: official, url: https://www.chinanews.com.cn/gn/2025/06-06/10427899.shtml }',
  '  - { id: k05-chinanews-2026-04-01-kou-wei, title: 中国大唐原总经理寇伟一审被判死缓, publisher: 中国新闻网, date: 2026-04-01, voice: official, url: https://www.chinanews.com.cn/gn/2026/04-01/10596709.shtml }',
]

const q = (s: string) => JSON.stringify(s)
const out: string[] = []
for (let line of readFileSync(file, 'utf8').split('\n')) {
  const id = line.match(/id: (k05-[a-z0-9-]+),/)?.[1]
  if (id && id === ADD_AFTER) out.push(...ADD)
  if (id && DROP.includes(id)) continue
  if (id && MARKS[id] && !line.includes(' start: ')) {
    const [s, e] = MARKS[id]
    line = line.replace(/ \}\s*$/, `, start: ${q(s)}, end: ${q(e)} }`)
  }
  if (id && KEEPS[id]) line = line.replace(/keep: \[[^\]]*\]/, `keep: [ ${KEEPS[id]} ]`)
  out.push(line)
}
for (const id of Object.keys(MARKS)) if (!out.some((l) => l.includes(`id: ${id},`))) console.log('not in manifest', id)
writeFileSync(file, out.join('\n'), 'utf8')
console.log('ok')
