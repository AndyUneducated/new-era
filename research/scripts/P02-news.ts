// P02 one-off: register appointment notices (voice: official) in research/manifests/P02.yaml.
// Checks every URL against all manifests first; prints duplicates instead of appending them.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..', '..')
const MAN = join(ROOT, 'research', 'manifests')

type N = [id: string, title: string, publisher: string, date: string, url: string]
const news: N[] = [
  ['p02-xinhua-2024-12-31-henan-guangxi-sec', '河南、广西2省区党委主要负责同志职务调整', '新华社', '2024-12-31', 'http://www.news.cn/politics/20241231/0677a8e28ae744078242613da0813c6f/c.html'],
  ['p02-xinhua-2026-09-23-anhui-3-sec', '安徽等3省省委主要负责同志职务调整', '新华社', '2026-09-23', 'https://www.news.cn/politics/20260923/469da6b5bd14496aa21bb2b446a3bfab/c.html'],
  ['p02-people-2021-04-06-wang-kai-acting', '王凯任河南省副省长、代省长', '人民网（河南日报）', '2021-04-06', 'http://renshi.people.com.cn/n1/2021/0406/c139617-32070240.html'],
  ['p02-xinhua-2026-09-24-wang-lujin-acting', '王陆进代理河南省人民政府省长职务', '新华网（河南日报）', '2026-09-24', 'https://www.news.cn/politics/20260924/a161809020604d10845189071d1f51fa/c.html'],
  ['p02-xinhua-2024-12-31-hubei-qinghai-sec', '湖北、青海省委主要负责同志职务调整', '新华社', '2024-12-31', 'http://www.news.cn/20241231/9a3c013de0284fd18cf417a7a3c52719/c.html'],
  ['p02-xinhua-2026-05-30-hubei-sec', '湖北省委主要负责同志职务调整', '新华社', '2026-05-30', 'https://www.news.cn/20260530/b0a9b365862a4b97a29886b2ee9bc1b8/c.html'],
  ['p02-xinhua-2021-05-07-wang-zhonglin-acting', '王忠林任湖北省代省长', '新华社', '2021-05-07', 'http://www.xinhuanet.com/politics/2021-05/07/c_1127418482.htm'],
  ['p02-xinhua-2025-01-02-li-dianxun-acting', '李殿勋任湖北省副省长、代理省长', '新华社', '2025-01-02', 'https://www.news.cn/politics/20250102/c1fbd9eb0327417ebfeb214060314786/c.html'],
  ['p02-xinhua-2025-01-20-li-dianxun-elected', '王忠林当选湖北省人大常委会主任 李殿勋当选湖北省省长', '新华社', '2025-01-20', 'http://www.news.cn/politics/20250120/c5fc9b00ce764bba88cd8d106cbaa478/c.html'],
  ['p02-xinhua-2023-03-14-hunan-3-sec', '湖南等3省省委主要负责同志职务调整', '新华社', '2023-03-14', 'http://www.news.cn/politics/2023-03/14/c_1129431255.htm'],
  ['p02-xinhua-2020-11-27-mao-weiming-acting', '毛伟明任湖南省代省长', '新华社', '2020-11-27', 'https://www.xinhuanet.com/politics/2020-11/27/c_1126795262.htm'],
  ['p02-chinanews-2002-02-02-zhang-yunchuan', '人事变动：张云川当选为湖南省人民政府省长', '中国新闻网', '2002-02-02', 'http://www.chinanews.com.cn/2002-02-02/26/159717.html'],
  ['p02-xinhua-2021-12-29-wang-weizhong-acting', '王伟中任广东省副省长、代理省长', '新华网（中国新闻网）', '2021-12-29', 'http://gd.news.cn/newscenter/2021-12/29/c_1128211123.htm'],
  ['p02-xinhua-2025-10-11-meng-fanli-acting', '孟凡利任广东省代省长', '新华社', '2025-10-11', 'https://www.news.cn/20251011/68e2014c6f6d4f6f80b890e740adb378/c.html'],
  ['p02-xinhua-2025-10-15-meng-fanli-elected', '孟凡利当选广东省省长', '新华社', '2025-10-15', 'https://www.news.cn/politics/20251015/754453aa6fd14d4b91f63716606198d6/c.html'],
  ['p02-xinhua-2021-10-19-guangxi-yunnan-sec', '广西云南2省区党委主要负责同志职务调整', '新华社', '2021-10-19', 'http://www.news.cn/politics/2021-10/19/c_1127973766.htm'],
  ['p02-people-2020-10-19-lan-tianli-acting', '蓝天立任广西壮族自治区代主席', '人民网', '2020-10-19', 'http://renshi.people.com.cn/n1/2020/1019/c139617-31897207.html'],
  ['p02-xinhua-2021-01-25-lan-tianli-elected', '蓝天立当选广西壮族自治区主席', '新华社', '2021-01-25', 'http://www.xinhuanet.com/politics/2021-01/25/c_1127023045.htm'],
  ['p02-xinhua-2025-07-03-wei-tao-acting', '韦韬任广西壮族自治区副主席 代理自治区主席', '新华网', '2025-07-03', 'http://www.gx.xinhuanet.com/20250703/531ad5ad5f354491a9bf9536db94cc64/c.html'],
  ['p02-xinhua-2020-12-01-fujian-hainan-sec', '福建海南省委主要负责同志职务调整', '新华社', '2020-12-01', 'https://www.xinhuanet.com/politics/2020-12/01/c_1126808318.htm'],
  ['p02-people-2020-12-03-feng-fei-acting', '海南省六届人大常委会第二十四次会议闭会', '人民网（海南日报）', '2020-12-03', 'http://hi.people.com.cn/n2/2020/1203/c231190-34452551.html'],
  ['p02-xinhua-2023-05-31-liu-xiaoming-elected', '刘小明当选海南省省长', '新华社', '2023-05-31', 'http://www.news.cn/politics/2023-05/31/c_1129658938.htm'],
  ['p02-xinhua-2022-12-08-chongqing-sec', '重庆市委主要负责同志职务调整 袁家军兼任重庆市委书记', '新华网', '2022-12-08', 'https://www.news.cn/politics/2022-12/08/c_1129191499.htm'],
  ['p02-xinhua-2022-01-21-hu-henghua-elected', '胡衡华当选重庆市市长', '新华社', '2022-01-21', 'http://www.news.cn/politics/2022-01/21/c_1128286498.htm'],
  ['p02-xinhua-2026-07-31-chen-xinwu-acting', '陈新武任重庆市代市长', '新华社', '2026-07-31', 'https://www.news.cn/politics/20260731/3fe0b15a495a429a8f425d75bd03882e/c.html'],
  ['p02-xinhua-2018-01-02-tang-liangzhi-acting', '唐良智任重庆市代市长', '新华社', '2018-01-02', 'https://www.xinhuanet.com/politics/2018-01/02/c_1122200430.htm'],
  ['p02-xinhua-2018-01-31-tang-liangzhi-elected', '张轩当选重庆市人大常委会主任 唐良智当选重庆市市长', '新华社', '2018-01-31', 'http://www.xinhuanet.com/politics/2018-01/31/c_1122349373.htm'],
  ['p02-xinhua-2022-04-22-sichuan-sec', '四川省委主要负责同志职务调整 王晓晖任四川省委书记', '新华网', '2022-04-22', 'http://www.news.cn/2022-04/22/c_1128585914.htm'],
  ['p02-xinhua-2020-12-02-huang-qiang-acting', '黄强任四川省代省长 尹力辞去省长职务', '新华网', '2020-12-02', 'http://www.xinhuanet.com/renshi/2020-12/02/c_1126813024.htm'],
  ['p02-xinhua-2024-07-04-shi-xiaolin-acting', '施小琳任四川省副省长、代理省长', '新华网（川观新闻）', '2024-07-04', 'http://www.news.cn/politics/20240704/73f96005dd2d48eeb4448480aeac424d/c.html'],
  ['p02-xinhua-2024-07-31-shi-xiaolin-elected', '施小琳当选四川省省长', '新华社', '2024-07-31', 'http://www.news.cn/politics/20240731/fb5d9377c4e445d79b7a9c98d71421d4/c.html'],
  ['p02-chinanews-2007-01-23-jiang-jufeng-acting', '蒋巨峰任四川省政府代省长 张中伟辞去省长职务', '中国新闻网', '2007-01-23', 'http://www.chinanews.com.cn/gn/news/2007/01-23/859794.shtml'],
  ['p02-chinanews-2007-01-31-jiang-jufeng-elected', '蒋巨峰当选四川省省长', '中国新闻网', '2007-01-31', 'http://www.chinanews.com.cn/tp/gnxw/news/2007/01-31/865308.shtml'],
  ['p02-xinhua-2020-11-20-jilin-4-sec', '吉林等4省省委主要负责同志职务调整', '新华社', '2020-11-20', 'https://www.xinhuanet.com/politics/2020-11/20/c_1126765656.htm'],
  ['p02-xinhua-2022-12-09-guizhou-sec', '贵州省委主要负责同志职务调整', '新华社', '2022-12-09', 'http://www.xinhuanet.com/politics/2022-12/09/c_1129194304.htm'],
  ['p02-xinhua-2020-11-24-li-bingjun-acting', '李炳军任贵州省代省长', '新华社', '2020-11-24', 'http://www.xinhuanet.com/politics/2020-11/24/c_1126781256.htm'],
  ['p02-people-2017-09-06-chen-yiqin-acting', '谌贻琴任贵州省副省长、代理省长', '人民网（新华网）', '2017-09-06', 'http://politics.people.com.cn/n1/2017/0906/c1001-29519749.html'],
  ['p02-govcn-2018-01-30-chen-yiqin-elected', '孙志刚当选贵州省人大常委会主任 谌贻琴当选贵州省省长', '中国政府网（新华社）', '2018-01-30', 'https://www.gov.cn/xinwen/2018-01/30/content_5262317.htm'],
  ['p02-xinhua-2020-11-25-wang-yubo-acting', '王予波任云南省代省长', '新华社', '2020-11-25', 'https://www.xinhuanet.com/politics/2020-11/25/c_1126785963.htm'],
  ['p02-ce-2011-08-31-li-jiheng-acting', '李纪恒任云南省副省长、代理省长（经济日报转新华社）', '经济日报', '2011-08-31', 'http://paper.ce.cn/jjrb/html/2011-08/31/content_166572.htm'],
  ['p02-xinhua-2026-09-22-xizang-3-sec', '西藏等3省区党委主要负责同志职务调整', '新华社', '2026-09-22', 'https://www.news.cn/politics/20260922/7e25fd3001fa4c288dfdb3f9f8a855b2/c.html'],
  ['p02-xinhua-2022-01-07-yan-jinhai-elected', '严金海当选西藏自治区人民政府主席', '新华社', '2022-01-07', 'http://www.news.cn/politics/2022-01/07/c_1128242849.htm'],
  ['p02-xinhua-2025-01-22-karma-tseten-elected', '严金海当选西藏自治区人大常委会主任 嘎玛泽登当选西藏自治区人民政府主席', '新华社', '2025-01-22', 'http://www.news.cn/politics/20250122/d0235dc2ffb54996949f2716b3f145fc/c.html'],
  ['p02-chinanews-2003-05-16-qiangba-puncog', '列确当选西藏人大主任 向巴平措任政府主席', '中国新闻网', '2003-05-16', 'https://www.chinanews.com.cn/n/2003-05-16/26/303828.html'],
  ['p02-people-2013-01-29-losang-jamcan', '白玛赤林当选西藏人大主任 洛桑江村当选主席', '人民网（中国新闻网）', '2013-01-29', 'http://politics.people.com.cn/n/2013/0129/c1001-20362121.html'],
  ['p02-xinhua-2020-07-31-shaanxi-sec', '陕西省委主要负责同志职务调整', '新华社', '2020-07-31', 'http://www.xinhuanet.com/2020-07/31/c_1126308575.htm'],
  ['p02-xinhua-2022-11-27-shaanxi-sec', '陕西省委主要负责同志职务调整 赵一德任陕西省委书记', '新华网', '2022-11-27', 'http://www.news.cn/politics/2022-11/27/c_1129164633.htm'],
  ['p02-xinhua-2020-08-02-zhao-yide-acting', '赵一德任陕西省代省长', '新华社', '2020-08-02', 'http://www.xinhuanet.com/politics/2020-08/02/c_1126315991.htm'],
  ['p02-xinhua-2020-08-25-zhao-yide-elected', '刘国中当选陕西省人大常委会主任 赵一德当选陕西省省长', '新华社', '2020-08-25', 'https://www.xinhuanet.com/politics/2020-08/25/c_1126411597.htm'],
  ['p02-xinhua-2022-12-01-zhao-gang-acting', '赵刚任陕西省代省长', '新华社', '2022-12-01', 'http://www.news.cn/politics/2022-12/01/c_1129176112.htm'],
  ['p02-xinhua-2018-01-04-liu-guozhong-acting', '刘国中任陕西省代省长', '新华社', '2018-01-04', 'http://www.xinhuanet.com/politics/2018-01/04/c_1122210670.htm'],
  ['p02-xinhua-2018-01-30-liu-guozhong-elected', '胡和平当选陕西省人大常委会主任 刘国中当选陕西省省长', '新华社', '2018-01-30', 'http://www.xinhuanet.com/politics/2018-01/30/c_1122342944.htm'],
  ['p02-sohu-2002-05-20-jia-zhibang-acting', '程安东辞去陕西省省长职务 贾治邦被任命为代省长（搜狐转中国新闻网）', '中国新闻网', '2002-05-20', 'https://news.sohu.com/44/10/news200961044.shtml'],
  ['p02-sohu-2003-01-18-jia-zhibang-elected', '李建国当选陕西省人大常委主任 贾治邦当选省长（搜狐转新华网）', '新华社', '2003-01-18', 'https://news.sohu.com/74/14/news205831474.shtml'],
  ['p02-xinhua-2022-12-07-gansu-sec', '甘肃省委主要负责同志职务调整 胡昌升任甘肃省委书记', '新华网', '2022-12-07', 'https://www.news.cn/politics/2022-12/07/c_1129189540.htm'],
  ['p02-xinhua-2026-09-22-gansu-sec', '甘肃省委主要负责同志职务调整 吴晓军任甘肃省委书记', '新华网', '2026-09-22', 'https://www.xinhuanet.com/20260922/0e2224f2939a45e19a85f1af4838a228/c.html'],
  ['p02-xinhua-2020-12-03-ren-zhenhe-acting', '任振鹤任甘肃省代省长', '新华社', '2020-12-03', 'https://www.xinhuanet.com/politics/2020-12/03/c_1126818383.htm'],
  ['p02-xinhua-2026-09-02-kong-shaoxun-acting', '孔绍逊代理甘肃省人民政府省长职务', '新华网', '2026-09-02', 'https://www.news.cn/politics/20260902/c84067ad932147a5bdd0f2b1ad751efb/c.html'],
  ['p02-xinhua-2026-09-29-kong-shaoxun-elected', '吴晓军当选甘肃省人大常委会主任 孔绍逊当选甘肃省省长', '新华社', '2026-09-29', 'https://www.news.cn/politics/20260929/caff618c0bc442e6a739a4fba69f9ace/c.html'],
  ['p02-cctv-2008-02-25-lu-hao', '陆浩简历', '央视网（新华网）', '2008-02-25', 'http://news.cctv.com/special/C20149/20080225/104663.shtml'],
  ['p02-xinhua-2022-03-31-wu-xiaojun-acting', '吴晓军任青海省人民政府副省长、代理省长', '新华网', '2022-03-31', 'http://qh.news.cn/2022-03/31/c_1128521498.htm'],
  ['p02-xinhua-2022-05-28-wu-xiaojun-elected', '信长星当选青海省人大常委会主任 吴晓军当选青海省省长', '新华社', '2022-05-28', 'http://www.news.cn/politics/2022-05/28/c_1128693143.htm'],
  ['p02-xinhua-2025-01-04-luo-dongchuan-acting', '罗东川任青海省代省长', '新华社', '2025-01-04', 'https://www.news.cn/politics/20250104/63d75c6a7bc64ca49afe630265f981c0/c.html'],
  ['p02-xinhua-2022-03-29-ningxia-sec', '宁夏回族自治区党委主要负责同志职务调整', '新华社', '2022-03-29', 'http://www.news.cn/politics/2022-03/29/c_1128513376.htm'],
  ['p02-xinhua-2024-06-28-ningxia-sec', '宁夏回族自治区党委主要负责同志职务调整 李邑飞任宁夏回族自治区党委书记', '新华网', '2024-06-28', 'https://www.news.cn/politics/20240628/d391882d5e4c4473a6007236797654a2/c.html'],
  ['p02-xinhua-2022-05-21-zhang-yupu-elected', '张雨浦当选宁夏回族自治区主席', '新华社', '2022-05-21', 'http://www.news.cn/politics/2022-05/21/c_1128671607.htm'],
  ['p02-xinhua-2022-01-27-erkin-elected', '艾尔肯·吐尼亚孜当选新疆维吾尔自治区主席', '新华社', '2022-01-27', 'http://www.news.cn/politics/2022-01/27/c_1128307596.htm'],
]

