// One-off: writes research/manifests/E09.yaml (CDT lexicon entries are generated so their URLs are encoded consistently).
import { writeFileSync } from 'node:fs'
import { stringify } from 'yaml'

type Web = Record<string, unknown> & { id: string }

// [slug, lexicon page title, keep strings]
const cdt: [string, string, string[]][] = [
  ['moha', '膜蛤', ['2000年10月，时任国家主席的江泽民', '这段完整视频被上传到了YouTube', '2016年8月17日，在江泽民90周岁生日', '长期以来中共对于膜蛤均持打压态度', '新蛤社']],
  ['dajiangyou', '打酱油', ['广州电视台《今日报导》']],
  ['pimin', '屁民', ['林嘉祥', '萧强在2014年的TEDx']],
  ['kuasheng', '跨省追捕', ['灵宝警方对王帅', '2008年5月，河南省灵宝市政府', '宁夏吴忠市市委、市政府通报']],
  ['beidaibiao', '被代表', ['“被代表”是从2009年', '汉语盘点2009', '工农代表比例仅仅是8.24%']],
  ['bei-zisha', '被自杀', ['我不自殺']],
  ['li-wangyang', '李旺阳', ['2012年5月22日，李旺阳接受香港有线电视台采访']],
  ['lvba-niang', '绿坝娘', ['”绿坝娘“是中国大陆', '中国大陆的动漫爱好者们']],
  ['hexie', '河蟹', ['要求屏蔽的政治信息近六倍']],
  ['kong-yizi', '空椅子', ['现场摆放了一张空椅子象征', '南方都市报》在其 2010年12月12日', '刘晓B']],
  ['hecha', '喝茶', ['“喝茶”通常指', '2015年，著名翻墙工具shadowsocks的作者', '关注雪饼']],
  ['chao-shuibiao', '抄水表', ['派出所的故事']],
  ['fanqiang', '翻墙', ['#随手扔方校长解救中国互联网', '许东被捕', '在被“喝茶”后，宣布中止项目维护', '2020年10月，浙江省政务服务网', '2023年4月，央视在', '2023年11月，Clash for Windows']],
  ['bingmo', '祝病魔早日战胜方校长', ['最不厚道']],
  ['fang-binxing', '方滨兴', ['2013年2月在中国的农历新年之际']],
  ['xiujiashi', '休假式治疗', ['接受休假式的治疗']],
  ['diaosi', '屌丝', ['2011年底，屌丝一词', '当它最初出现时']],
  ['zhengnengliang', '正能量', ['2012年末，“正能量”被《咬文嚼字》', '2013年8月，时任国家互联网信息办公室主任的鲁炜', '2014年10月，国家主席习近平在文艺工作座谈会', '放在公园里就是正能量']],
  ['xibaozi', '习包子', ['2017年7月7日', '湖南张家界网民敬迎军', '2017年8月24日', '罗平一网民在微信群']],
  ['ruxia', '辱包', ['2016年9月4日，习近平在G20杭州峰会', '客车司机连续疲劳驾驶不换班']],
  ['apec-blue', 'APEC蓝', ['城六区PM2.5浓度']],
  ['zhaojiaren', '赵家人', ['细思极恐的万科宝能之争', '中宣部下令要求媒体不得使用', '2016年2月29日，网络博客编程随想']],
  ['wumao', '五毛党', ['这个术语源于网民对这些人声称', 'Gary King团队的研究', '自带干粮的五毛']],
  ['ziganwu', '自干五', ['自乾五，全稱']],
  ['mitu', '米兔', ['米兔为”Me Too', '2018年7月，曾在CCTV', '2019年7月，女权主义者试图']],
  ['azhong', '阿中哥哥', ['8月14日，饭圈女孩连同帝吧网友', '随后两天，《环球时报》', '8月18日的新闻联播里', '饭圈治国']],
  ['dijihong2', '低级红高级黑', ['正式进入官方正式文件', '2022年9月5日，浙江省委宣传部', '南昌铁路官微', '为了回击高市早苗的挑衅', '胡锡进在2025年11月']],
  ['ruguanxue', '入关学', ['2019年12月，当他看到问答网站']],
  ['jiasushi', '总加速师', ['2020年始，社交網站Twitter']],
  ['jiasuzhuyi', '加速主义', ['2021年3月，推特平台上出现大量机器人账号', '2022年3月，环球时报发文批']],
  ['ai-fen', '艾芬', ['老子到处说，是不是']],
  ['houlang', '后浪', ['2020年5月3日晚', '向你们的自信致敬']],
  ['xiaozhen', '小镇做题家', ['“小镇做题家”最早于2020年', '2020年12月20日，官媒《中青评论》', '易烊千玺凭什么不能考编', '可以是自嘲，但不能变为']],
  ['li-jiaqi', '李佳琦', ['李佳琦悖论”指的是']],
  ['erjiu', '二舅', ['2022年7月26日，一段名为', '7月26日，人民日报微博', '面对命运冷峻的玩笑，二舅没有躺倒', '在《二舅叙事本质是苦难美学》写道', '这个叙事遮蔽了生产苦难的社会环境', '据德国之声报道，《二舅》在7月31日', '微博话题#二舅短片涉及内容虚构已被撤销推荐#']],
  ['renkuang', '人矿', ['“人矿”意为', '中国数字时代1月2日对该知乎问答备份', '新浪微博将“人矿”一词完全禁搜']],
  ['jiucai', '韭菜', ['最早指投资股市的散户', '西安政府部门给民众发送']],
  ['quanzhi-ernv', '全职儿女', ['一种年轻人退出就业市场', '4月份该数字继续攀升至20.4%']],
  ['danchaofan', '蛋炒饭', ['11月25日，是一年一度的', '2023年11月27日，中国知名的美食博主王刚', '2024年1月3日，有读者向中国数字时代投稿', '蛋炒饭悖论：一边辟谣']],
  ['may-35b', '5月35号', ['5月35日在现实的时序里面并不存在', '5月35日式的自由是一种艺术', '10月1日，在杭州亚运会女子100米栏决赛中', '相关图片不久之后都遭到了官方的审查']],
]

