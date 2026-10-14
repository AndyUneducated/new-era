// T01 one-off: the people of this batch and their verdict reports, in one table.
// node research/scripts/T01-spec.ts ids        check the person ids against content/people and the rosters
// node research/scripts/T01-spec.ts manifest   (re)write the verdict-report block of research/manifests/T01.yaml
//                                              from .probe/peek-<id>.txt (start / end picked around the report)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

// [name, person id, verdict source id suffix or '', url, publisher, date]
export const PEOPLE: [string, string, string?, string?, string?, string?][] = [
  ['倪发科', 'ni-fake', 'chinacourt-2015-02-28-ni-fake-verdict', 'https://www.chinacourt.org/article/detail/2015/02/id/1559049.shtml', '中国法院网', '2015-02-28'],
  ['王素毅', 'wang-suyi', 'chinacourt-2014-07-17-wang-suyi-verdict', 'https://www.chinacourt.org/article/detail/2014/07/id/1340433.shtml', '中国法院网', '2014-07-17'],
  ['李达球', 'li-daqiu', 'chinacourt-2014-10-13-li-daqiu-verdict', 'https://www.chinacourt.org/article/detail/2014/10/id/1458784.shtml', '中国法院网', '2014-10-13'],
  ['廖少华', 'liao-shaohua', 'chinacourt-2015-04-09-liao-shaohua-verdict', 'https://www.chinacourt.org/article/detail/2015/04/id/1580716.shtml', '中国法院网', '2015-04-09'],
  ['陈柏槐', 'chen-baihuai', 'chinacourt-2015-04-17-chen-baihuai-verdict', 'https://www.chinacourt.org/article/detail/2015/04/id/1597129.shtml', '中国法院网', '2015-04-17'],
  ['郭有明', 'guo-youming', 'thepaper-2015-guo-youming-verdict', 'https://web.archive.org/web/20151209090210id_/http://www.thepaper.cn/newsDetail_forward_1406697', '澎湃新闻', '2015-12'],
  ['陈安众', 'chen-anzhong', 'chinacourt-2015-06-chen-anzhong-verdict', 'https://www.chinacourt.org/article/detail/2015/06/id/1653132.shtml', '中国法院网', '2015-06'],
  ['童名谦', 'tong-mingqian', 'chinacourt-2014-08-tong-mingqian-verdict', 'https://www.chinacourt.org/article/detail/2014/08/id/1366865.shtml', '中国法院网', '2014-08'],
  ['祝作利', 'zhu-zuoli', 'xinhua-2015-11-19-zhu-zuoli-verdict', 'https://web.archive.org/web/2016id_/http://news.xinhuanet.com/legal/2015-11/19/c_1117195272.htm', '新华网', '2015-11-19'],
  ['金道铭', 'jin-daoming'],
  ['沈培平', 'shen-peiping', 'chinacourt-2015-12-shen-peiping-verdict', 'https://www.chinacourt.org/article/detail/2015/12/id/1761006.shtml', '中国法院网', '2015-12'],
  ['姚木根', 'yao-mugen'],
  ['宋林', 'song-lin', 'ccdi-2017-06-01-song-lin-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201706/t20170601_100348.html', '中央纪委监察部网站', '2017-06-01'],
  ['毛小兵', 'mao-xiaobing', 'qq-2017-05-11-mao-xiaobing-verdict', 'https://web.archive.org/web/2017id_/http://news.qq.com/a/20170511/035781.htm', '腾讯新闻', '2017-05-11'],
  ['谭栖伟', 'tan-qiwei', 'chinacourt-2016-01-tan-qiwei-verdict', 'https://www.chinacourt.org/article/detail/2016/01/id/1783870.shtml', '中国法院网', '2016-01-07'],
  ['阳宝华', 'yang-baohua', 'ce-2015-11-03-yang-baohua-verdict', 'http://district.ce.cn/newarea/sddy/201511/03/t20151103_6887230.shtml', '中国经济网', '2015-11-03'],
  ['杜善学', 'du-shanxue'],
  ['韩先聪', 'han-xiancong', 'ccdi-2016-11-15-han-xiancong-verdict', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201611/t20161115_89603.html', '中央纪委监察部网站', '2016-11-15'],
  ['陈铁新', 'chen-tiexin', 'xinhua-2016-11-22-chen-tiexin-verdict', 'https://web.archive.org/web/2017id_/http://news.xinhuanet.com/legal/2016-11/22/c_1119965996.htm', '新华网', '2016-11-22'],
  ['聂春玉', 'nie-chunyu', 'ccdi-2016-10-19-nie-chunyu-verdict', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201610/t20161019_88165.html', '中央纪委监察部网站', '2016-10-19'],
  ['白云', 'bai-yun', 'ccdi-2016-10-19-bai-yun-verdict', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201610/t20161019_88170.html', '中央纪委监察部网站', '2016-10-19'],
  ['任润厚', 'ren-runhou'],
  ['孙兆学', 'sun-zhaoxue', 'chinacourt-2016-12-sun-zhaoxue-verdict', 'https://www.chinacourt.org/article/detail/2016/12/id/2495590.shtml', '中国法院网', '2016-12'],
  ['秦玉海', 'qin-yuhai', 'ccdi-2016-11-28-qin-yuhai-verdict', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201611/t20161128_90260.html', '中央纪委监察部网站', '2016-11-28'],
  ['何家成', 'he-jiacheng', 'ccdi-2017-02-28-he-jiacheng-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201702/t20170228_94820.html', '中央纪委监察部网站', '2017-02-28'],
  ['梁滨', 'liang-bin', 'sina-2016-11-25-liang-bin-verdict', 'http://news.sina.com.cn/c/sz/2016-11-25/doc-ifxyawmp0152498.shtml', '新浪新闻', '2016-11-25'],
  ['隋凤富', 'sui-fengfu', 'huanqiu-2016-12-sui-fengfu-verdict', 'https://web.archive.org/web/2017id_/http://china.huanqiu.com/hot/2016-12/9831354.html', '环球网', '2016-12-19'],
  ['韩学键', 'han-xuejian', 'ccdi-2016-11-16-han-xuejian-verdict', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201611/t20161116_89709.html', '中央纪委监察部网站', '2016-11-16'],
  ['孙鸿志', 'sun-hongzhi', 'xinhua-2017-02-17-sun-hongzhi-verdict', 'https://web.archive.org/web/2018id_/http://news.xinhuanet.com/2017-02/17/c_1120486605.htm', '新华网', '2017-02-17'],
  ['赵智勇', 'zhao-zhiyong', 'ce-2023-11-20-zhao-zhiyong-probe', 'http://district.ce.cn/newarea/sddy/202311/20/t20231120_38798578.shtml', '中国经济网', '2023-11-20'],
  ['张田欣', 'zhang-tianxin'],
  ['陆武成', 'lu-wucheng', 'ifeng-2016-11-18-lu-wucheng-verdict', 'https://news.ifeng.com/a/20161118/50275599_0.shtml', '凤凰网', '2016-11-17'],
  ['斯鑫良', 'si-xinliang', 'ccdi-2016-12-13-si-xinliang-verdict', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201612/t20161213_91064.html', '中央纪委监察部网站', '2016-12-13'],
  ['景春华', 'jing-chunhua', 'chinacourt-2016-12-jing-chunhua-verdict', 'https://www.chinacourt.org/article/detail/2016/12/id/2493780.shtml', '中国法院网', '2016-12-23'],
  ['栗智', 'li-zhi', 'chinacourt-2016-11-li-zhi-verdict', 'https://www.chinacourt.org/article/detail/2016/11/id/2352556.shtml', '中国法院网', '2016-11-18'],
  ['徐建一', 'xu-jianyi', 'ccdi-2017-02-09-xu-jianyi-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201702/t20170209_93721.html', '中央纪委监察部网站', '2017-02-09'],
  ['徐钢', 'xu-gang', 'chinacourt-2016-12-xu-gang-verdict', 'https://www.chinacourt.org/article/detail/2016/12/id/2500674.shtml', '中国法院网', '2016-12-29'],
  ['王天普', 'wang-tianpu', 'ccdi-2017-01-24-wang-tianpu-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201701/t20170124_93342.html', '中央纪委监察部网站', '2017-01-24'],
  ['肖天', 'xiao-tian', 'chinacourt-2016-12-xiao-tian-verdict', 'https://www.chinacourt.org/article/detail/2016/12/id/2494692.shtml', '中国法院网', '2016-12-26'],
  ['乐大克', 'le-dake', 'ccdi-2015-06-26-le-dake-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201506/t20150626_58494.html', '中央纪委监察部网站', '2015-06-26'],
  ['奚晓明', 'xi-xiaoming', 'ccdi-2017-02-16-xi-xiaoming-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201702/t20170216_94095.html', '中央纪委监察部网站', '2017-02-16'],
  ['张力军', 'zhang-lijun', 'ccdi-2015-07-30-zhang-lijun-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201507/t20150730_59960.html', '中央纪委监察部网站', '2015-07-30'],
  ['谷春立', 'gu-chunli', 'xinhua-2017-03-31-gu-chunli-verdict', 'https://web.archive.org/web/2018id_/http://news.xinhuanet.com/legal/2017-03/31/c_1120734903.htm', '新华网', '2017-03-31'],
  ['邓崎琳', 'deng-qilin'],
  ['司献民', 'si-xianmin', 'qq-2017-04-28-si-xianmin-verdict', 'https://web.archive.org/web/2017id_/http://news.qq.com/a/20170428/040641.htm', '腾讯新闻', '2017-04-28'],
  ['白雪山', 'bai-xueshan', 'sina-2017-04-28-bai-xueshan-verdict', 'http://news.sina.com.cn/c/nd/2017-04-28/doc-ifyetwtf8769022.shtml', '新浪新闻', '2017-04-28'],
  ['艾宝俊', 'ai-baojun', 'ccdi-2017-04-28-ai-baojun-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201704/t20170428_98314.html', '中央纪委监察部网站', '2017-04-28'],
  ['盖如垠', 'gai-ruyin', 'ccdi-2017-04-13-gai-ruyin-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201704/t20170413_97244.html', '中央纪委监察部网站', '2017-04-13'],
  ['常小兵', 'chang-xiaobing', 'ccdi-2017-05-31-chang-xiaobing-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201705/t20170531_100246.html', '中央纪委监察部网站', '2017-05-31'],
  ['赵黎平', 'zhao-liping', 'chinacourt-2016-11-zhao-liping-verdict', 'https://www.chinacourt.org/article/detail/2016/11/id/2347562.shtml', '中国法院网', '2016-11-11'],
  ['陈雪枫', 'chen-xuefeng'],
  ['龚清概', 'gong-qinggai', 'ccdi-2017-04-20-gong-qinggai-verdict', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201704/t20170420_97648.html', '中央纪委监察部网站', '2017-04-20'],
  ['王保安', 'wang-baoan'],
  ['刘志庚', 'liu-zhigeng'],
  ['蔡希有', 'cai-xiyou', 'ccdi-2016-02-06-cai-xiyou-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201602/t20160206_74162.html', '中央纪委监察部网站', '2016-02-06'],
  ['卢子跃', 'lu-ziyue'],
  ['王阳', 'wang-yang-liaoning'],
  ['李嘉', 'li-jia-zhuhai', 'ccdi-2016-03-23-li-jia-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201603/t20160323_76548.html', '中央纪委监察部网站', '2016-03-23'],
  ['杨鲁豫', 'yang-luyu', 'ccdi-2016-04-06-yang-luyu-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201604/t20160406_77173.html', '中央纪委监察部网站', '2016-04-06'],
  ['苏宏章', 'su-hongzhang', 'chinacourt-2017-05-su-hongzhang-verdict', 'https://www.chinacourt.org/article/detail/2017/05/id/2870065.shtml', '中国法院网', '2017-05'],
  ['李成云', 'li-chengyun'],
  ['杨振超', 'yang-zhenchao', 'ccdi-2016-05-24-yang-zhenchao-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201605/t20160524_79473.html', '中央纪委监察部网站', '2016-05-24'],
  ['姚中民', 'yao-zhongmin', 'ccdi-2016-06-06-yao-zhongmin-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201606/t20160606_80021.html', '中央纪委监察部网站', '2016-06-06'],
  ['尹海林', 'yin-hailin'],
  ['陈树隆', 'chen-shulong', 'ccdi-2016-11-08-chen-shulong-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201611/t20161108_89306.html', '中央纪委监察部网站', '2016-11-08'],
  ['张文雄', 'zhang-wenxiong', 'ccdi-2018-08-16-zhang-wenxiong-verdict', 'https://web.archive.org/web/2019id_/http://www.ccdi.gov.cn/yaowen/201808/t20180816_177876.html', '中央纪委国家监委网站', '2018-08-16'],
  ['吴天君', 'wu-tianjun', 'ccdi-2016-11-11-wu-tianjun-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201611/t20161111_89448.html', '中央纪委监察部网站', '2016-11-11'],
  ['卢恩光', 'lu-enguang', 'ccdi-2016-12-16-lu-enguang-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/yw/201612/t20161216_91325.html', '中央纪委监察部网站', '2016-12-16'],
  ['郑玉焯', 'zheng-yuzhuo'],
  ['王银成', 'wang-yincheng', 'sina-2018-05-24-wang-yincheng-verdict', 'https://web.archive.org/web/2019id_/http://finance.sina.com.cn/money/insurance/bxyx/2018-05-24/doc-ihaysvix7852953.shtml', '新浪财经', '2018-05-24'],
  ['李文科', 'li-wenke', 'ce-2018-09-13-li-wenke-verdict', 'http://district.ce.cn/newarea/sddy/201809/13/t20180913_30296585.shtml', '中国经济网', '2018-09-13'],
  ['陈旭', 'chen-xu-shanghai', 'ccdi-2017-03-01-chen-xu-probe', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/xwtt/201703/t20170301_94860.html', '中央纪委监察部网站', '2017-03-01'],
  ['周春雨', 'zhou-chunyu', 'sina-2019-02-22-zhou-chunyu-verdict', 'https://news.sina.cn/2019-02-22/detail-ihrfqzka8220065.d.html', '新浪新闻', '2019-02-22'],
  ['魏民洲', 'wei-minzhou', 'ifeng-2018-11-20-wei-minzhou-verdict', 'https://web.archive.org/web/2019id_/http://news.ifeng.com/a/20181120/60168736_0.shtml', '凤凰网', '2018-11-20'],
  ['刘善桥', 'liu-shanqiao', 'ccdi-2017-06-26-liu-shanqiao-probe', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/xwtt/201706/t20170626_101730.html', '中央纪委监察部网站', '2017-06-26'],
]

// second reports for some people: probe notices that carry a résumé, or a verdict reprint
export const EXTRA: [string, string, string, string, string, string][] = [
  ['姚木根', 'yao-mugen', '163-2015-12-18-yao-mugen-verdict', 'https://web.archive.org/web/20151222093136id_/http://news.163.com/15/1218/09/BB3VUDQ300014JB6.html', '网易新闻', '2015-12-18'],
  ['斯鑫良', 'si-xinliang', 'ccdi-2015-02-16-si-xinliang-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201502/t20150216_51519.html', '中央纪委监察部网站', '2015-02-16'],
  ['王天普', 'wang-tianpu', 'ccdi-2015-04-27-wang-tianpu-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201504/t20150427_55436.html', '中央纪委监察部网站', '2015-04-27'],
  ['奚晓明', 'xi-xiaoming', 'ccdi-2015-07-12-xi-xiaoming-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201507/t20150712_59136.html', '中央纪委监察部网站', '2015-07-12'],
  ['艾宝俊', 'ai-baojun', 'ccdi-2015-11-10-ai-baojun-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201511/t20151110_64768.html', '中央纪委监察部网站', '2015-11-10'],
  ['盖如垠', 'gai-ruyin', 'ccdi-2015-12-08-gai-ruyin-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201512/t20151208_69771.html', '中央纪委监察部网站', '2015-12-08'],
  ['常小兵', 'chang-xiaobing', 'ccdi-2015-12-27-chang-xiaobing-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201512/t20151227_71624.html', '中央纪委监察部网站', '2015-12-27'],
  ['龚清概', 'gong-qinggai', 'ccdi-2016-01-19-gong-qinggai-probe', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/xwtt/201601/t20160119_73156.html', '中央纪委监察部网站', '2016-01-19'],
  ['尹海林', 'yin-hailin', 'ccdi-2016-08-22-yin-hailin-probe', 'https://web.archive.org/web/2017id_/http://www.ccdi.gov.cn/xwtt/201608/t20160822_85606.html', '中央纪委监察部网站', '2016-08-22'],
  ['尹海林', 'yin-hailin', 'ccdi-2017-01-20-yin-hailin-expel', 'https://web.archive.org/web/2018id_/http://www.ccdi.gov.cn/yw/201701/t20170120_93090.html', '中央纪委监察部网站', '2017-01-20'],
  ['王天普', 'wang-tianpu', 'court-2017-01-24-wang-tianpu-verdict', 'https://www.court.gov.cn/fabu/xiangqing/35392.html', '最高人民法院网（人民法院报）', '2017-01-25'],
  ['艾宝俊', 'ai-baojun', 'court-2017-04-28-ai-baojun-verdict', 'https://www.court.gov.cn/zixun/xiangqing/42552.html', '最高人民法院网（新华社）', '2017-04-28'],
  ['龚清概', 'gong-qinggai', 'court-2017-04-20-gong-qinggai-verdict', 'https://www.court.gov.cn/zixun/xiangqing/41262.html', '最高人民法院网（新华社）', '2017-04-20'],
  ['蔡希有', 'cai-xiyou', 'people-2018-12-26-cai-xiyou-verdict', 'http://fanfu.people.com.cn/n1/2018/1226/c64371-30489740.html', '人民网（新华网）', '2018-12-26'],
  ['杨鲁豫', 'yang-luyu', 'xinhua-2017-05-05-yang-luyu-verdict', 'http://www.xinhuanet.com/politics/2017-05/05/c_1120925789.htm', '新华网', '2017-05-05'],
  ['姚中民', 'yao-zhongmin', 'people-2017-08-05-yao-zhongmin-verdict', 'http://fanfu.people.com.cn/n1/2017/0805/c64371-29451498.html', '人民网（新华社）', '2017-08-05'],
  ['陈树隆', 'chen-shulong', 'court-2019-04-03-chen-shulong-verdict', 'https://www.court.gov.cn/fabu/xiangqing/149592.html', '最高人民法院网（新华视点）', '2019-04-03'],
  ['吴天君', 'wu-tianjun', 'people-2017-08-05-wu-tianjun-verdict', 'http://fanfu.people.com.cn/n1/2017/0805/c64371-29451490.html', '人民网（新华社）', '2017-08-05'],
  ['卢恩光', 'lu-enguang', 'people-2018-10-30-lu-enguang-verdict', 'http://fanfu.people.com.cn/n1/2018/1030/c64371-30372069.html', '人民网（新华网）', '2018-10-30'],
  ['陈旭', 'chen-xu-shanghai', 'court-2018-10-25-chen-xu-verdict', 'https://www.court.gov.cn/fabu/xiangqing/124931.html', '最高人民法院网（人民日报客户端）', '2018-10-25'],
  ['刘善桥', 'liu-shanqiao', 'people-2018-09-04-liu-shanqiao-verdict', 'http://politics.people.com.cn/n1/2018/0904/c1001-30272051.html', '人民网（新华社）', '2018-09-04'],
  ['李嘉', 'li-jia-zhuhai', 'people-2018-01-12-li-jia-verdict', 'http://fanfu.people.com.cn/n1/2018/0112/c64371-29762370.html', '人民网（新华社）', '2018-01-12'],
  ['杨振超', 'yang-zhenchao', 'court-2017-05-03-yang-zhenchao-verdict', 'https://www.court.gov.cn/zixun/xiangqing/42952.html', '最高人民法院网（人民法院报）', '2017-05-04'],
  ['郑玉焯', 'zheng-yuzhuo', 'people-2017-05-08-zheng-yuzhuo-verdict', 'http://web.archive.org/web/20181123022555id_/http://legal.people.com.cn/n1/2017/0508/c42510-29261611.html', '人民网', '2017-05-08'],
  ['金道铭', 'jin-daoming', 'chinanews-2016-10-14-jin-daoming-verdict', 'https://www.chinanews.com.cn/gn/2016/10-14/8031414.shtml', '中国新闻网（人民日报客户端）', '2016-10-14'],
  ['杜善学', 'du-shanxue', 'court-2016-12-20-du-shanxue-verdict', 'https://www.court.gov.cn/zixun/xiangqing/33461.html', '最高人民法院网', '2016-12-20'],
  ['韩先聪', 'han-xiancong', 'people-2016-11-15-han-xiancong-verdict', 'http://fanfu.people.com.cn/n1/2016/1116/c64371-28871055.html', '人民网（新华社）', '2016-11-15'],
  ['韩学键', 'han-xuejian', 'court-2016-11-16-han-xuejian-verdict', 'https://www.court.gov.cn/fabu/xiangqing/33231.html', '最高人民法院网', '2016-11-16'],
  ['徐建一', 'xu-jianyi', 'people-2017-02-09-xu-jianyi-verdict', 'http://fanfu.people.com.cn/n1/2017/0210/c64371-29070868.html', '人民网（人民日报）', '2017-02-10'],
  ['乐大克', 'le-dake', 'people-2016-12-30-le-dake-verdict', 'http://politics.people.com.cn/n1/2016/1230/c1001-28990567.html', '人民网', '2016-12-30'],
  ['王阳', 'wang-yang-liaoning', 'court-2017-05-31-wang-yang-verdict', 'https://www.court.gov.cn/fabu/xiangqing/46392.html', '最高人民法院网（法制网）', '2017-06-01'],
  ['张田欣', 'zhang-tianxin', 'ccdi-2014-07-16-zhang-tianxin-expel', 'https://web.archive.org/web/2016id_/http://www.ccdi.gov.cn/jlsc/201407/t20140716_42169.html', '中央纪委监察部网站', '2014-07-16'],
]

// markers picked by hand where the automatic pick lands in a sidebar
const MARKERS: Record<string, [string, string]> = {
  't01-sina-2017-04-28-bai-xueshan-verdict': ['2017年4月28日下午，陕西省', '简历摘自宁夏回族自治区政府官网）'],
  't01-xinhua-2017-03-31-gu-chunli-verdict': ['新华社哈尔滨3月31日电', '谷春立表示接受判决，服判不上诉。'],
  't01-xinhua-2017-02-17-sun-hongzhi-verdict': ['2017年2月17日，山东省泰安市中级人民法院', '财产不能说明来源。'],
  't01-xinhua-2017-05-05-yang-luyu-verdict': ['新华社郑州5月5日电 河南省平顶山市', '法庭遂做出上述判决。'],
  't01-ce-2023-11-20-zhao-zhiyong-probe': ['江西省人民政府驻北京办事处原科员赵智勇（省委原常委', '江西省人民政府驻北京办事处工作。'],
}

// CCDI verdict pages that Wayback never captured; these people rest on the round-ups and the column lists
const DROP = new Set(
  'han-xiancong han-xuejian xu-jianyi wang-tianpu xi-xiaoming ai-baojun gai-ruyin chang-xiaobing gong-qinggai'
    .split(' ')
    .map((k) => `${k}-verdict`),
)

const TRY2016 = new Set(
  `song-lin-verdict han-xiancong-verdict nie-chunyu-verdict bai-yun-verdict qin-yuhai-verdict he-jiacheng-verdict
  han-xuejian-verdict si-xinliang-verdict xu-jianyi-verdict wang-tianpu-verdict le-dake-probe xi-xiaoming-verdict
  zhang-lijun-probe ai-baojun-verdict gai-ruyin-verdict chang-xiaobing-verdict gong-qinggai-verdict cai-xiyou-probe
  li-jia-probe yang-luyu-probe yang-zhenchao-probe yao-zhongmin-probe lu-enguang-probe chen-xu-probe liu-shanqiao-probe
  yin-hailin-expel`
    .split(/\s+/)
    .flatMap((k) => [...PEOPLE, ...EXTRA].filter((p) => p[2]?.endsWith(k)).map((p) => `t01-${p[2]}`)),
)

const mode = process.argv[2]
if (mode === 'ids') {
  const have = new Map<string, string>()
  const names = new Map<string, string>()
  const add = (p: any, f: string) => {
    if (!p?.id) return
    have.set(p.id, `${p.name} ${f}`)
    names.set(p.name, `${p.id} ${f}`)
  }
  for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml') && !f.startsWith('T01')))
    for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) as any[]) ?? []) add(p, f)
  for (const f of ['research/roster.yaml', ...readdirSync('research/roster').filter((f) => !f.startsWith('T01')).map((f) => `research/roster/${f}`)])
    for (const p of (parse(readFileSync(f, 'utf8')) as any[]) ?? []) add(p, f)
  const out = PEOPLE.map(([n, id]) =>
    have.has(id) ? `CLASH ${id} ${n} vs ${have.get(id)}` : names.has(n) ? `NAME  ${id} ${n} vs ${names.get(n)}` : `ok    ${id} ${n}`,
  )
  writeFileSync('.probe/T01-ids.txt', out.join('\n') + '\n', 'utf8')
}
if (mode === 'manifest') {
  const blocks: string[] = []
  const report: string[] = []
  for (const [name, , suffix, rawUrl, publisher, date] of [...PEOPLE, ...EXTRA]) {
    if (!suffix || (suffix.startsWith('ccdi-') && DROP.has(suffix.replace(/^ccdi-[\d-]+-/, '')))) continue
    // www.chinacourt.org does not resolve from here; its pages are read through Wayback
    // and web.archive.org refuses connections on 443 from here but answers on 80
    const url = rawUrl!
      .replace(/^https:\/\/www\.chinacourt\.org\//, 'https://web.archive.org/web/2017id_/http://www.chinacourt.org/')
      .replace(/^https:\/\/web\.archive\.org\//, 'http://web.archive.org/')
      // these CCDI pages 404 at the 2017/2018 captures; ask for the capture nearest 2016 instead
      .replace(/\/web\/201[78]id_\/(?=http:\/\/www\.ccdi\.gov\.cn\/)/, (m) => (TRY2016.has(`t01-${suffix}`) ? '/web/2016id_/' : m))
    const id = `t01-${suffix}`
    const peek = `.probe/peek-${id}.txt`
    let start: string | undefined
    let end: string | undefined
    if (existsSync(peek)) {
      const paras = readFileSync(peek, 'utf8').split(/\n+/).map((p) => p.trim()).filter(Boolean)
      // the report starts at the first long paragraph naming the defendant, and ends at the last paragraph
      // that tells the sentence or the court's reasoning
      const notice = /^t01-ccdi-.*-(probe|expel)$/.test(id)
      const i = notice
        ? paras.findIndex((p) => p.includes(name) && !p.includes('——') && /目前正|接受组织|开除党籍|处分|经查/.test(p))
        : paras.findIndex((p) => p.includes(name) && p.length > 60)
      const tail = paras.slice(i)
      const k = notice
        ? tail.findIndex((p) => p.startsWith('©')) - 1
        : tail.reduce((last, p, j) => (/判决|判处|宣判|上缴国库|不上诉|从轻处罚|立案侦查|审查调查|监察调查|移送|担任|指控|查明/.test(p) && p.length > 60 ? j : last), -1)
      if (i >= 0) start = paras[i].slice(0, 16)
      if (k >= 0) end = tail[k].slice(-14)
      report.push(`${id}\t${i}\t${k}\t${start}\t…\t${end}`)
    }
    if (MARKERS[id]) [start, end] = MARKERS[id]
    else if (existsSync(peek)) {
    } else if (/ccdi\.gov\.cn/.test(url)) {
      // Wayback refuses most requests, so unpeeked CCDI pages are fetched once with the site's own frame
      start = '发布时间'
      end = '版权所有'
      report.push(`${id}\tNO PEEK, ccdi frame`)
    } else report.push(`${id}\tNO PEEK`)
    const q = (s: string) => JSON.stringify(s)
    blocks.push(
      [
        `  - id: ${id}`,
        `    title: ${name}案报道（${date}）`,
        `    publisher: ${publisher}`,
        `    date: ${date}`,
        `    voice: official`,
        `    url: ${url}`,
        ...(start ? [`    start: ${q(start)}`] : []),
        ...(end ? [`    end: ${q(end)}`] : []),
      ].join('\n'),
    )
  }
  const file = 'research/manifests/T01.yaml'
  const mark = '  # per-person reports (generated by research/scripts/T01-spec.ts)\n'
  const head = readFileSync(file, 'utf8').split(mark)[0]
  writeFileSync(file, head + mark + blocks.join('\n') + '\n', 'utf8')
  writeFileSync('.probe/T01-markers.txt', report.join('\n') + '\n', 'utf8')
}
