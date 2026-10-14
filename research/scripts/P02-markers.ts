// P02 one-off: add start/end markers (and corrected titles) to the appointment notices in research/manifests/P02.yaml.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const p02 = join(import.meta.dirname, '..', 'manifests', 'P02.yaml')

const m: Record<string, [string, string, string?]> = {
  'p02-xinhua-2024-12-31-henan-guangxi-sec': ['新华社北京12月31日电', '陈刚同志任广西壮族自治区党委委员、常委、书记。'],
  'p02-xinhua-2026-09-23-anhui-3-sec': ['新华社北京9月23日电', '赵龙同志任福建省委书记。'],
  'p02-people-2021-04-06-wang-kai-acting': ['2021年4月2日，河南省', '现予公告。'],
  'p02-xinhua-2026-09-24-wang-lujin-acting': ['关于王陆进代理河南省人民政府省长职务的决定', '王陆进代理河南省人民政府省长职务。'],
  'p02-xinhua-2024-12-31-hubei-qinghai-sec': ['新华社北京12月31日电', '陈刚同志不再担任青海省委书记、常委、委员职务。'],
  'p02-xinhua-2026-05-30-hubei-sec': ['新华社北京5月30日电', '另有任用。'],
  'p02-xinhua-2021-05-07-wang-zhonglin-acting': ['新华社武汉5月7日电', '代理省长。'],
  'p02-xinhua-2025-01-02-li-dianxun-acting': ['1月2日下午，湖北省', '（记者 王婧）'],
  'p02-xinhua-2025-01-20-li-dianxun-elected': ['新华社武汉1月20日电', '选举李殿勋为湖北省人民政府省长。'],
  'p02-xinhua-2023-03-14-hunan-3-sec': ['新华社北京3月14日电', '冯飞同志任海南省委书记。'],
  'p02-xinhua-2020-11-27-mao-weiming-acting': ['新华社长沙11月27日电', '副省长、代理省长。'],
  'p02-chinanews-2002-02-02-zhang-yunchuan': ['湖南省九届人大五次会议2日下午', '第九届全国人大代表(新疆)。'],
  'p02-xinhua-2021-12-29-wang-weizhong-acting': ['27日上午，广东省十三届', '(记者 程景伟)'],
  'p02-xinhua-2025-10-11-meng-fanli-acting': ['新华社广州10月11日电', '副省长、代省长。'],
  'p02-xinhua-2025-10-15-meng-fanli-elected': ['新华社广州10月15日电', '为广东省人民政府省长。'],
  'p02-xinhua-2021-10-19-guangxi-yunnan-sec': ['新华社北京10月19日电', '阮成发同志不再担任云南省委书记、常委、委员职务。'],
  'p02-people-2020-10-19-lan-tianli-acting': ['中国共产党新闻网北京10月19日电', '第十八、十九届中央候补委员。'],
  'p02-xinhua-2021-01-25-lan-tianli-elected': ['新华社南宁1月25日电', '（简历来源：广西壮族自治区政府网站）'],
  'p02-xinhua-2025-07-03-wei-tao-acting': ['7月3日下午，自治区十四届', '（记者 佘鸿雁）'],
  'p02-xinhua-2020-12-01-fujian-hainan-sec': ['新华社北京12月1日电', '刘赐贵同志不再担任海南省委书记、常委、委员职务。'],
  'p02-people-2020-12-03-feng-fei-acting': ['12月2日下午，海南省六届人大常委会', '记者李磊 况昌勋'],
  'p02-xinhua-2023-05-31-liu-xiaoming-elected': ['新华社海口5月31日电', '选举刘小明为海南省省长。', '冯飞当选海南省人大常委会主任 刘小明当选海南省省长'],
  'p02-xinhua-2022-12-08-chongqing-sec': ['新华网重庆12月8日电', '中央政治局委员。'],
  'p02-xinhua-2022-01-21-hu-henghua-elected': ['新华社重庆1月21日电', '选举胡衡华为重庆市市长。'],
  'p02-xinhua-2026-07-31-chen-xinwu-acting': ['新华社重庆7月31日电', '副市长、代理市长。'],
  'p02-xinhua-2018-01-02-tang-liangzhi-acting': ['新华社重庆１月２日电', '四届、五届市委委员'],
  'p02-xinhua-2018-01-31-tang-liangzhi-elected': ['新华社重庆１月３１日电', '选举杨临萍为市高级人民法院院长。'],
  'p02-xinhua-2022-04-22-sichuan-sec': ['新华网成都4月22日电', '因年龄原因不再担任省委书记职务。'],
  'p02-people-2020-12-02-huang-qiang-acting': ['12月2日下午举行的四川省十三届', '（记者 刘佳）'],
  'p02-xinhua-2024-07-04-shi-xiaolin-acting': ['7月4日上午举行的', '（记者 刘佳）'],
  'p02-xinhua-2024-07-31-shi-xiaolin-elected': ['新华社成都7月31日电', '为四川省人民政府省长。'],
  'p02-chinanews-2007-01-23-jiang-jufeng-acting': ['中新网1月23日电', '九届、十届四川省人大代表。'],
  'p02-chinanews-2007-01-31-jiang-jufeng-elected': ['四川省第十届人民代表大会第五次会议1月31日', '大学学历。'],
  'p02-xinhua-2020-11-20-jilin-4-sec': ['新华社北京11月20日电', '陈豪同志不再担任云南省委书记、常委、委员职务。'],
  'p02-xinhua-2022-12-09-guizhou-sec': ['新华社北京12月9日电', '徐麟同志任贵州省委委员、常委、书记。'],
  'p02-xinhua-2020-11-24-li-bingjun-acting': ['新华社贵阳11月24日电', '副省长、代省长。'],
  'p02-people-2017-09-06-chen-yiqin-acting': ['新华网贵阳9月6日电', '十届、十一届、十二届贵州省委委员。'],
  'p02-people-2018-01-30-chen-yiqin-elected': ['新华社贵阳１月３０日电', '选举韩德洋为省高级人民法院院长。'],
  'p02-xinhua-2020-11-25-wang-yubo-acting': ['新华社昆明11月25日电', '副省长、代理省长。'],
  'p02-ce-2011-08-31-li-jiheng-acting': ['新华社昆明8月30日电', '代理省长。'],
  'p02-xinhua-2026-09-22-xizang-3-sec': ['新华社北京9月22日电', '罗东川同志任青海省委书记。'],
  'p02-xinhua-2022-01-07-yan-jinhai-elected': ['新华社拉萨1月7日电', '人民政府主席。'],
  'p02-xinhua-2025-01-22-karma-tseten-elected': ['新华社拉萨1月22日电', '监察委员会主任。'],
  'p02-chinanews-2003-05-16-qiangba-puncog': ['中新网5月16日电', '第十六届中央委员。'],
  'p02-people-2013-01-29-losang-jamcan': ['中新网拉萨1月29日电', '人民检察院检察长。(完)'],
  'p02-xinhua-2020-07-31-shaanxi-sec': ['新华网西安7月31日电', '是十九届中央委员。'],
  'p02-xinhua-2022-11-27-shaanxi-sec': ['新华网西安11月27日电', '二十届中央委员。'],
  'p02-xinhua-2020-08-02-zhao-yide-acting': ['新华社西安8月2日电', '副省长、代省长。'],
  'p02-xinhua-2020-08-25-zhao-yide-elected': ['新华社西安8月25日电', '选举赵一德为陕西省省长。'],
  'p02-xinhua-2022-12-01-zhao-gang-acting': ['新华社西安12月1日电', '副省长、代理省长。'],
  'p02-xinhua-2018-01-04-liu-guozhong-acting': ['新华社西安1月4日电', '第十三届省委委员。'],
  'p02-xinhua-2018-01-30-liu-guozhong-elected': ['新华社西安1月30日电', '选举李智为省高级人民法院院长。'],
  'p02-sohu-2002-05-20-jia-zhibang-acting': ['中新网西安5月20日消息', '陈德铭任陕西省副省长。'],
  'p02-sohu-2003-01-18-jia-zhibang-elected': ['新华网西安1月18日电', '（完）'],
  'p02-xinhua-2022-12-07-gansu-sec': ['新华网兰州12月7日电', '二十届中央委员。'],
  'p02-xinhua-2026-09-22-gansu-sec': ['新华网兰州9月22日电', '是二十届中央委员。'],
  'p02-xinhua-2020-12-03-ren-zhenhe-acting': ['新华社兰州12月3日电', '（简历来源：甘肃省政府网站）'],
  'p02-xinhua-2026-09-02-kong-shaoxun-acting': ['甘肃省人民代表大会常务委员会关于孔绍逊', '（来源：甘肃人大网）'],
  'p02-xinhua-2026-09-29-kong-shaoxun-elected': ['新华社兰州9月29日电', '为甘肃省人民政府省长。'],
  'p02-cctv-2008-02-25-lu-hao': ['中共甘肃省委书记，甘肃省人大常委会主任。', '十六届、十七届中央委员。'],
  'p02-xinhua-2022-03-31-wu-xiaojun-acting': ['决定任命名单', '吴晓军为青海省人民政府代理省长。'],
  'p02-xinhua-2022-05-28-wu-xiaojun-elected': ['新华社西宁5月28日电', '监察委员会主任。'],
  'p02-xinhua-2025-01-04-luo-dongchuan-acting': ['新华社西宁1月4日电', '副省长、代省长。'],
  'p02-xinhua-2022-03-29-ningxia-sec': ['新华网银川3月29日电', '因年龄原因不再担任区党委书记职务。', '宁夏回族自治区党委主要负责同志职务调整 梁言顺任宁夏回族自治区党委书记'],
  'p02-xinhua-2024-06-28-ningxia-sec': ['新华网银川6月28日电', '是二十届中央委员。'],
  'p02-xinhua-2022-05-21-zhang-yupu-elected': ['新华社银川5月21日电', '为宁夏回族自治区主席。', '梁言顺当选宁夏回族自治区人大常委会主任 张雨浦当选宁夏回族自治区主席'],
  'p02-xinhua-2022-01-27-erkin-elected': ['新华社乌鲁木齐1月27日电', '监察委员会主任。', '艾尔肯·吐尼亚孜当选新疆维吾尔自治区人民政府主席'],
}

const raw = readFileSync(p02, 'utf8')
const eol = raw.includes('\r\n') ? '\r\n' : '\n'
const lines = raw.split(/\r?\n/)
const out: string[] = []
let cur = ''
let n = 0
for (const line of lines) {
  const id = line.match(/^  - id: (\S+)$/)?.[1]
  if (id) cur = id
  const spec = m[cur]
  if (spec && spec[2] && line.startsWith('    title: ')) { out.push(`    title: ${spec[2]}`); continue }
  if (spec && /^    (start|end): /.test(line)) continue
  out.push(line)
  if (spec && line.startsWith('    url: ')) {
    out.push(`    start: ${JSON.stringify(spec[0])}`, `    end: ${JSON.stringify(spec[1])}`)
    n++
  }
}
writeFileSync(p02, out.join(eol))
console.log(`markers set on ${n} of ${Object.keys(m).length}`)