const web: Web[] = cdt.map(([slug, term, keep]) => ({
  id: `e09-cdt-space-${slug}`,
  title: `中国数字空间·草泥马语：${term}`,
  publisher: '中国数字时代',
  voice: 'zh',
  url: `https://chinadigitaltimes.net/space/${encodeURIComponent(term)}`,
  excerpt: true,
  keep,
}))

const news: Web[] = [
  { id: 'e09-cdt-2025-12-18-sensitive-words', title: '【年终专题】“演习进逼，拿下台湾”……2025年度敏感词', publisher: '中国数字时代', date: '2025-12-18', voice: 'zh', url: 'https://chinadigitaltimes.net/chinese/723561.html', excerpt: true, keep: ['拆字派则用“羽哥”', '可能可以活到150岁', '4月初，中国军方针对台海局势', '屏山县公安局在5月22日凌晨', '在这股情绪推动下', '面对同情违法者的汹涌舆情', '2025年11月，日本首相高市早苗', '原订于11月29日在上海', '但在11月29日当天', '12月1日，上述工作人员'] },
  { id: 'e09-infzm-2009-05-14-qishima', title: '70码？“欺实马”？', publisher: '南方周末', author: '吕明合', date: '2009-05-14', voice: 'zh', url: 'https://www.infzm.com/contents/28397', excerpt: true, keep: ['“70码”随后成了最热的网络新名词', '5月8日下午2点'] },
  { id: 'e09-cctv-2009-05-15-hangzhou-speed', title: '富家子飙车案：肇事车时速84.1公里~101.2公里', publisher: '央视网（转载广州日报）', date: '2009-05-15', voice: 'official', url: 'http://news.cctv.com/china/20090515/100651.shtml', excerpt: true, keep: ['杭州市公安局新闻发言人向社会公布', '立即成为网络流行语'] },
  { id: 'e09-bbc-2009-07-01-green-dam', title: '艾未未：推迟绿坝是网民的胜利', publisher: 'BBC 中文', date: '2009-07-01', voice: 'zh', url: 'http://news.bbc.co.uk/chinese/simp/hi/newsid_8120000/newsid_8127800/8127816.stm', excerpt: true, keep: ['网民的一个胜利', '在国内舆论和国际社会的双重压力下', '6月19日的通知'] },
  { id: 'e09-chinanews-2009-06-23-lu-jun', title: '中国查处“失言”官员 告诫各级干部不要忘本', publisher: '中国新闻网（转载新华网）', date: '2009-06-23', voice: 'official', url: 'http://www.chinanews.com.cn/gn/news/2009/06-23/1746072.shtml', excerpt: true, keep: ['因质问记者', '事情源于17日中央人民广播电台', '组织部门已要求逯军停止工作'] },
  { id: 'e09-bbc-2011-08-12-lu-jun-back', title: '大家谈中国：停职官员复职不该让民意缺席', publisher: 'BBC 中文', author: '童克震', date: '2011-08-12', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/comments_on_china/2011/08/110812_coc_china_officials_back', excerpt: true, keep: ['被停职后复出'] },
  { id: 'e09-bbc-2011-07-02-red-cross', title: '中国红会喊停“商业红会”活动', publisher: 'BBC 中文', date: '2011-07-02', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese_news/2011/07/110702_china_red_cross_scandal', excerpt: true, keep: ['中国红十字会商业总经理', '杜撰', '欠缺透明度', '420万元'] },
  { id: 'e09-bbc-2011-12-31-guo-meimei-report', title: '中国红十字会发布郭美美事件报告', publisher: 'BBC 中文', date: '2011-12-31', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/rolling_news/2011/12/111231_rolling_guomm', excerpt: true, keep: ['称郭美美与红会及商红会无任何关系', '决定撤销商业系统红十字会'] },
  { id: 'e09-chinanews-2012-10-13-xingfu', title: '央视"你幸福吗"不带政治任务 没预见"我姓曾"会红', publisher: '中国新闻网（转载北京青年报）', date: '2012-10-13', voice: 'official', url: 'https://www.chinanews.com.cn/cul/2012/10-13/4245186.shtml', excerpt: true, keep: ['这一提问不带有政治任务', '我是外地打工的', '没有预见会爆红'] },
  { id: 'e09-bbc-2012-10-17-xingfu', title: '大家谈中国：幸福还是幸运？', publisher: 'BBC 中文', author: '古岸', date: '2012-10-17', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/comments_on_china/2012/10/121017_coc_happiness_prog_tv', excerpt: true, keep: ['不如说他们是幸运的', '建议央视不要再折腾'] },
  { id: 'e09-cctv-2008-12-23-cnn', title: '2008网络流行语：做人别太CNN', publisher: '央视网', date: '2008-12-23', voice: 'official', url: 'http://www.cctv.com/special/C22314/20081223/107426.shtml', excerpt: true, keep: ['做人不能太CNN”风靡网络', '是非不分'] },
  { id: 'e09-bbc-2018-02-26-term-limits', title: '习近平修宪：中国废除主席连任期限 二十大后中国何去何从', publisher: 'BBC 中文', date: '2018-02-26', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese-news-43193977', excerpt: true, keep: ['袁世凯采访手记', '“移民”二字的指数'] },
  { id: 'e09-bbc-2020-03-11-fashaozi', title: '肺炎疫情：“发哨人”引发反审查战，中国人用创意接力反击', publisher: 'BBC 中文', author: '云昇', date: '2020-03-11', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese-news-51831652', excerpt: true, keep: ['3月10日早上', '这篇文章发出后不久便被删除', '甲骨文、颜文字', '同一上午习近平开始了他的武汉之旅'] },
  { id: 'e09-bbc-2020-11-06-chuan-jianguo', title: '美国大选2020：中国民众隔岸观火，“川建国”VS“拜振华”之战中自娱自乐', publisher: 'BBC 中文', date: '2020-11-06', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese-news-54823075', excerpt: true, keep: ['大家都很熟悉', '最初来源于特朗普的另一个中国译名', '是中国网民为拜登所取的中文名称'] },
  { id: 'e09-bbc-2022-06-06-tank-cake', title: '中国网红李佳琦疑因“坦克冰淇淋”踩到“六四”红线', publisher: 'BBC 中文', date: '2022-06-06', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese-news-61704544', excerpt: true, keep: ['已连续三天缺席直播', '周五（6月3日）晚', '这款冰淇淋的造型类似一辆坦克', '后台技术故障'] },
  { id: 'e09-nyt-2022-09-30-covid-words', title: '中国防疫宣传口号和“造词运动”引发混乱和不满', publisher: '纽约时报中文网', author: 'Zixu Wang', date: '2022-09-30', voice: 'zh', url: 'https://cn.nytimes.com/china/20220930/china-covid-propaganda/', excerpt: true, keep: ['至少已经出现了120个', '居家办公', '混沌模糊', '用荒谬来打败荒谬'] },
  { id: 'e09-bbc-2022-10-21-lockdown-words', title: '中共二十大如何“推动”了新冠疫情封锁', publisher: 'BBC 中文', date: '2022-10-21', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese-news-63341064', excerpt: true, keep: ['全域静默', '临时社会面管控'] },
  { id: 'e09-bbc-2022-07-14-mortgage-boycott', title: '中国房地产“断供潮”：多地“烂尾楼”业主拒付房贷折射出的经济问题', publisher: 'BBC 中文', date: '2022-07-14', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/chinese-news-62149379', excerpt: true, keep: ['有多达52个停工或烂尾楼盘', '对社会稳定构成威胁'] },
  { id: 'e09-bbc-2024-09-13-huawei', title: '华为三折叠手机Mate XT发布：中国技术是否已突破美国制裁', publisher: 'BBC 中文', author: '吕嘉鸿', date: '2024-09-13', voice: 'zh', url: 'https://www.bbc.com/zhongwen/simp/business-69339325', excerpt: true, keep: ['电子茅台', '叫板美国'] },
  { id: 'e09-cdt-2023-10-28-yaoyao-lingxian', title: '我们的言论｜民族主义的“遥遥领先”', publisher: '中国数字时代（转载微信公众号“我们的言论”）', date: '2023-10-28', voice: 'zh', url: 'https://chinadigitaltimes.net/chinese/701576.html', excerpt: true, keep: ['华为的走卒因为新手机的发布沾沾自喜', '支持华为，我们的工人们的生活水平就会提高了吗'] },
  { id: 'e09-rfa-2024-10-01-niuma', title: '脱口秀吐槽"牛马"现象 劳动者的绝望指向何方', publisher: '自由亚洲电台', date: '2024-10-01', voice: 'zh', url: 'https://www.rfa.org/mandarin/yataibaodao/shehui/wy-china-laborer-well-being-deteriorates-10012024103421.html', excerpt: true, keep: ['近几年，中国网友常用', '挤我的奶给我喝', '这句话借用了职场', '类似‘韭菜’和‘人矿’', '34%的人自嘲过着'] },
  { id: 'e09-nyt-2026-07-07-dream-core', title: '“中式梦核”：中国Z时代为何怀恋2000年代？', publisher: '纽约时报中文网', author: '郭莉莉、Pei-Lin Wu', date: '2026-07-07', voice: 'zh', url: 'https://cn.nytimes.com/china/20260707/china-nostalgia-dream-core/', excerpt: true, keep: ['对许多中国年轻人来说', '他们在网上分享网吧', '这一趋势催生了一种被称为', '中国热门社交媒体应用小红书上', '自从2020年代这个词开始出现在社交媒体上以来', '主要粉丝群体来自出生于1990年代末', '中国还没有对“中式梦核”内容进行审查'] },
]

const out = '# E09 events: folk lane (buzzwords, memes, censorship). Generated by research/scripts/E09-manifest.ts\n' + stringify({ web: [...web, ...news] }, { lineWidth: 0 })
writeFileSync(new URL('../manifests/E09.yaml', import.meta.url), out)
console.log([...web, ...news].map((w) => w.id).join(' '))