const norm = (u: string) => decodeURI(u).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
const others = new Map<string, string>()
for (const f of readdirSync(MAN).filter((f) => f.endsWith('.yaml') && f !== 'P02.yaml')) {
  const t = readFileSync(join(MAN, f), 'utf8')
  for (const m of t.matchAll(/url:\s*(\S+?)(?:\s*[,}]|\s*$)/gm)) others.set(norm(m[1]), f)
}
const p02 = join(MAN, 'P02.yaml')
let text = readFileSync(p02, 'utf8')
const lines: string[] = []
for (const [id, title, publisher, date, url] of news) {
  const dup = others.get(norm(url))
  if (dup) { console.log(`DUP ${id} -> ${dup}`); continue }
  if (text.includes(`id: ${id}`)) continue
  lines.push(`  - id: ${id}`, `    title: ${title}`, `    publisher: ${publisher}`, `    date: ${date}`, `    voice: official`, `    url: ${url}`)
}
if (lines.length) {
  if (!text.includes('# --- appointment notices')) lines.unshift('  # --- appointment notices (新华社 etc.) ---')
  text = text.replace(/\s*$/, '\n') + lines.join('\n') + '\n'
  writeFileSync(p02, text)
}
console.log(`appended ${lines.filter((l) => l.startsWith('  - id')).length}`)
writeFileSync(join(ROOT, '.probe', 'p02-news-ids.txt'), news.map((n) => n[0]).join(' ') + '\n')
