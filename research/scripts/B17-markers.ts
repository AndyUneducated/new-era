// One-off: adds start/end markers and excerpt settings to research/manifests/B17.yaml after peeking.
import { readFileSync, writeFileSync } from 'node:fs'

const p = 'research/manifests/B17.yaml'
let s = readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const add: Record<string, string[]> = {
  'b17-xinhua-2026-02-14-old-comrades': ['start: 春节前夕，中共中央总书记', 'end: 民族复兴伟业新局面。'],
  'b17-fznews-2022-06-28-wang-xiaohong-cv': ['start: 此前，据中国人大网24日消息', 'end: 中共十九届中央委员。'],
  'b17-gov-2025-01-08-wang-gupta': ['start: 新华社北京1月7日电', 'end: 继续保持合作交流。'],
  'b17-gov-2026-05-19-wang-astana': ['start: 新华社阿斯塔纳5月19日电', 'end: 乌兹别克斯坦内务部部长会见交流。'],
  'b17-gov-2026-09-07-wang-central-asia': ['start: 新华社北京9月7日电', 'end: 双方签署有关合作文件。'],
  'b17-xinhua-2015-05-26-liu-jinguo-cv': ['start: 中央纪委监察部网站“领导机构”栏目', 'end: 选举刘金国为中央纪委常委、副书记。'],
  'b17-chinanews-2014-10-25-liu-ccdi': ['excerpt: true', 'keep: [ 刘金国成为近年来第二位政法系统出身的中纪委副书记, 即使犯罪分子逃到天涯海角, 就没想活着回去, 爱人一直是临时工, 直接在一张纸上写下四条, 1974年高中毕业之后回村担任民兵连副连长 ]'],
  'b17-chinanews-2014-10-28-liu-family': ['excerpt: true', 'keep: [ 刘家兄妹六人, 最后是贷款40万元, 此前有媒体报道称刘金国的妻子长期是临时工 ]'],
  'b17-cntv-2012-02-06-liu-touching-china': ['excerpt: true', 'keep: [ 贼有未曾经我缚, 刘金国在前沿连续指挥了七个小时, 从废墟中搜救出被埋压人员8335人, 搬家时他的全部家当只有半卡车旧家具 ]'],
  'b17-cntv-2012-02-14-liu-hometown': ['excerpt: true', 'keep: [ 这是刘金国对全国人民的承诺, 那我就‘装’到死, 我只有管好自己家里人了 ]'],
  'b17-people-2012-12-30-guo-mps': ['start: 免去孟建柱兼任的公安部部长职务', 'end: 十八届中央委员'],
  'b17-hxw-2017-11-03-guo-zhengfa': ['start: 中国共产党新闻网北京11月1日电', 'end: 十九届中央政治局委员、中央书记处书记。'],
  'b17-court-2021-02-guo-rectification': ['start: 2月27日，中共中央政治局委员', 'end: 在各地分会场参加会议。'],
  'b17-12371-2017-10-19-yang-presser': ['start: 10月19日，十九大新闻中心举行记者招待会', 'end: 也就会更多地减少。'],
  'b17-xinhua-2023-09-20-cdpf': ['start: 新华社北京9月20日电', 'end: 李冬生（女）'],
  'b17-chinanews-2006-03-07-zhang-hunan': ['excerpt: true', 'keep: [ 我最担心人祸, 我不喜欢烧新官上任后的, 原来他一吃辣椒就说不出话 ]'],
  'b17-people-2014-03-06-zhang-terror': ['excerpt: true', 'keep: [ 但根本还在争取民心, 是安全的，放心去吧, 尽管‘7·5’事件后民族隔阂大大加深 ]'],
  'b17-people-2014-03-07-zhang-sixteen-minutes': ['excerpt: true', 'keep: [ 这位曾被香港媒体称之为内地“最开放官员”, 现在新疆的暴恐，90%是‘翻墙’, 这确实不是民族问题，也不是宗教问题, 唯有大力发展民生, 不严打就不发生 ]'],
  'b17-people-2012-12-20-you-fujian': ['start: 19日，福建省召开领导干部大会', 'end: 参加会议。（记者 兰锋 周琳）'],
  'b17-people-2017-11-07-you-ufwd': ['start: 中国共产党新闻网北京11月7日电', 'end: 十九届中央书记处书记。'],
  'b17-hxnews-2014-09-22-you-putian': ['excerpt: true', 'keep: [ 表扬政府的话就不说了, 你们只管放手干 ]'],
  'b17-gov-2014-11-02-xi-fujian': ['start: 新华社福州11月2日电', 'end: 分别陪同参加考察活动。'],
  'b17-xinhua-2018-04-04-you-religion': ['start: 新华社合肥4月4日电', 'end: 为推动经济社会发展作出新贡献。'],
  'b17-people-2019-11-26-you-united-front': ['start: 统一战线历来是党的总路线', 'end: 实现新时代统一战线持续健康发展。'],
  'b17-minge-2022-10-26-you-briefing': ['start: 10月25日，受中共中央委托', 'end: 中央统战部有关负责同志参加会议。'],
}
s = s.replace(
  'url: https://www.spp.gov.cn/spp/tt/202104/t20210406_514972.shtml',
  'url: https://www.thepaper.cn/newsDetail_forward_12069774',
).replace('publisher: 新华社（最高人民检察院网转载）', 'publisher: 新华社（澎湃新闻转载）')
const out: string[] = []
for (const [id, lines] of Object.entries(add)) {
  const re = new RegExp(`(  - id: ${id}\\n(?:    .*\\n)*?    url: .*\\n)`)
  if (!re.test(s)) {
    out.push(`MISS ${id}`)
    continue
  }
  s = s.replace(re, (m) => m + lines.map((l) => `    ${l}\n`).join(''))
}
writeFileSync(p, s)
writeFileSync('.probe/b17-markers.txt', out.join('\n') + '\nok\n')
