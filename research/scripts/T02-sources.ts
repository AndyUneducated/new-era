// T02 source table: one row per notice. T02-manifest.ts turns it into research/manifests/T02.yaml.
// www.ccdi.gov.cn answers scripted requests with a captcha page, so CCDI notices are Wayback raw snapshots
// (id_) taken before the captcha, or Xinhua / court / procuratorate reprints of the same text.
export type Src = {
  id: string
  who: string
  title: string
  publisher: string
  date: string
  url: string
  voice?: 'official' | 'zh' | 'doc'
  keep?: string[]
  full?: false
}

const wb = (ts: string, url: string) => `https://web.archive.org/web/${ts}id_/${url}`
const CCDI = '中央纪委国家监委网站'

export const SOURCES: Src[] = [
  // 王富玉
  { id: 't02-ccdi-2021-02-21-wang-fuyu-probe', who: '王富玉', title: '贵州省政协原主席王富玉接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2021-02-21', url: wb('20210817041208', 'https://www.ccdi.gov.cn/toutiao/202102/t20210221_236200.html') },
  { id: 't02-ccdi-2021-08-16-wang-fuyu-expel', who: '王富玉', title: '贵州省政协原党组书记、主席王富玉严重违纪违法被开除党籍', publisher: CCDI, date: '2021-08-16', url: wb('20210817030617', 'https://www.ccdi.gov.cn/scdc/zggb/djcf/202108/t20210816_248397.html') },
  { id: 't02-bjnews-2022-01-17-wang-fuyu-verdict', who: '王富玉', title: '贵州省政协原主席王富玉，被判死缓', publisher: '新京报', date: '2022-01-17', url: 'http://www.bjnews.com.cn/detail/164241121514208.html' },
  // 张务锋
  { id: 't02-ccdi-2022-06-15-zhang-wufeng-probe', who: '张务锋', title: '国家粮食和物资储备局原党组书记、局长张务锋接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2022-06-15', url: wb('20220616064352', 'https://www.ccdi.gov.cn/toutiaon/202206/t20220615_199266.html') },
  { id: 't02-caixin-2022-12-30-zhang-wufeng-expel', who: '张务锋', title: '国家粮储局首任局长张务锋被“双开”：通过民间借贷敛财', publisher: '财新网', date: '2022-12-30', url: 'https://china.caixin.com/2022-12-30/101983895.html', voice: 'zh', keep: ['张务锋'], full: false },
  { id: 't02-xinhua-2023-12-05-zhang-wufeng-verdict', who: '张务锋', title: '国家粮食和物资储备局原党组书记、局长张务锋受贿案一审宣判', publisher: '新华网', date: '2023-12-05', url: 'http://www.news.cn/legal/2023-12/05/c_1130009958.htm' },
  // 董云虎
  { id: 't02-ccdi-2023-07-12-dong-yunhu-probe', who: '董云虎', title: '上海市人大常委会党组书记、主任董云虎接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-07-12', url: wb('20230717081700', 'https://www.ccdi.gov.cn/toutiaon/202307/t20230712_274878.html') },
  { id: 't02-xinhua-2024-08-28-dong-yunhu-verdict', who: '董云虎', title: '上海市人大常委会原主任董云虎受贿案一审宣判', publisher: '新华网', date: '2024-08-28', url: 'https://www.xinhuanet.com/20240828/0bd68fad17734d109d88ba621415c894/c.html' },
  // 唐双宁
  { id: 't02-xinhua-2024-01-06-tang-shuangning-expel', who: '唐双宁', title: '中国光大集团原党委书记、董事长唐双宁严重违纪违法被开除党籍', publisher: '新华网', date: '2024-01-06', url: 'http://www.news.cn/politics/20240106/fa7339dc5a9d4d2aa23d4d5256c8b66e/c.html' },
  { id: 't02-xinhua-2024-12-10-tang-shuangning-verdict', who: '唐双宁', title: '中国光大集团股份公司原党委书记、董事长唐双宁贪污、受贿案一审宣判', publisher: '新华网', date: '2024-12-10', url: 'http://www.news.cn/20241210/4e28e1a6b08045fb8fd4551eaaa5445b/c.html' },
  // 王宜林
  { id: 't02-ccdi-2024-02-02-wang-yilin-probe', who: '王宜林', title: '中国石油天然气集团有限公司原党组书记、董事长王宜林接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-02-02', url: wb('20240202150955', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202402/t20240202_326497.html') },
  { id: 't02-ccdi-2024-07-31-wang-yilin-expel', who: '王宜林', title: '中国石油原党组书记、董事长王宜林严重违纪违法被开除党籍', publisher: CCDI, date: '2024-07-31', url: wb('20240806025753', 'https://www.ccdi.gov.cn/yaowenn/202407/t20240731_365182.html') },
  { id: 't02-xinhua-2025-05-13-wang-yilin-verdict', who: '王宜林', title: '中国石油天然气集团有限公司原党组书记、董事长王宜林受贿案一审宣判', publisher: '新华网', date: '2025-05-13', url: 'http://www.news.cn/20250513/4a571c50c99d46f88a223b842264484e/c.html' },
  // 凌成兴
  { id: 't02-ccdi-2023-10-23-ling-chengxing-probe', who: '凌成兴', title: '国家烟草专卖局原党组书记、局长凌成兴接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-10-23', url: wb('20231120185549', 'https://www.ccdi.gov.cn/toutiaon/202310/t20231023_302057.html') },
  { id: 't02-ccdi-2024-04-22-ling-chengxing-expel', who: '凌成兴', title: '工信部原党组成员，国家烟草专卖局原党组书记、局长，中国烟草总公司原总经理凌成兴严重违纪违法被开除党籍', publisher: CCDI, date: '2024-04-22', url: wb('20240423111904', 'https://www.ccdi.gov.cn/yaowenn/202404/t20240422_342976.html') },
  { id: 't02-cctv-2025-05-21-ling-chengxing-verdict', who: '凌成兴', title: '受贿数额特别巨大、滥用职权 国家烟草专卖局原局长凌成兴一审被判十六年', publisher: '央视网', date: '2025-05-21', url: 'https://news.cctv.com/2025/05/21/ARTIJXQJQk3XUcs1iP3iaHXo250521.shtml' },
  // 齐同生
  { id: 't02-xinhua-2024-10-08-qi-tongsheng-probe', who: '齐同生', title: '宁夏回族自治区政协原党组书记、主席齐同生接受审查调查', publisher: '新华网', date: '2024-10-08', url: 'http://www.news.cn/20241008/d5921ab93b53492d9ae151f184e2c783/c.html' },
  { id: 't02-court-2025-qi-tongsheng-verdict', who: '齐同生', title: '宁夏回族自治区政协原党组书记、主席齐同生受贿案一审宣判', publisher: '最高人民法院', date: '2025-12-16', url: 'https://www.court.gov.cn/fabu/xiangqing/484121.html' },
  // 张效廉
  { id: 't02-ccdi-2025-04-23-zhang-xiaolian-expel', who: '张效廉', title: '十三届全国政协经济委员会副主任张效廉严重违纪违法被开除党籍', publisher: CCDI, date: '2025-04-23', url: wb('20250511210412', 'https://www.ccdi.gov.cn/yaowenn/202504/t20250423_418892.html') },
  { id: 't02-court-2026-zhang-xiaolian-verdict', who: '张效廉', title: '十三届全国政协经济委员会副主任张效廉受贿案一审宣判', publisher: '最高人民法院', date: '2026-01-28', url: 'https://www.court.gov.cn/fabu/xiangqing/487591.html' },
  // 李微微
  { id: 't02-xinhua-2024-07-29-li-weiwei-probe', who: '李微微', title: '十四届全国政协人口资源环境委员会副主任李微微接受审查调查', publisher: '新华网', date: '2024-07-29', url: 'http://www.news.cn/20240729/c2f4a17384594feebd6a70e50258a564/c.html' },
  { id: 't02-xinhua-2025-01-24-li-weiwei-expel', who: '李微微', title: '十四届全国政协人口资源环境委员会原副主任李微微严重违纪违法被开除党籍和公职', publisher: '新华网', date: '2025-01-24', url: 'http://www.xinhuanet.com/20250124/2e079d64e5584e0894225b8ef6f07a93/c.html' },
  { id: 't02-xinhua-2026-02-03-li-weiwei-verdict', who: '李微微', title: '十四届全国政协人口资源环境委员会原副主任李微微受贿案一审宣判', publisher: '新华网', date: '2026-02-03', url: 'https://www.news.cn/legal/20260203/b55aa2eef8854f5cb2fc5545b67ddf1e/c.html' },
  // 谭瑞松
  { id: 't02-ccdi-2024-08-30-tan-ruisong-probe', who: '谭瑞松', title: '中国航空工业集团有限公司原党组书记、董事长谭瑞松接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-08-30', url: wb('20240830094059', 'https://www.ccdi.gov.cn/toutiaon/202408/t20240830_372018.html') },
  { id: 't02-ccdi-2025-02-24-tan-ruisong-expel', who: '谭瑞松', title: '航空工业集团原党组书记、董事长谭瑞松严重违纪违法被开除党籍', publisher: CCDI, date: '2025-02-24', url: wb('20251230091344', 'https://www.ccdi.gov.cn/toutiaon/202502/t20250224_407223.html') },
  { id: 't02-xinhua-2026-03-25-tan-ruisong-verdict', who: '谭瑞松', title: '中国航空工业集团有限公司原党组书记、董事长谭瑞松贪污、受贿、内幕交易、泄露内幕信息案一审宣判', publisher: '新华网', date: '2026-03-25', url: 'https://www.news.cn/legal/20260325/24edf5926cf3443d94ee81b6763c0084/c.html' },
  // 刘连舸
  { id: 't02-ccdi-2023-03-31-liu-liange-probe', who: '刘连舸', title: '中国银行原党委书记、董事长刘连舸接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-03-31', url: wb('20230410161628', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202303/t20230331_256183.html') },
  { id: 't02-ccdi-2023-10-07-liu-liange-expel', who: '刘连舸', title: '中国银行原党委书记、董事长刘连舸严重违纪违法被开除党籍', publisher: CCDI, date: '2023-10-07', url: wb('20231013081459', 'https://www.ccdi.gov.cn/yaowenn/202310/t20231007_297949.html') },
  { id: 't02-xinhua-2024-11-26-liu-liange-verdict', who: '刘连舸', title: '中国银行股份有限公司原党委书记、董事长刘连舸受贿、违法发放贷款案一审宣判', publisher: '新华网', date: '2024-11-26', url: 'http://www.news.cn/20241126/820663456c424405b1e5ef49b02334b9/c.html' },
  // 李晓鹏
  { id: 't02-ccdi-2023-04-05-li-xiaopeng-probe', who: '李晓鹏', title: '中国光大集团股份公司原党委书记、董事长李晓鹏接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-04-05', url: wb('20230511220234', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202304/t20230405_256785.html') },
  { id: 't02-xinhua-2023-10-09-li-xiaopeng-expel', who: '李晓鹏', title: '中国光大集团原党委书记、董事长李晓鹏严重违纪违法被开除党籍和公职', publisher: '新华网', date: '2023-10-09', url: 'http://www.news.cn/2023-10/09/c_1129906193.htm' },
  { id: 't02-xinhua-2025-03-18-li-xiaopeng-verdict', who: '李晓鹏', title: '中国光大集团股份公司原党委书记、董事长李晓鹏受贿案一审宣判', publisher: '新华网', date: '2025-03-18', url: 'http://www.news.cn/legal/20250318/a6aac3db15554b67aea8026a74cfe373/c.html' },
  // 王滨（中国人寿）
  { id: 't02-chinanews-2022-01-08-wang-bin-probe', who: '王滨', title: '中国人寿保险（集团）公司党委书记王滨接受审查调查', publisher: '中国新闻网', date: '2022-01-08', url: 'https://www.chinanews.com.cn/gn/2022/01-08/9647130.shtml' },
  { id: 't02-ccdi-2022-09-01-wang-bin-expel', who: '王滨', title: '中国人寿保险（集团）公司原党委书记、董事长王滨严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2022-09-01', url: wb('20220901030903', 'https://www.ccdi.gov.cn/yaowenn/202209/t20220901_215125.html') },
  { id: 't02-xinhua-2023-09-12-wang-bin-verdict', who: '王滨', title: '中国人寿保险（集团）公司原党委书记、董事长王滨受贿、隐瞒境外存款案一审宣判', publisher: '新华网', date: '2023-09-12', url: 'http://www.news.cn/2023-09/12/c_1129859108.htm' },
  // 刘绍勇
  { id: 't02-spp-2025-06-28-liu-shaoyong-probe', who: '刘绍勇', title: '中国东方航空集团有限公司原党组书记、董事长刘绍勇接受中央纪委国家监委纪律审查和监察调查', publisher: '最高人民检察院（转中央纪委国家监委网站）', date: '2025-06-28', url: wb('2025', 'https://www.spp.gov.cn/spp/zdgz/202506/t20250628_699888.shtml') },
  { id: 't02-xinhua-2026-01-04-liu-shaoyong-expel', who: '刘绍勇', title: '中国东航原党组书记、董事长刘绍勇严重违纪违法被开除党籍', publisher: '新华网', date: '2026-01-04', url: 'https://www.news.cn/20260104/df7d5ef2485b44638fca79b7d16b77d0/c.html' },
  // 李勇（中海油）
  { id: 't02-ccdi-2024-03-15-li-yong-probe', who: '李勇', title: '中国海洋石油集团有限公司原党组副书记、总经理李勇接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-03-15', url: wb('20240315093449', 'https://www.ccdi.gov.cn/toutiaon/202403/t20240315_334677.html') },
  { id: 't02-bjnews-2024-09-11-three-expel', who: '李勇', title: '中共中央批准，开除李显刚、刘跃进、李勇党籍', publisher: '新京报', date: '2024-09-11', url: wb('2026', 'https://m.bjnews.com.cn/detail/1726040965129737.html') },
  { id: 't02-court-2025-li-yong-verdict', who: '李勇', title: '中国海油集团原党组副书记、总经理李勇受贿案一审宣判', publisher: '最高人民法院', date: '2025-08-05', url: 'https://www.court.gov.cn/fabu/xiangqing/472941.html' },
  // 顾军
  { id: 't02-xinhua-2026-01-19-gu-jun-probe', who: '顾军', title: '中国核工业集团有限公司原党组副书记、总经理顾军接受审查调查', publisher: '新华网', date: '2026-01-19', url: 'http://www.news.cn/20260119/0e550a477ca643ab8aae75bbdecf081d/c.html' },
  { id: 't02-xinhua-2026-07-25-gu-jun-expel', who: '顾军', title: '中核集团原党组副书记、总经理顾军严重违纪违法被开除党籍', publisher: '新华网', date: '2026-07-25', url: 'https://www.news.cn/legal/20260725/125c1247886047998c815fecbc01342e/c.html' },
  // 黎晓宏
  { id: 't02-xinhua-2026-06-02-li-xiaohong-probe', who: '黎晓宏', title: '中央巡视工作领导小组办公室原主任黎晓宏接受审查调查', publisher: '新华网', date: '2026-06-02', url: 'https://www.news.cn/20260602/4cad85562b7f4570b4541a7d97bc73ee/c.html' },
  // 张建龙
  { id: 't02-xinhua-2026-01-22-zhang-jianlong-probe', who: '张建龙', title: '自然资源部原党组成员，国家林业和草原局原党组书记、局长张建龙接受审查调查', publisher: '新华网', date: '2026-01-22', url: 'http://www.news.cn/20260122/0cad5a3df9114ceca80027550c8701c9/c.html' },
  // 欧阳卫民
  { id: 't02-xinhua-2026-07-19-ouyang-weimin-probe', who: '欧阳卫民', title: '国家开发银行原党委副书记、行长欧阳卫民接受中央纪委国家监委纪律审查和监察调查', publisher: '新华网', date: '2026-07-19', url: 'https://www.news.cn/legal/20260719/7a2ec7dfdae24ed49f6f31a1063a0452/c.html' },
  // 辛保安
  { id: 't02-xinhua-2026-07-31-xin-baoan-probe', who: '辛保安', title: '国家电网有限公司原党组书记、董事长辛保安接受审查调查', publisher: '新华网', date: '2026-07-31', url: 'https://www.news.cn/legal/20260731/6495821892a546a285c97c9bb5cec0aa/c.html' },
  // 国文清
  { id: 't02-xinhua-2026-07-31-guo-wenqing-probe', who: '国文清', title: '中国五矿集团有限公司原党组副书记、总经理国文清接受审查调查', publisher: '新华网', date: '2026-07-31', url: 'https://www.news.cn/20260731/363574997a954e6781fe48a969501eb4/c.html' },
  // 于文明
  { id: 't02-xinhua-2025-06-22-yu-wenming-probe', who: '于文明', title: '国家中医药管理局原局长于文明接受监察调查', publisher: '新华网', date: '2025-06-22', url: 'http://www.news.cn/20250622/feb7d3e5abfb4cb4a51701b06bbcf7c9/c.html' },
  { id: 't02-court-2026-yu-wenming-verdict', who: '于文明', title: '国家中医药管理局原局长于文明受贿案一审宣判', publisher: '最高人民法院', date: '2026-08-21', url: 'https://www.court.gov.cn/fabu/xiangqing/509351.html' },
  // 崔茂虎
  { id: 't02-ccdi-2023-03-18-cui-maohu-probe', who: '崔茂虎', title: '中央统战部原副部长、国家宗教事务局原局长崔茂虎接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-03-18', url: wb('20230320141627', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202303/t20230318_253596.html') },
  { id: 't02-ccdi-2023-08-30-cui-maohu-expel', who: '崔茂虎', title: '中央统战部原副部长、国家宗教事务局原局长崔茂虎严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2023-08-30', url: wb('20230906182558', 'https://www.ccdi.gov.cn/yaowenn/202308/t20230830_289553.html') },
  { id: 't02-people-2024-07-23-cui-maohu-verdict', who: '崔茂虎', title: '受贿1043万！国家宗教事务局原局长崔茂虎一审获刑11年', publisher: '人民网云南频道', date: '2024-07-23', url: 'http://yn.people.com.cn/n2/2024/0723/c378439-40920999.html' },
  // 李金早
  { id: 't02-ccdi-2020-07-29-li-jinzao-probe', who: '李金早', title: '文化和旅游部党组副书记、副部长李金早接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2020-07-29', url: wb('20201005014520', 'http://www.ccdi.gov.cn/toutiao/202007/t20200729_222864.html') },
  { id: 't02-chinanews-2021-01-25-li-jinzao-expel', who: '李金早', title: '文化和旅游部原副部长李金早被开除党籍和公职', publisher: '中国新闻网', date: '2021-01-25', url: 'http://www.chinanews.com/gn/2021/01-25/9395715.shtml' },
  { id: 't02-people-2022-04-26-li-jinzao-verdict', who: '李金早', title: '文化和旅游部原党组副书记、副部长李金早受贿案一审宣判', publisher: '人民网', date: '2022-04-26', url: 'http://society.people.com.cn/n1/2022/0426/c1008-32409446.html' },
  // 胡问鸣
  { id: 't02-xinhua-2023-12-26-hu-wenming-verdict', who: '胡问鸣', title: '原中国船舶重工集团有限公司党组书记、董事长胡问鸣受贿、国有公司人员滥用职权案一审宣判', publisher: '新华网', date: '2023-12-26', url: 'http://www.xinhuanet.com/20231226/658730eb62e5442cb93f5624844b77a8/c.html' },
  // 云公民
  { id: 't02-ccdi-2019-10-24-yun-gongmin-probe', who: '云公民', title: '中国华电原党组副书记、总经理云公民接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2019-10-24', url: wb('20201104100234', 'http://www.ccdi.gov.cn/toutiao/201910/t20191024_202966.html') },
  { id: 't02-ccdi-2020-09-30-yun-gongmin-expel', who: '云公民', title: '原中国华电集团公司党组副书记、总经理云公民严重违纪违法被开除党籍', publisher: CCDI, date: '2020-09-30', url: wb('20201109122106', 'http://www.ccdi.gov.cn/scdc/zggb/djcf/202009/t20200930_226592.html') },
  { id: 't02-cnstock-2022-06-yun-gongmin-verdict', who: '云公民', title: '中国华电集团公司原党组副书记、总经理云公民受贿案一审宣判', publisher: '中国证券网', date: '2022-06-09', url: 'https://news.cnstock.com/news,bwkx-202206-4897756.htm' },
  // 范一飞
  { id: 't02-ccdi-2022-11-05-fan-yifei-probe', who: '范一飞', title: '中国人民银行党委委员、副行长范一飞接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2022-11-05', url: wb('20221108004523', 'https://www.ccdi.gov.cn/toutiaon/202211/t20221105_228925.html') },
  { id: 't02-xinhua-2024-10-10-fan-yifei-verdict', who: '范一飞', title: '中国人民银行原党委委员、副行长范一飞受贿案一审宣判', publisher: '新华网', date: '2024-10-10', url: 'http://www.news.cn/legal/20241010/1f6a02942bba4cd7991f7d90359e4e20/c.html' },
  // 蔡鄂生
  { id: 't02-ccdi-2021-07-30-cai-esheng-probe', who: '蔡鄂生', title: '原中国银行业监督管理委员会党委委员、副主席蔡鄂生接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2021-07-30', url: wb('20210731021916', 'https://www.ccdi.gov.cn/scdc/zggb/zjsc/202107/t20210730_247334.html') },
  { id: 't02-ccdi-2022-01-24-cai-esheng-expel', who: '蔡鄂生', title: '原中国银行业监督管理委员会党委委员、副主席蔡鄂生严重违纪违法被开除党籍', publisher: CCDI, date: '2022-01-24', url: wb('20220126022517', 'https://www.ccdi.gov.cn/scdcn/zggb/djcf/202201/t20220124_166624.html') },
  { id: 't02-thepaper-2023-12-cai-esheng-verdict', who: '蔡鄂生', title: '受贿超5亿，原银监会党委委员、副主席蔡鄂生一审被判死缓', publisher: '澎湃新闻', date: '2023-12-29', url: 'https://www.thepaper.cn/newsDetail_forward_25836572' },
  // 方星海
  { id: 't02-xinhua-2026-07-24-fang-xinghai-probe', who: '方星海', title: '中国证券监督管理委员会原党委委员、副主席方星海接受审查调查', publisher: '新华网', date: '2026-07-24', url: 'http://www.xinhuanet.com/20260724/8c12903da8424380b8a51e271958aedc/c.html' },
  // 杜兆才
  { id: 't02-cctv-2023-04-01-du-zhaocai-probe', who: '杜兆才', title: '国家体育总局党组成员、副局长杜兆才接受中央纪委国家监委纪律审查和监察调查', publisher: '央视网', date: '2023-04-01', url: 'https://news.cctv.com/2023/04/01/ARTI3tpfISwBIhI3XY1bM9sO230401.shtml' },
  { id: 't02-ccdi-2023-10-07-du-zhaocai-expel', who: '杜兆才', title: '国家体育总局原党组成员、副局长杜兆才严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2023-10-07', url: wb('20231007084518', 'https://www.ccdi.gov.cn/scdcn/zggb/djcf/202310/t20231007_297974.html') },
  { id: 't02-xinhua-2024-12-13-du-zhaocai-verdict', who: '杜兆才', title: '国家体育总局原副局长杜兆才一审被判有期徒刑十四年', publisher: '新华网', date: '2024-12-13', url: 'http://www.news.cn/legal/20241213/ae82f575bd624a1c82e174909b53fdd2/c.html' },
  // 吴浈
  { id: 't02-thepaper-2018-08-16-wu-zhen-probe', who: '吴浈', title: '原国家食药监总局副局长吴浈涉嫌严重违纪违法接受审查调查', publisher: '澎湃新闻', date: '2018-08-16', url: 'https://www.thepaper.cn/newsDetail_forward_2354501' },
  { id: 't02-ccdi-2019-02-02-wu-zhen-expel', who: '吴浈', title: '原国家食品药品监督管理总局党组成员、副局长吴浈严重违纪违法被开除党籍', publisher: CCDI, date: '2019-02-02', url: wb('20201104044618', 'http://www.ccdi.gov.cn/toutiao/201902/t20190202_188304.html') },
  { id: 't02-ccdi-2019-11-15-wu-zhen-verdict', who: '吴浈', title: '原国家食品药品监督管理总局副局长吴浈受贿、滥用职权案一审宣判', publisher: CCDI, date: '2019-11-15', url: wb('20201104093134', 'http://www.ccdi.gov.cn/yaowen/201911/t20191115_204410.html') },
  // 陈时飞
  { id: 't02-zaobao-2025-02-28-chen-shifei', who: '陈时飞', title: '中国药监局原副局长陈时飞落马 学者：还会揪住更大“老虎”', publisher: '联合早报', date: '2025-02-28', url: 'https://www.zaobao.com/news/china/story20250228-5946705', voice: 'zh', keep: ['陈时飞'], full: false },
  { id: 't02-thepaper-2026-chen-shifei-verdict', who: '陈时飞', title: '受贿4643万余元，国家药监局原副局长陈时飞一审获刑14年', publisher: '澎湃新闻', date: '2026-04-29', url: 'https://www.thepaper.cn/newsDetail_forward_33078833' },
  // 何泽华
  { id: 't02-ccdi-2023-01-06-he-zehua-probe', who: '何泽华', title: '国家烟草专卖局原党组成员、副局长何泽华接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-01-06', url: wb('20230107122911', 'https://www.ccdi.gov.cn/toutiaon/202301/t20230106_240135.html') },
  { id: 't02-ccdi-2023-07-06-he-zehua-expel', who: '何泽华', title: '国家烟草专卖局原党组成员、副局长何泽华严重违纪违法被开除党籍', publisher: CCDI, date: '2023-07-06', url: wb('20240510012012', 'https://www.ccdi.gov.cn/toutiaon/202307/t20230706_273786.html') },
  { id: 't02-chinanews-2024-05-29-he-zehua-verdict', who: '何泽华', title: '国家烟草专卖局原副局长何泽华受贿、利用影响力受贿案一审宣判', publisher: '中国新闻网', date: '2024-05-29', url: 'https://www.chinanews.com.cn/gn/2024/05-29/10225239.shtml' },
  // 刘跃进
  { id: 't02-ccdi-2024-03-18-liu-yuejin-probe', who: '刘跃进', title: '第十三届全国政协委员刘跃进（副部长级）接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-03-18', url: wb('20240318113425', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202403/t20240318_335129.html') },
  { id: 't02-xinhua-2025-03-27-liu-yuejin-trial', who: '刘跃进', title: '十三届全国政协委员刘跃进（副部长级）受贿案一审开庭', publisher: '新华网', date: '2025-03-27', url: 'http://www.xinhuanet.com/20250327/d69b5224ac7248f4a952c2a77f68aaa6/c.html' },
  // 孙玉宁
  { id: 't02-ccdi-2024-09-24-sun-yuning-probe', who: '孙玉宁', title: '海关总署党委委员、副署长孙玉宁接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-09-24', url: wb('20240927043557', 'https://www.ccdi.gov.cn/toutiaon/202409/t20240924_377388.html') },
  { id: 't02-court-2025-sun-yuning-verdict', who: '孙玉宁', title: '海关总署原党委委员、副署长孙玉宁受贿案一审宣判', publisher: '最高人民法院', date: '2025-12-10', url: 'https://www.court.gov.cn/fabu/xiangqing/483701.html' },
  // 宋亮
  { id: 't02-ccdi-2021-02-01-song-liang-probe', who: '宋亮', title: '甘肃省委常委、常务副省长宋亮接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2021-02-01', url: wb('20210205180039', 'http://www.ccdi.gov.cn/toutiao/202102/t20210201_235167.html') },
  { id: 't02-ccdi-2021-08-16-song-liang-expel', who: '宋亮', title: '甘肃省原省委常委、常务副省长宋亮严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2021-08-16', url: wb('20210817030137', 'https://www.ccdi.gov.cn/scdc/zggb/djcf/202108/t20210816_248396.html') },
  { id: 't02-xinhua-2022-08-30-song-liang-verdict', who: '宋亮', title: '甘肃省原副省长宋亮受贿案一审宣判', publisher: '新华网', date: '2022-08-30', url: 'http://www.news.cn/legal/2022-08/30/c_1128961918.htm' },
  // 王大伟
  { id: 't02-ccdi-2022-03-01-wang-dawei-probe', who: '王大伟', title: '辽宁省副省长、省公安厅厅长王大伟接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2022-03-01', url: wb('20220301153208', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202203/t20220301_174980.html') },
  { id: 't02-ccdi-2022-09-29-wang-dawei-expel', who: '王大伟', title: '辽宁省政府原副省长、公安厅原厅长王大伟严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2022-09-29', url: wb('20230125143110', 'https://www.ccdi.gov.cn/yaowenn/202209/t20220929_221497.html') },
  { id: 't02-people-2024-10-14-wang-dawei-verdict', who: '王大伟', title: '辽宁省政府原副省长、省公安厅原厅长王大伟受贿案一审宣判', publisher: '人民网', date: '2024-10-14', url: 'http://society.people.com.cn/n1/2024/1014/c1008-40339093.html' },
  // 张志南
  { id: 't02-ccdi-2020-04-12-zhang-zhinan-probe', who: '张志南', title: '福建省委常委、副省长张志南接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2020-04-12', url: wb('20201104123306', 'http://www.ccdi.gov.cn/toutiao/202004/t20200412_215179.html') },
  { id: 't02-ccdi-2020-09-30-zhang-zhinan-expel', who: '张志南', title: '福建省委原常委、省政府原副省长张志南严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2020-09-30', url: wb('20210126133630', 'http://www.ccdi.gov.cn/scdc/zggb/djcf/202009/t20200930_226589.html') },
  { id: 't02-chinanews-2020-12-04-zhang-zhinan-indict', who: '张志南', title: '福建省原副省长张志南被公诉', publisher: '中国新闻网', date: '2020-12-04', url: 'https://www.chinanews.com/gn/2020/12-04/9354144.shtml' },
  // 王一新
  { id: 't02-ccdi-2024-06-17-wang-yixin-expel', who: '王一新', title: '黑龙江省委原常委，省政府原党组副书记、副省长王一新严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2024-06-17', url: wb('20240617033103', 'https://www.ccdi.gov.cn/yaowenn/202406/t20240617_355164.html') },
  { id: 't02-spp-2025-01-15-wang-yixin-trial', who: '王一新', title: '黑龙江省原副省长王一新受贿案一审开庭', publisher: '最高人民检察院', date: '2025-01-15', url: wb('2026', 'https://www.spp.gov.cn//zdgz/202501/t20250115_679782.shtml') },
  // 李鹏新
  { id: 't02-ccdi-2024-06-17-li-pengxin-expel', who: '李鹏新', title: '新疆维吾尔自治区党委原副书记李鹏新严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2024-06-17', url: wb('2024', 'https://www.ccdi.gov.cn/yaowenn/202406/t20240617_355162.html') },
  { id: 't02-cctv-2025-04-22-li-pengxin-verdict', who: '李鹏新', title: '受贿超8.22亿元 李鹏新受贿案一审宣判', publisher: '央视网', date: '2025-04-22', url: 'https://news.cctv.com/2025/04/22/ARTI86gjmwmRviuIeTYbpCvi250422.shtml' },
  // 商黎光
  { id: 't02-chinacourt-2024-12-shang-liguang-verdict', who: '商黎光', title: '山西省委原副书记商黎光受贿案一审宣判', publisher: '中国法院网', date: '2024-12-27', url: wb('2026', 'https://www.chinacourt.org/article/detail/2024/12/id/8472057.shtml') },
  // 陈伟俊
  { id: 't02-xinhua-2025-11-30-chen-weijun-probe', who: '陈伟俊', title: '新疆维吾尔自治区党委常委、自治区政府常务副主席陈伟俊接受审查调查', publisher: '新华网', date: '2025-11-30', url: 'https://www.news.cn/20251130/fac113eb12bd4cb5962d4700e317119f/c.html' },
  { id: 't02-xinhua-2026-06-08-chen-weijun-expel', who: '陈伟俊', title: '新疆维吾尔自治区党委原常委、自治区政府原副主席陈伟俊严重违纪违法被开除党籍和公职', publisher: '新华网', date: '2026-06-08', url: 'https://www.xinhuanet.com/politics/20260608/920903cf860a497ca72f0247cda3189e/c.html' },
  // 曾志权
  { id: 't02-ccdi-2018-07-11-zeng-zhiquan-probe', who: '曾志权', title: '广东省委常委、统战部部长曾志权接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2018-07-11', url: wb('20201104100232', 'http://www.ccdi.gov.cn/scdc/zggb/zjsc/201807/t20180711_175491.html') },
  { id: 't02-ccdi-2019-01-04-zeng-zhiquan-expel', who: '曾志权', title: '广东省委原常委、统战部原部长曾志权严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2019-01-04', url: wb('20201104075627', 'http://www.ccdi.gov.cn/scdc/zggb/djcf/201901/t20190104_186293.html') },
  { id: 't02-people-2019-07-10-zeng-zhiquan-verdict', who: '曾志权', title: '广东省委原常委、统战部原部长曾志权受贿案一审宣判', publisher: '人民网', date: '2019-07-10', url: 'http://fanfu.people.com.cn/GB/n1/2019/0710/c64371-31224215.html' },
  // 钱引安
  { id: 't02-ccdi-2019-04-29-qian-yinan-expel', who: '钱引安', title: '陕西省委原常委、秘书长钱引安严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2019-04-29', url: wb('20201104055550', 'http://www.ccdi.gov.cn/yaowen/201904/t20190429_193167.html') },
  // 冯新柱
  { id: 't02-ccdi-2018-01-03-feng-xinzhu-probe', who: '冯新柱', title: '陕西省副省长冯新柱涉嫌严重违纪接受组织审查', publisher: CCDI, date: '2018-01-03', url: wb('20201104031356', 'http://www.ccdi.gov.cn/toutiao/201801/t20180103_160913.html') },
  { id: 't02-ccdi-2018-03-31-feng-xinzhu-expel', who: '冯新柱', title: '陕西省政府原党组成员、副省长冯新柱严重违纪被开除党籍和公职', publisher: CCDI, date: '2018-03-31', url: wb('20201104144008', 'http://www.ccdi.gov.cn/toutiao/201803/t20180331_167750.html') },
  // 季缃绮、李贻煌
  { id: 't02-ccdi-2018-01-04-ji-xiangqi-probe', who: '季缃绮', title: '山东省副省长季缃绮涉嫌严重违纪接受组织审查', publisher: CCDI, date: '2018-01-04', url: wb('20180104145742', 'http://www.ccdi.gov.cn/toutiao/201801/t20180104_161068.html') },
  { id: 't02-ccdi-2018-01-17-li-yihuang-probe', who: '李贻煌', title: '江西省副省长李贻煌涉嫌严重违纪接受组织审查', publisher: CCDI, date: '2018-01-17', url: wb('20190603102523', 'http://www.ccdi.gov.cn/toutiao/201801/t20180117_162025.html') },
  { id: 't02-ccdi-2018-02-13-ji-xiangqi-expel', who: '季缃绮', title: '山东省政府原党组成员、副省长季缃绮严重违纪被开除党籍和公职', publisher: CCDI, date: '2018-02-13', url: wb('20180214202715', 'http://www.ccdi.gov.cn/scdc/zggb/djcf/201802/t20180213_164224.html') },
  { id: 't02-people-2019-03-19-ji-xiangqi-verdict', who: '季缃绮', title: '山东省原副省长季缃绮受贿、贪污案一审判刑14年', publisher: '人民网', date: '2019-03-19', url: wb('20201109121436', 'http://leaders.people.com.cn/n1/2019/0319/c58278-30983771.html') },
  // 蒲波
  { id: 't02-ccdi-2018-05-04-pu-bo-probe', who: '蒲波', title: '贵州省副省长蒲波涉嫌严重违纪违法接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2018-05-04', url: wb('20190628070234', 'http://www.ccdi.gov.cn/toutiao/201805/t20180504_171282.html') },
  { id: 't02-ccdi-2018-11-02-pu-bo-expel', who: '蒲波', title: '贵州省政府原党组成员、副省长蒲波严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2018-11-02', url: wb('20201104040638', 'http://www.ccdi.gov.cn/toutiao/201811/t20181102_182649.html') },
  { id: 't02-chinacourt-2019-07-pu-bo-verdict', who: '蒲波', title: '贵州省人民政府原副省长蒲波受贿案一审宣判', publisher: '中国法院网', date: '2019-07-18', url: wb('20211108155303', 'https://www.chinacourt.org/article/detail/2019/07/id/4189987.shtml') },
  // 张少春
  { id: 't02-ccdi-2018-05-07-zhang-shaochun-probe', who: '张少春', title: '财政部原党组副书记、副部长张少春涉嫌严重违纪违法接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2018-05-07', url: wb('20190628091222', 'http://www.ccdi.gov.cn/toutiao/201805/t20180507_171465.html') },
  { id: 't02-ccdi-2018-09-20-zhang-shaochun-expel', who: '张少春', title: '财政部原党组副书记、副部长张少春严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2018-09-20', url: wb('20201104113240', 'http://www.ccdi.gov.cn/toutiao/201809/t20180920_180145.html') },
  // 陆克华
  { id: 't02-spp-2025-05-14-lu-kehua-arrest', who: '陆克华', title: '最高人民检察院依法对陆克华决定逮捕', publisher: '最高人民检察院', date: '2025-05-14', url: wb('2026', 'https://www.spp.gov.cn/spp/qwfb/202505/t20250514_695599.shtml') },
  { id: 't02-xinhua-2026-05-08-lu-kehua-verdict', who: '陆克华', title: '重庆市委原常委、政法委原书记陆克华受贿案一审宣判', publisher: '新华网', date: '2026-05-08', url: 'https://www.news.cn/legal/20260508/c0e17351a9e44d539a70e474856ccab6/c.html' },
  // 甘荣坤
  { id: 't02-ccdi-2021-12-02-gan-rongkun-expel', who: '甘荣坤', title: '河南省委原常委、政法委原书记甘荣坤严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2021-12-02', url: wb('20211202084412', 'https://www.ccdi.gov.cn/toutiao/202112/t20211202_255502.html') },
  { id: 't02-xinhua-2023-12-27-gan-rongkun-verdict', who: '甘荣坤', title: '河南省委原常委、政法委原书记甘荣坤受贿案一审宣判', publisher: '新华网', date: '2023-12-27', url: 'https://www.news.cn/politics/20231227/513b591d75084529bfaf8ebb0e4b23ae/c.html' },
  // 罗增斌
  { id: 't02-xinhua-2024-12-06-luo-zengbin-probe', who: '罗增斌', title: '海南省委常委、海口市委书记罗增斌接受中央纪委国家监委纪律审查和监察调查', publisher: '新华网', date: '2024-12-06', url: 'http://www.news.cn/legal/20241206/f0d3cfcb9a464ac09c7dd7f372c4ebe4/c.html' },
  { id: 't02-xinhua-2025-05-27-luo-zengbin-expel', who: '罗增斌', title: '海南省委原常委、海口市委原书记罗增斌严重违纪违法被开除党籍和公职', publisher: '新华网', date: '2025-05-27', url: 'http://www.news.cn/legal/20250527/bfaebc273ac049359ea693c99d63aee5/c.html' },
  { id: 't02-chinanews-2026-02-28-luo-zengbin-verdict', who: '罗增斌', title: '海南省委原常委、海口市委原书记罗增斌一审被判死缓', publisher: '中国新闻网', date: '2026-02-28', url: 'https://www.chinanews.com.cn/gn/2026/02-28/10578380.shtml' },
  // 周德睿
  { id: 't02-court-2026-zhou-derui-verdict', who: '周德睿', title: '天津市委原常委、组织部原部长周德睿受贿案一审宣判', publisher: '最高人民法院', date: '2026-07-13', url: 'https://www.court.gov.cn/fabu/xiangqing/505821.html' },
  // 倪强
  { id: 't02-ccdi-2025-06-25-ni-qiang-probe', who: '倪强', title: '海南省委常委、秘书长倪强接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2025-06-25', url: wb('20250920152220', 'https://www.ccdi.gov.cn/toutiaon/202506/t20250625_430717.html') },
  // 刘建洋
  { id: 't02-ccdi-2026-08-31-liu-jianyang-probe', who: '刘建洋', title: '江苏省委常委、组织部部长刘建洋接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2026-08-31', url: wb('20260903014830', 'https://www.ccdi.gov.cn/yaowenn/202608/t20260831_509681.html') },
  // 罗蔺
  { id: 't02-xinhua-2026-04-17-luo-lin-probe', who: '罗蔺', title: '重庆市委常委、两江新区区委书记罗蔺接受中央纪委国家监委纪律审查和监察调查', publisher: '新华网', date: '2026-04-17', url: 'https://www.news.cn/legal/20260417/a50cd80dbee74915a214904affa7fb60/c.html' },
  // 程晓波
  { id: 't02-xinhua-2026-08-14-cheng-xiaobo-probe', who: '程晓波', title: '甘肃省委常委、副省长程晓波接受审查调查', publisher: '新华网', date: '2026-08-14', url: 'https://www.news.cn/20260814/1a8785960cfe402fb096ffa072d1d58e/c.html' },
  // 雷思维
  { id: 't02-xinhua-2026-03-17-lei-siwei-probe', who: '雷思维', title: '甘肃省委常委、副省长雷思维接受审查调查', publisher: '新华网', date: '2026-03-17', url: 'https://www.news.cn/legal/20260317/dbcc65bdf92e4178a66655b91e1e24f7/c.html' },
  // 陈宇剑
  { id: 't02-xinhua-2026-06-10-chen-yujian-probe', who: '陈宇剑', title: '上海市政府党组成员、副市长陈宇剑接受审查调查', publisher: '新华网', date: '2026-06-10', url: 'https://www.news.cn/politics/20260610/978ccf1d42894f2f9b748df5c3e708ea/c.html' },
  { id: 't02-chinanews-2026-06-29-chen-yujian-removed', who: '陈宇剑', title: '陈宇剑，被免去上海市副市长职务', publisher: '中国新闻网', date: '2026-06-29', url: 'https://www.chinanews.com.cn/gn/2026/06-29/10649282.shtml' },
  // 江敦涛
  { id: 't02-xinhua-2025-10-25-jiang-duntao-probe', who: '江敦涛', title: '重庆市政府党组成员、副市长江敦涛接受中央纪委国家监委纪律审查和监察调查', publisher: '新华网', date: '2025-10-25', url: 'http://www.xinhuanet.com/politics/20251025/df511fd0ce644ea8b8f1a81b3c3cbd66/c.html' },
  // 高朋
  { id: 't02-spp-2024-11-06-gao-peng-arrest', who: '高朋', title: '最高人民检察院依法对高朋决定逮捕', publisher: '最高人民检察院', date: '2024-11-06', url: wb('2026', 'https://www.spp.gov.cn//qwfb/202411/t20241106_671111.shtml') },
  { id: 't02-court-2025-gao-peng-verdict', who: '高朋', title: '北京市人民政府原党组成员、副市长高朋受贿、玩忽职守案一审宣判', publisher: '最高人民法院', date: '2025-09-10', url: 'https://www.court.gov.cn/fabu/xiangqing/476001.html' },
  // 杜玉波
  { id: 't02-ccdi-2024-09-18-du-yubo-probe', who: '杜玉波', title: '教育部原党组副书记、副部长杜玉波接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-09-18', url: wb('20240927045735', 'https://www.ccdi.gov.cn/toutiaon/202409/t20240918_375837.html') },
  { id: 't02-court-2025-du-yubo-verdict', who: '杜玉波', title: '十三届全国人大教科文卫委员会副主任委员杜玉波受贿案一审宣判', publisher: '最高人民法院', date: '2025-11-26', url: 'https://www.court.gov.cn/fabu/xiangqing/482501.html' },
  // 张建春
  { id: 't02-ccdi-2024-06-21-zhang-jianchun-probe', who: '张建春', title: '中央宣传部副部长张建春接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2024-06-21', url: wb('20240621125835', 'https://www.ccdi.gov.cn/toutiaon/202406/t20240621_356603.html') },
  { id: 't02-ccdi-2024-12-10-zhang-jianchun-expel', who: '张建春', title: '中央宣传部原副部长张建春严重违纪违法被开除党籍和公职', publisher: CCDI, date: '2024-12-10', url: wb('20241213135008', 'https://www.ccdi.gov.cn/yaowenn/202412/t20241210_393179.html') },
  { id: 't02-xinhua-2025-09-16-zhang-jianchun-verdict', who: '张建春', title: '中央宣传部原副部长张建春受贿案一审宣判', publisher: '新华网', date: '2025-09-16', url: 'https://www.news.cn/20250916/01b1eb2be21c4ab3a5d98efe95e8d18a/c.html' },
  // 鲁昕
  { id: 't02-xinhua-2026-09-28-lu-xin-probe', who: '鲁昕', title: '教育部原党组成员、副部长鲁昕接受中央纪委国家监委纪律审查和监察调查', publisher: '新华网', date: '2026-09-28', url: 'https://www.news.cn/20260928/144c48d0c45340c092b07052a46e6a88/c.html' },
  // 张红力
  { id: 't02-ccdi-2023-11-04-zhang-hongli-probe', who: '张红力', title: '中国工商银行原党委委员、副行长张红力接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2023-11-04', url: wb('20231114010205', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202311/t20231104_305122.html') },
  { id: 't02-ccdi-2024-05-09-zhang-hongli-expel', who: '张红力', title: '中国工商银行原党委委员、副行长张红力严重违纪违法被开除党籍', publisher: CCDI, date: '2024-05-09', url: wb('20240516011032', 'https://www.ccdi.gov.cn/yaowenn/202405/t20240509_346893.html') },
  { id: 't02-court-2025-zhang-hongli-verdict', who: '张红力', title: '中国工商银行股份有限公司原党委委员、副行长张红力受贿案一审宣判', publisher: '最高人民法院', date: '2025-02-19', url: 'https://www.court.gov.cn/fabu/xiangqing/455281.html' },
  // 刘立宪
  { id: 't02-ccdi-2024-01-19-liu-lixian-expel', who: '刘立宪', title: '中国工商银行原党委委员、纪委书记刘立宪严重违纪违法被开除党籍', publisher: CCDI, date: '2024-01-19', url: wb('20240124012625', 'https://www.ccdi.gov.cn/toutiaon/202401/t20240119_323241.html') },
  { id: 't02-spp-2024-05-14-liu-lixian-indict', who: '刘立宪', title: '山东检察机关依法对刘立宪涉嫌受贿案提起公诉', publisher: '最高人民检察院', date: '2024-05-14', url: wb('20241016020815', 'https://www.spp.gov.cn/spp/qwfb/202405/t20240514_654103.shtml') },
  // 楼文龙
  { id: 't02-xinhua-2024-05-16-lou-wenlong-probe', who: '楼文龙', title: '中国农业银行原党委委员、副行长楼文龙接受中央纪委国家监委纪律审查和监察调查', publisher: '新华网', date: '2024-05-16', url: 'http://www.xinhuanet.com/legal/20240516/f5fb752befe242dd921384ca4e24594a/c.html' },
  { id: 't02-people-2024-11-21-lou-wenlong-expel', who: '楼文龙', title: '中国农业银行原党委委员、副行长楼文龙严重违纪违法被开除党籍', publisher: '中国共产党新闻网', date: '2024-11-21', url: 'http://cpc.people.com.cn/n1/2024/1121/c64387-40366278.html' },
  // 章更生
  { id: 't02-chinanews-2026-01-21-zhang-gengsheng-verdict', who: '章更生', title: '中国建设银行原副行长章更生一审获刑18年', publisher: '中国新闻网', date: '2026-01-21', url: 'https://www.chinanews.com/gn/2026/01-21/10556347.shtml' },
  // 林景臻
  { id: 't02-thepaper-2026-02-06-lin-jingzhen-expel', who: '林景臻', title: '中行原副行长林景臻被开除党籍：私藏阅看寄递有严重政治问题书籍', publisher: '澎湃新闻', date: '2026-02-06', url: 'https://m.thepaper.cn/newsDetail_forward_32548468' },
  // 王凤朝
  { id: 't02-ccdi-2025-11-26-wang-fengchao-probe', who: '王凤朝', title: '四川省成都市委副书记、市长王凤朝接受中央纪委国家监委纪律审查和监察调查', publisher: CCDI, date: '2025-11-26', url: wb('20260131164502', 'https://www.ccdi.gov.cn/toutiaon/202511/t20251126_461152.html') },
  // 谢长军
  { id: 't02-ccdi-2021-08-17-xie-changjun-expel', who: '谢长军', title: '原中国国电集团公司党组成员、副总经理谢长军被开除党籍', publisher: CCDI, date: '2021-08-17', url: wb('20211219214514', 'https://www.ccdi.gov.cn/scdc/zggb/djcf/202108/t20210817_248453.html') },
  { id: 't02-spp-2021-09-08-xie-changjun-arrest', who: '谢长军', title: '河北省人民检察院依法对谢长军决定逮捕', publisher: '最高人民检察院', date: '2021-09-08', url: wb('20210909024758', 'https://www.spp.gov.cn/spp/qwfb/202109/t20210908_528904.shtml') },
  // 李国华
  { id: 't02-ccdi-2022-02-18-li-guohua-probe', who: '李国华', title: '中国联合网络通信集团有限公司原党组副书记、总经理李国华接受中央纪委国家监委审查调查', publisher: CCDI, date: '2022-02-18', url: wb('20220219110735', 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/202202/t20220218_172616.html') },
  { id: 't02-ccdi-2022-09-30-li-guohua-expel', who: '李国华', title: '中国联合网络通信集团有限公司原党组副书记、总经理李国华严重违纪违法被开除党籍', publisher: CCDI, date: '2022-09-30', url: wb('20230127172933', 'https://www.ccdi.gov.cn/yaowenn/202209/t20220930_221634.html') },
  { id: 't02-xinhua-2024-05-07-li-guohua-verdict', who: '李国华', title: '中国联通原总经理李国华受贿、滥用职权案一审宣判', publisher: '新华网', date: '2024-05-07', url: 'http://www.news.cn/politics/20240507/8ac7ea2fd83b43eea7f439e3b9bb3478/c.html' },
  // 冯志斌
  { id: 't02-thepaper-2026-feng-zhibin-verdict', who: '冯志斌', title: '中化集团原副总经理冯志斌一审被判十九年', publisher: '澎湃新闻', date: '2026-09-21', url: 'https://www.thepaper.cn/newsDetail_forward_34116037' },
  // verdicts found in a second pass
  { id: 't02-court-2025-08-25-lou-wenlong-verdict', who: '楼文龙', title: '中国农业银行原党委委员、副行长楼文龙受贿案一审宣判', publisher: '最高人民法院', date: '2025-08-25', url: 'https://www.court.gov.cn/fabu/xiangqing/474201.html' },
  { id: 't02-chinanews-2025-05-16-wang-yixin-verdict', who: '王一新', title: '黑龙江省委原常委王一新一审被判无期徒刑', publisher: '中国新闻网', date: '2025-05-16', url: 'https://www.chinanews.com.cn/gn/2025/05-16/10416736.shtml' },
  { id: 't02-court-2025-06-23-liu-yuejin-verdict', who: '刘跃进', title: '十三届全国政协委员刘跃进（副部长级）受贿案一审宣判', publisher: '最高人民法院', date: '2025-06-23', url: 'https://www.court.gov.cn/fabu/xiangqing/468791.html' },
  { id: 't02-court-2019-05-14-feng-xinzhu-verdict', who: '冯新柱', title: '陕西省人民政府原副省长冯新柱受贿案一审宣判', publisher: '最高人民法院', date: '2019-05-14', url: 'https://www.court.gov.cn/fabu/xiangqing/157862.html' },
  { id: 't02-court-2019-05-13-zhang-shaochun-verdict', who: '张少春', title: '财政部原副部长张少春一审获刑15年 处罚金600万', publisher: '最高人民法院', date: '2019-05-13', url: 'https://www.court.gov.cn/fabu/xiangqing/157432.html' },
  { id: 't02-court-2019-01-29-li-yihuang-verdict', who: '李贻煌', title: '江西省人民政府原副省长李贻煌受贿、贪污、挪用公款、国有企业人员滥用职权案一审宣判', publisher: '最高人民法院', date: '2019-01-29', url: 'https://www.court.gov.cn/fabu/xiangqing/141211.html' },
  { id: 't02-court-2022-03-22-zhang-zhinan-verdict', who: '张志南', title: '福建省委原常委、省政府原副省长张志南一审被判14年', publisher: '最高人民法院', date: '2022-03-22', url: 'https://www.court.gov.cn/fabu/xiangqing/352271.html' },
  { id: 't02-court-2019-12-10-qian-yinan-verdict', who: '钱引安', title: '陕西省委原常委、秘书长钱引安受贿案一审宣判', publisher: '最高人民法院', date: '2019-12-10', url: 'https://www.court.gov.cn/fabu/xiangqing/208161.html' },
  { id: 't02-thepaper-2022-06-08-xie-changjun-verdict', who: '谢长军', title: '1.7亿公款交由他人理财，国电集团原副总经理谢长军一审获刑17年', publisher: '澎湃新闻', date: '2022-06-08', url: 'https://www.thepaper.cn/newsDetail_forward_18478045' },
  { id: 't02-court-2024-12-24-liu-lixian-verdict', who: '刘立宪', title: '中国工商银行原党委委员、纪委书记刘立宪受贿案一审宣判', publisher: '最高人民法院', date: '2024-12-24', url: 'https://www.court.gov.cn/zixun/xiangqing/450811.html' },
  { id: 't02-court-2025-11-17-li-xiangang-verdict', who: '李显刚', title: '黑龙江省人大常委会原党组成员、副主任李显刚受贿、贪污案一审宣判', publisher: '最高人民法院', date: '2025-11-17', url: 'https://www.court.gov.cn/fabu/xiangqing/481671.html' },
]
