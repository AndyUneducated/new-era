// P01 one-off: writes research/manifests/P01.yaml and content/chiefs/P01.yaml from the tables below.
// Keeps for the list pages are picked from .probe/peek-<id>.txt; start/end of official pages likewise.
// Report: .probe/P01-gen.txt
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { BIOS } from './P01-bio-list.ts'

const SLUG: Record<string, string> = {
  北京: 'beijing', 天津: 'tianjin', 河北: 'hebei', 山西: 'shanxi', 内蒙古: 'neimenggu', 辽宁: 'liaoning', 吉林: 'jilin', 黑龙江: 'heilongjiang',
  上海: 'shanghai', 江苏: 'jiangsu', 浙江: 'zhejiang', 安徽: 'anhui', 福建: 'fujian', 江西: 'jiangxi', 山东: 'shandong',
}

// prov|post|name|person|from|to|acting|note|cite   (cite: L = the list page, b:x = p01-wiki-x, else the id)
const CHIEFS = `
北京|sec|贾庆林|jia-qinglin|1997-08|2002-10|||L
北京|sec|刘淇|liu-qi|2002-10|2012-07|||L
北京|sec|郭金龙|guo-jinlong|2012-07|2017-05|||L
北京|sec|蔡奇|cai-qi|2017-05|2022-11|||L
北京|sec|尹力|yin-li|2022-11||||p01-xinhua-2022-11-13-yin-li
北京|gov|刘淇|liu-qi|1999-02|2003-01|||L
北京|gov|孟学农|meng-xuenong|2003-01|2003-04|||L
北京|gov|王岐山|wang-qishan|2003-04|2004-02|1|代市长|L
北京|gov|王岐山|wang-qishan|2004-02|2007-11|||L
北京|gov|郭金龙|guo-jinlong|2007-11|2008-01|1|代市长|L
北京|gov|郭金龙|guo-jinlong|2008-01|2012-07|||L
北京|gov|王安顺||2012-07|2013-01|1|代市长|L
北京|gov|王安顺||2013-01|2016-10|||L
北京|gov|蔡奇|cai-qi|2016-10|2017-01|1|代市长|L
北京|gov|蔡奇|cai-qi|2017-01|2017-05|||L
北京|gov|陈吉宁|chen-jining|2017-05|2018-01|1|代市长|L
北京|gov|陈吉宁|chen-jining|2018-01|2022-10|||L
北京|gov|殷勇||2022-10|2023-01|1|代市长|p01-xinhua-2022-10-28-yin-yong
北京|gov|殷勇||2023-01||||L
天津|sec|张立昌|zhang-lichang|1997-08|2007-03|||L
天津|sec|张高丽|zhang-gaoli|2007-03|2012-11|||L
天津|sec|孙春兰|sun-chunlan|2012-11|2014-12|||L
天津|sec|黄兴国|huang-xingguo|2014-12|2016-09|1|代理书记|L
天津|sec|李鸿忠|li-hongzhong|2016-09|2022-12|||L
天津|sec|陈敏尔|chen-miner|2022-12||||b11-xinhua-2022-12-08-chen-tianjin
天津|gov|李盛霖||1998-05|2002-12|||L
天津|gov|戴相龙||2002-12|2003-01|1|代市长|b:dai-xianglong
天津|gov|戴相龙||2003-01|2007-12|||b:dai-xianglong
天津|gov|黄兴国|huang-xingguo|2007-12|2008-01|1|代市长|b:huang-xingguo
天津|gov|黄兴国|huang-xingguo|2008-01|2016-09|||L
天津|gov|王东峰|wang-dongfeng|2016-09|2016-11|1|代市长|f07-wiki-wang-dongfeng
天津|gov|王东峰|wang-dongfeng|2016-11|2017-10|||f07-wiki-wang-dongfeng
天津|gov|张国清|zhang-guoqing|2018-01|2018-01|1|代市长；王东峰2017年10月调任河北后市长空缺约两个月|c02-wiki-zhang-guoqing
天津|gov|张国清|zhang-guoqing|2018-01|2020-09|||c02-wiki-zhang-guoqing
天津|gov|廖国勋||2020-09|2020-09|1|代市长|p01-xinhua-2020-09-03-liao-guoxun
天津|gov|廖国勋||2020-09|2022-04||2022年4月在任上去世|b:liao-guoxun
天津|gov|张工||2022-05|2022-07|1|代市长|p01-xinhua-2022-05-31-zhang-gong
天津|gov|张工||2022-07||||b:zhang-gong
河北|sec|叶连松||1998-10|2000-06|||L
河北|sec|王旭东||2000-06|2002-11|||L
河北|sec|白克明||2002-11|2007-08|||L
河北|sec|张云川||2007-08|2011-08|||L
河北|sec|张庆黎||2011-08|2013-03|||L
河北|sec|周本顺|zhou-benshun|2013-03|2015-07|||L
河北|sec|赵克志|zhao-kezhi|2015-07|2017-10|||L
河北|sec|王东峰|wang-dongfeng|2017-10|2022-04|||L
河北|sec|倪岳峰|ni-yuefeng|2022-04|2026-07|||p01-xinhua-2022-04-22-ni-yuefeng
河北|sec|罗文||2026-07||||p01-xinhua-2026-07-31-luo-wen
河北|gov|钮茂生||1999-01|2002-12||1998年10月起任代省长、1999年1月当选（传记）；名录作1999年11月6日起，与传记不合|b:niu-maosheng
河北|gov|季允石||2002-12|2003-01|1|代省长|b:ji-yunshi
河北|gov|季允石||2003-01|2006-10|||L
河北|gov|郭庚茂||2006-10|2007-01|1|代省长|p01-people-2013-01-29-guo-gengmao
河北|gov|郭庚茂||2007-01|2008-04|||p01-people-2013-01-29-guo-gengmao
河北|gov|胡春华|hu-chunhua|2008-04|2009-01|1|代省长|p01-chinanews-2009-01-12-hu-chunhua
河北|gov|胡春华|hu-chunhua|2009-01|2009-11|||p01-chinanews-2009-01-12-hu-chunhua
河北|gov|陈全国|chen-quanguo|2009-11|2010-01|1|代省长|b:chen-quanguo
河北|gov|陈全国|chen-quanguo|2010-01|2011-08|||L
河北|gov|张庆伟|zhang-qingwei|2011-08|2012-01|1|代省长|b:zhang-qingwei
河北|gov|张庆伟|zhang-qingwei|2012-01|2017-04|||b:zhang-qingwei
河北|gov|许勤||2017-04|2017-04|1|代省长|b:xu-qin
河北|gov|许勤||2017-04|2021-10|||b:xu-qin
河北|gov|王正谱||2021-10|2022-01|1|代省长|p01-xinhua-2021-10-21-wang-zhengpu
河北|gov|王正谱||2022-01||||b:wang-zhengpu
山西|sec|田成平||1999-06|2005-06|||b:tian-chengping
山西|sec|张宝顺|zhang-baoshun|2005-07|2010-05|||b:zhang-baoshun
山西|sec|袁纯清|yuan-chunqing|2010-05|2014-09|||b:yuan-chunqing
山西|sec|王儒林||2014-09|2016-06|||L
山西|sec|骆惠宁|luo-huining|2016-06|2019-11|||L
山西|sec|楼阳生|lou-yangsheng|2019-11|2021-05|||L
山西|sec|林武|lin-wu|2021-05|2022-12||名录与任免消息作2021年5月任省委书记；林武传记作2021年6月|p01-xinhua-2022-12-29-lin-wu
山西|sec|蓝佛安||2022-12|2023-09||2023年9月28日卸任，至10月28日唐登杰到任，省委书记空缺一个月|p01-xinhua-2022-12-29-lan-foan
山西|sec|唐登杰||2023-10||||p01-xinhua-2023-10-28-tang-dengjie
山西|gov|刘振华||1999-06|2000-01|1|代省长；名录作1999年7月起|b:liu-zhenhua
山西|gov|刘振华||2000-01|2004-01|||L
山西|gov|张宝顺|zhang-baoshun|2004-01|2004-01|1|代省长|b:zhang-baoshun
山西|gov|张宝顺|zhang-baoshun|2004-01|2005-07|||L
山西|gov|于幼军||2005-07|2006-01|1|代省长|b:yu-youjun
山西|gov|于幼军||2006-01|2007-08|||b:yu-youjun
山西|gov|孟学农|meng-xuenong|2007-09|2008-01|1|代省长|b:meng-xuenong
山西|gov|孟学农|meng-xuenong|2008-01|2008-09|||b:meng-xuenong
山西|gov|王君||2008-09|2009-01|1|代省长|b:wang-jun
山西|gov|王君||2009-01|2012-12|||L
山西|gov|李小鹏|li-xiaopeng|2012-12|2013-01|1|代省长|b:li-xiaopeng
山西|gov|李小鹏|li-xiaopeng|2013-01|2016-08|||b:li-xiaopeng
山西|gov|楼阳生|lou-yangsheng|2016-08|2016-11|1|代省长|f07-wiki-lou-yangsheng
山西|gov|楼阳生|lou-yangsheng|2016-11|2019-12|||f07-wiki-lou-yangsheng
山西|gov|林武|lin-wu|2019-12|2020-01|1|代省长|f07-wiki-lin-wu
山西|gov|林武|lin-wu|2020-01|2021-06|||p01-xinhua-2022-12-29-lin-wu
山西|gov|蓝佛安||2021-06|2021-06|1|代省长|b:lan-foan
山西|gov|蓝佛安||2021-06|2022-12|||b:lan-foan
山西|gov|金湘军|jin-xiangjun|2022-12|2023-01|1|代省长|p01-xinhua-2022-12-30-jin-xiangjun
山西|gov|金湘军|jin-xiangjun|2023-01|2025-04|||b:jin-xiangjun
山西|gov|卢东亮||2025-06|2025-06|1|代省长；金湘军2025年4月辞职后省长空缺约一个半月|p01-xinhua-2025-06-03-lu-dongliang
山西|gov|卢东亮||2025-06||||p01-xinhua-2025-06-16-lu-dongliang
内蒙古|sec|刘明祖||1994-08|2001-08|||L
内蒙古|sec|储波||2001-08|2009-11|||L
内蒙古|sec|胡春华|hu-chunhua|2009-11|2012-12|||L
内蒙古|sec|王君||2012-12|2016-08|||L
内蒙古|sec|李纪恒||2016-08|2019-10|||L
内蒙古|sec|石泰峰|shi-taifeng|2019-10|2022-04|||L
内蒙古|sec|孙绍骋|sun-shaocheng|2022-04|2025-09|||p01-xinhua-2022-04-30-sun-shaocheng
内蒙古|sec|王伟中||2025-09||||p01-xinhua-2025-09-30-wang-weizhong
内蒙古|gov|云布龙||1998-01|2000-06||2000年6月12日在任上去世|L
内蒙古|gov|乌云其木格||2000-08|2001-02|1|代主席|b:wuyunqimuge
内蒙古|gov|乌云其木格||2001-02|2003-04|||L
内蒙古|gov|杨晶|yang-jing|2003-04|2004-01|1|代主席|p01-xinhua-2008-04-03-bater
内蒙古|gov|杨晶|yang-jing|2004-01|2008-04|||p01-xinhua-2008-04-03-bater
内蒙古|gov|巴特尔||2008-04|2009-01|1|代主席|p01-xinhua-2008-04-03-bater
内蒙古|gov|巴特尔||2009-01|2016-03|||b:bater
内蒙古|gov|布小林||2016-03|2016-06|1|代主席|b:bu-xiaolin
内蒙古|gov|布小林||2016-06|2021-08|||b:bu-xiaolin
内蒙古|gov|王莉霞||2021-08|2021-09|1|代主席|p01-people-2021-08-05-wang-lixia
内蒙古|gov|王莉霞||2021-09|2025-09|||p01-xinhua-2021-09-09-wang-lixia
内蒙古|gov|包钢||2025-10|2025-10|1|代主席|p01-xinhua-2025-10-13-bao-gang
内蒙古|gov|包钢||2025-10||||p01-xinhua-2025-10-18-bao-gang
辽宁|sec|闻世震||1997-08|2004-12|||L
辽宁|sec|李克强|li-keqiang|2004-12|2007-10|||L
辽宁|sec|张文岳||2007-10|2009-11|||L
辽宁|sec|王珉|wang-min|2009-11|2015-05|||L
辽宁|sec|李希|li-xi|2015-05|2017-10|||L
辽宁|sec|陈求发|chen-qiufa|2017-10|2020-08||陈求发传记作2020年10月卸任|L
辽宁|sec|张国清|zhang-guoqing|2020-08|2022-11||张国清传记作2020年9月1日任|L
辽宁|sec|郝鹏|hao-peng|2022-11|2025-09|||p01-xinhua-2022-11-28-hao-peng
辽宁|sec|许昆林|xu-kunlin|2025-09||||p01-xinhua-2025-09-30-xu-kunlin
辽宁|gov|张国光||1998-01|2001-01|||L
辽宁|gov|薄熙来|bo-xilai|2001-01|2001-02|1|代省长|L
辽宁|gov|薄熙来|bo-xilai|2001-02|2004-02|||p01-sina-2001-02-27-bo-xilai
辽宁|gov|张文岳||2004-02|2004-02|1|代省长|p01-cnr-2008-01-16-zhang-wenyue
辽宁|gov|张文岳||2004-02|2007-12|||p01-cnr-2008-01-16-zhang-wenyue
辽宁|gov|陈政高||2007-12|2008-01|1|代省长|b:chen-zhenggao
辽宁|gov|陈政高||2008-01|2014-05||名录作2014年4月卸任|b:chen-zhenggao
辽宁|gov|李希|li-xi|2014-05|2014-10|1|代省长|b:li-xi
辽宁|gov|李希|li-xi|2014-10|2015-05|||b:li-xi
辽宁|gov|陈求发|chen-qiufa|2015-05|2015-06|1|代省长|b:chen-qiufa
辽宁|gov|陈求发|chen-qiufa|2015-06|2017-10|||b:chen-qiufa
辽宁|gov|唐一军|tang-yijun|2017-10|2018-01|1|代省长|L
辽宁|gov|唐一军|tang-yijun|2018-01|2020-05|||f07-wiki-tang-yijun
辽宁|gov|刘宁||2020-07|2020-08|1|代省长|b:liu-ning
辽宁|gov|刘宁||2020-08|2021-10|||b:liu-ning
辽宁|gov|李乐成||2021-10|2022-01|1|代省长|p01-xinhua-2021-10-20-li-lecheng
辽宁|gov|李乐成||2022-01|2025-03||名录与传记作2025年2月调任工信部；任免消息为2025年3月1日辞去省长|b:li-lecheng
辽宁|gov|王新伟||2025-03|2025-03|1|代省长|p01-xinhua-2025-03-01-wang-xinwei
辽宁|gov|王新伟||2025-03||||b:wang-xinwei
吉林|sec|王云坤||1998-09|2006-12|||L
吉林|sec|王珉|wang-min|2006-12|2009-11|||L
吉林|sec|孙政才|sun-zhengcai|2009-11|2012-11|||L
吉林|sec|王儒林||2012-11|2014-08|||L
吉林|sec|巴音朝鲁|bayanchaolu|2014-08|2020-11|||L
吉林|sec|景俊海|jing-junhai|2020-11|2024-06|||p01-xinhua-2020-11-20-jing-junhai
吉林|sec|黄强|huang-qiang|2024-06||||p01-people-2024-06-28-jilin-anhui
吉林|gov|洪虎||1998-09|2004-10|||L
吉林|gov|王珉|wang-min|2004-10|2005-01|1|代省长|b:wang-min
吉林|gov|王珉|wang-min|2005-01|2006-12|||L
吉林|gov|韩长赋||2006-12|2007-01|1|代省长|b:han-changfu
吉林|gov|韩长赋||2007-01|2009-12|||L
吉林|gov|王儒林||2009-12|2010-01|1|代省长|p01-people-2014-09-30-wang-rulin
吉林|gov|王儒林||2010-01|2012-12|||p01-people-2014-09-30-wang-rulin
吉林|gov|巴音朝鲁|bayanchaolu|2012-12|2013-01|1|代省长|f07-wiki-bayanchaolu
吉林|gov|巴音朝鲁|bayanchaolu|2013-01|2014-08|||f07-wiki-bayanchaolu
吉林|gov|蒋超良||2014-09|2014-10|1|代省长|b:jiang-chaoliang
吉林|gov|蒋超良||2014-10|2016-11|||L
吉林|gov|刘国中|liu-guozhong|2016-12|2017-01|1|代省长|c02-wiki-liu-guozhong
吉林|gov|刘国中|liu-guozhong|2017-01|2017-12|||c02-wiki-liu-guozhong
吉林|gov|景俊海|jing-junhai|2018-01|2018-01|1|代省长|f07-wiki-jing-junhai
吉林|gov|景俊海|jing-junhai|2018-01|2020-11|||L
吉林|gov|韩俊||2020-11|2021-01|1|代省长|p01-xinhua-2020-11-25-han-jun
吉林|gov|韩俊||2021-01|2023-04|||b:han-jun
吉林|gov|胡玉亭||2023-04|2023-05|1|代省长|p01-xinhua-2023-04-02-hu-yuting
吉林|gov|胡玉亭||2023-05||||b:hu-yuting
黑龙江|sec|徐有芳||1997-07|2003-03|||L
黑龙江|sec|宋法棠||2003-03|2005-12|||L
黑龙江|sec|钱运录||2005-12|2008-04|||L
黑龙江|sec|吉炳轩|ji-bingxuan|2008-04|2013-03|||L
黑龙江|sec|王宪魁||2013-03|2017-04|||L
黑龙江|sec|张庆伟|zhang-qingwei|2017-04|2021-10|||L
黑龙江|sec|许勤||2021-10||||c03-xinhua-2021-10-19-five-provinces
黑龙江|gov|田凤山||1994-05|2000-01|||L
黑龙江|gov|宋法棠||2000-01|2000-02|1|代省长|p01-chinanews-2003-04-24-song-fatang
黑龙江|gov|宋法棠||2000-02|2003-03||名录作2003年4月卸任|p01-chinanews-2003-04-24-song-fatang
黑龙江|gov|张左己||2003-03|2003-04|1|代省长|b:zhang-zuoji
黑龙江|gov|张左己||2003-04|2007-12|||b:zhang-zuoji
黑龙江|gov|栗战书|li-zhanshu|2007-12|2008-01|1|代省长|b:li-zhanshu
黑龙江|gov|栗战书|li-zhanshu|2008-01|2010-08|||b:li-zhanshu
黑龙江|gov|王宪魁||2010-08|2010-11|1|代省长|b:wang-xiankui
黑龙江|gov|王宪魁||2010-11|2013-03|||L
黑龙江|gov|陆昊|lu-hao|2013-03|2013-06|1|代省长|b:lu-hao
黑龙江|gov|陆昊|lu-hao|2013-06|2018-03|||b:lu-hao
黑龙江|gov|王文涛||2018-03|2018-05|1|代省长|b:wang-wentao
黑龙江|gov|王文涛||2018-05|2020-12|||L
黑龙江|gov|胡昌升||2021-02|2021-02|1|代省长|p01-xinhua-2021-02-02-hu-changsheng
黑龙江|gov|胡昌升||2021-02|2022-12|||b:hu-changsheng
黑龙江|gov|梁惠玲||2022-12|2023-01|1|代省长|p01-people-2022-12-09-liang-huiling
黑龙江|gov|梁惠玲||2023-01||||b:liang-huiling
上海|sec|黄菊|huang-ju|1994-09|2002-10|||L
上海|sec|陈良宇|chen-liangyu|2002-10|2006-09|||L
上海|sec|韩正|han-zheng|2006-09|2007-03|1|代理书记|L
上海|sec|习近平|xi-jinping|2007-03|2007-10|||L
上海|sec|俞正声|yu-zhengsheng|2007-10|2012-11|||L
上海|sec|韩正|han-zheng|2012-11|2017-10|||L
上海|sec|李强|li-qiang|2017-10|2022-10|||L
上海|sec|陈吉宁|chen-jining|2022-10||||p01-xinhua-2022-10-28-chen-jining
上海|gov|徐匡迪||1995-02|2001-12|||L
上海|gov|陈良宇|chen-liangyu|2001-12|2002-02|1|代市长|b:chen-liangyu
上海|gov|陈良宇|chen-liangyu|2002-02|2003-02|||L
上海|gov|韩正|han-zheng|2003-02|2012-12||2006年9月至2007年3月兼代理市委书记|b:han-zheng
上海|gov|杨雄||2012-12|2013-02|1|代市长|b:yang-xiong
上海|gov|杨雄||2013-02|2017-01|||L
上海|gov|应勇|ying-yong|2017-01|2020-03|||b:ying-yong
上海|gov|龚正|gong-zheng|2020-03|2020-07|1|代市长|p01-xinhua-2020-03-23-gong-zheng
上海|gov|龚正|gong-zheng|2020-07|2026-09|||p01-xinhua-2020-07-21-gong-zheng
上海|gov|朱忠明||2026-09|2026-09|1|代市长|p01-xinhua-2026-09-04-zhu-zhongming
上海|gov|朱忠明||2026-09||||p01-xinhua-2026-09-30-zhu-zhongming
江苏|sec|陈焕友||1993-09|2000-01|||L
江苏|sec|回良玉|hui-liangyu|2000-01|2002-12|||L
江苏|sec|李源潮|li-yuanchao|2002-12|2007-10|||L
江苏|sec|梁保华||2007-10|2010-12|||L
江苏|sec|罗志军|luo-zhijun|2010-12|2016-06|||L
江苏|sec|李强|li-qiang|2016-06|2017-10|||L
江苏|sec|娄勤俭|lou-qinjian|2017-10|2021-10|||L
江苏|sec|吴政隆||2021-10|2022-12|||c03-xinhua-2021-10-19-five-provinces
江苏|sec|信长星||2023-01||||p01-xinhua-2023-01-03-xin-changxing
江苏|gov|季允石||1998-09|2002-12||1998年9月起任代省长，后当选省长；转正月份来源未载|b:ji-yunshi
江苏|gov|梁保华||2002-12|2003-02|1|代省长|b:liang-baohua
江苏|gov|梁保华||2003-02|2008-01|||L
江苏|gov|罗志军|luo-zhijun|2008-01|2010-12|||b:luo-zhijun
江苏|gov|李学勇||2010-12|2011-02|1|代省长|b:li-xueyong
江苏|gov|李学勇||2011-02|2015-11|||L
江苏|gov|石泰峰|shi-taifeng|2015-11|2016-01|1|代省长|b:shi-taifeng
江苏|gov|石泰峰|shi-taifeng|2016-01|2017-05|||L
江苏|gov|吴政隆||2017-05|2017-07|1|代省长|b:wu-zhenglong
江苏|gov|吴政隆||2017-07|2021-10|||b:wu-zhenglong
江苏|gov|许昆林|xu-kunlin|2021-10|2022-01|1|代省长|p01-xinhua-2021-10-20-xu-kunlin
江苏|gov|许昆林|xu-kunlin|2022-01|2025-10|||p01-xinhua-2022-01-23-xu-kunlin
江苏|gov|刘小涛||2025-10|2025-10|1|代省长|p01-xinhua-2025-10-09-liu-xiaotao
江苏|gov|刘小涛||2025-10||||p01-xinhua-2025-10-14-liu-xiaotao
浙江|sec|张德江|zhang-dejiang|1998-09|2002-11|||L
浙江|sec|习近平|xi-jinping|2002-11|2007-03|||L
浙江|sec|赵洪祝|zhao-hongzhu|2007-03|2012-11|||L
浙江|sec|夏宝龙|xia-baolong|2012-12|2017-04|||L
浙江|sec|车俊||2017-04|2020-08|||L
浙江|sec|袁家军|yuan-jiajun|2020-08|2022-12||名录表格作2020年9月起，届次栏与传记作2020年8月（31日）|c02-wiki-yuan-jiajun
浙江|sec|易炼红|yi-lianhong|2022-12|2024-10|||p01-xinhua-2022-12-07-three-provinces
浙江|sec|王浩||2024-10||||c03-xinhua-2024-10-28-zhejiang-secretary
浙江|gov|柴松岳||1997-04|2002-10|||L
浙江|gov|习近平|xi-jinping|2002-10|2003-01|1|代省长|b:xi-jinping
浙江|gov|吕祖善||2003-01|2011-08|||b:lv-zushan
浙江|gov|夏宝龙|xia-baolong|2011-08|2012-01|1|代省长|b:xia-baolong
浙江|gov|夏宝龙|xia-baolong|2012-01|2012-12|||L
浙江|gov|李强|li-qiang|2012-12|2013-01|1|代省长|b:li-qiang
浙江|gov|李强|li-qiang|2013-01|2016-06|||L
浙江|gov|车俊||2016-07|2017-01|1|代省长|b:che-jun
浙江|gov|车俊||2017-01|2017-04|||L
浙江|gov|袁家军|yuan-jiajun|2017-04|2018-01|1|代省长|c02-wiki-yuan-jiajun
浙江|gov|袁家军|yuan-jiajun|2018-01|2020-09|||p01-xinhua-2018-01-30-yuan-jiajun
浙江|gov|郑栅洁|zheng-shanjie|2020-09|2020-09|1|代省长|f07-wiki-zheng-shanjie
浙江|gov|郑栅洁|zheng-shanjie|2020-09|2021-09|||f07-wiki-zheng-shanjie
浙江|gov|王浩||2021-09|2022-01|1|代省长|p01-xinhua-2021-09-30-wang-hao
浙江|gov|王浩||2022-01|2024-12|||b:wang-hao
浙江|gov|刘捷||2024-12|2025-01|1|代省长|p01-xinhua-2024-12-18-liu-jie
浙江|gov|刘捷||2025-01||||b:liu-jie
安徽|sec|回良玉|hui-liangyu|1998-08|1999-12|||L
安徽|sec|王太华||2000-01|2004-12|||L
安徽|sec|郭金龙|guo-jinlong|2004-12|2007-12|||L
安徽|sec|王金山||2007-12|2010-06||王金山传记作2007年11月任|L
安徽|sec|张宝顺|zhang-baoshun|2010-06|2015-05||张宝顺传记作2010年5月任|L
安徽|sec|王学军||2015-06|2016-08|||L
安徽|sec|李锦斌|li-jinbin|2016-08|2021-09|||L
安徽|sec|郑栅洁|zheng-shanjie|2021-09|2023-03|||L
安徽|sec|韩俊||2023-03|2024-06|||L
安徽|sec|梁言顺||2024-06|2026-09|||p01-people-2024-06-28-jilin-anhui
安徽|sec|李乐成||2026-09||||p01-xinhua-2026-09-23-three-provinces
安徽|gov|王太华||1998-10|2000-01||1998年10月起任代省长，后当选省长；转正月份来源未载|L
安徽|gov|许仲林||2000-01|2002-10||中新社报道作2000年1月起任省长；传记作2001年|p01-chinanews-2002-10-16-xu-zhonglin
安徽|gov|王金山||2002-10|2003-01|1|代省长|b:wang-jinshan
安徽|gov|王金山||2003-01|2007-12|||L
安徽|gov|王三运|wang-sanyun|2007-12|2008-01|1|代省长|b:wang-sanyun
安徽|gov|王三运|wang-sanyun|2008-01|2011-12|||L
安徽|gov|李斌||2011-12|2012-02|1|代省长|b:li-bin
安徽|gov|李斌||2012-02|2013-03|||L
安徽|gov|王学军||2013-03|2013-06|1|代省长|b:wang-xuejun
安徽|gov|王学军||2013-06|2015-06|||L
安徽|gov|李锦斌|li-jinbin|2015-06|2015-07|1|代省长|p01-xinhua-2015-07-28-li-jinbin
安徽|gov|李锦斌|li-jinbin|2015-07|2016-09|||p01-xinhua-2015-07-28-li-jinbin
安徽|gov|李国英||2016-09|2017-01|1|代省长|b:li-guoying
安徽|gov|李国英||2017-01|2021-02|||L
安徽|gov|王清宪||2021-02|2026-09||由省人代会补选为省长，未经代理期|p01-people-2021-02-02-wang-qingxian
安徽|gov|王东伟||2026-09||1|代省长|p01-xinhua-2026-09-23-wang-dongwei
福建|sec|陈明义||1996-10|2000-12|||L
福建|sec|宋德福||2000-12|2004-02||名录作2004年12月卸任；2004年2月起由卢展工代理书记（卢展工传记）|L
福建|sec|卢展工||2004-02|2004-12|1|代理书记|b:lu-zhangong
福建|sec|卢展工||2004-12|2009-11|||L
福建|sec|孙春兰|sun-chunlan|2009-11|2012-11|||L
福建|sec|尤权|you-quan|2012-11|2017-10||名录届次栏作2012年9月，与孙春兰2012年11月离任不合|L
福建|sec|于伟国||2017-10|2020-11|||L
福建|sec|尹力|yin-li|2020-11|2022-11|||L
福建|sec|周祖翼||2022-11|2026-09|||p01-xinhua-2022-11-13-zhou-zuyi
福建|sec|赵龙||2026-09||||p01-xinhua-2026-09-23-three-provinces
福建|gov|习近平|xi-jinping|1999-08|2000-01|1|代省长|b:xi-jinping
福建|gov|习近平|xi-jinping|2000-01|2002-10||当选月份据传记“次年初”记为2000年1月|b:xi-jinping
福建|gov|卢展工||2002-10|2003-01|1|代省长|b:lu-zhangong
福建|gov|卢展工||2003-01|2004-12|||L
福建|gov|黄小晶||2004-12|2005-01|1|代省长|b:huang-xiaojing
福建|gov|黄小晶||2005-01|2011-04|||b:huang-xiaojing
福建|gov|苏树林||2011-04|2011-07|1|代省长|b:su-shulin
福建|gov|苏树林||2011-07|2015-11|||b:su-shulin
福建|gov|于伟国||2015-11|2016-01|1|代省长|b:yu-weiguo
福建|gov|于伟国||2016-01|2017-12||2017年10月起兼任省委书记|L
福建|gov|唐登杰||2018-01|2018-01|1|代省长|b:tang-dengjie
福建|gov|唐登杰||2018-01|2020-07|||b:tang-dengjie
福建|gov|王宁|wang-ning-yunnan|2020-07|2020-09|1|代省长|p01-xinhua-2020-07-02-wang-ning
福建|gov|王宁|wang-ning-yunnan|2020-09|2021-10|||p01-xinhua-2020-09-15-wang-ning
福建|gov|赵龙||2021-10|2022-01|1|代省长|p01-xinhua-2021-10-22-zhao-long
福建|gov|赵龙||2022-01|||2026年9月起兼任省委书记|b:zhao-long
江西|sec|舒惠国||1997-04|2001-04|||L
江西|sec|孟建柱|meng-jianzhu|2001-04|2007-11|||L
江西|sec|苏荣|su-rong|2007-11|2013-03|||L
江西|sec|强卫|qiang-wei|2013-03|2016-06|||L
江西|sec|鹿心社||2016-06|2018-03|||L
江西|sec|刘奇|liu-qi-jiangxi|2018-03|2021-10|||L
江西|sec|易炼红|yi-lianhong|2021-10|2022-12|||c03-xinhua-2021-10-19-five-provinces
江西|sec|尹弘||2022-12||||p01-xinhua-2022-12-07-three-provinces
江西|gov|舒圣佑||1995-04|2001-04|||L
江西|gov|黄智权||2001-04|2006-10||名录作2001年4月起，传记作2001年5月当选；代省长期来源未单列|b:huang-zhiquan
江西|gov|吴新雄||2006-10|2007-01|1|代省长|b:huang-zhiquan
江西|gov|吴新雄||2007-01|2011-05|||b:wu-xinxiong
江西|gov|鹿心社||2011-05|2012-02|1|代省长|b:lu-xinshe
江西|gov|鹿心社||2012-02|2016-07|||L
江西|gov|刘奇|liu-qi-jiangxi|2016-07|2016-09|1|代省长|f07-wiki-liu-qi-jiangxi
江西|gov|刘奇|liu-qi-jiangxi|2016-09|2018-08|||f07-wiki-liu-qi-jiangxi
江西|gov|易炼红|yi-lianhong|2018-08|2018-10|1|代省长|b:yi-lianhong
江西|gov|易炼红|yi-lianhong|2018-10|2021-10|||b:yi-lianhong
江西|gov|叶建春|ye-jianchun|2021-10|2022-01|1|代省长|p01-xinhua-2021-10-21-ye-jianchun
江西|gov|叶建春|ye-jianchun|2022-01|2026-09||名录作2026年8月卸任；2026年9月23日省人大常委会接受其辞职，此后未任命代省长，省长空缺|p01-people-2026-09-24-ye-jianchun
山东|sec|吴官正|wu-guanzheng|1997-04|2002-11|||L
山东|sec|张高丽|zhang-gaoli|2002-11|2007-03|||L
山东|sec|李建国|li-jianguo|2007-03|2008-03|||L
山东|sec|姜异康||2008-03|2017-03||名录表格作2017年4月卸任，届次栏作2017年3月|L
山东|sec|刘家义||2017-03|2021-09|||L
山东|sec|李干杰|li-ganjie|2021-09|2022-12|||p01-xinhua-2021-09-30-li-ganjie
山东|sec|林武|lin-wu|2022-12||||p01-xinhua-2022-12-29-lin-wu
山东|gov|李春亭||1995-02|2001-12|||L
山东|gov|张高丽|zhang-gaoli|2001-12|2002-03|1|代省长；传记作2001年11月|p01-sdchorography-1998-2002-government
山东|gov|张高丽|zhang-gaoli|2002-03|2003-01|||p01-sdchorography-1998-2002-government
山东|gov|韩寓群||2003-01|2003-04|1|代省长|p01-sdchorography-1998-2002-government
山东|gov|韩寓群||2003-04|2007-06|||b:han-yuqun
山东|gov|姜大明||2007-06|2008-01|1|代省长|b:jiang-daming
山东|gov|姜大明||2008-01|2013-03|||b:jiang-daming
山东|gov|郭树清||2013-03|2013-06|1|代省长|b:guo-shuqing
山东|gov|郭树清||2013-06|2017-02|||L
山东|gov|龚正|gong-zheng|2017-04|2017-04|1|代省长|f07-wiki-gong-zheng
山东|gov|龚正|gong-zheng|2017-04|2020-03|||f07-wiki-gong-zheng
山东|gov|李干杰|li-ganjie|2020-04|2020-07|1|代省长|p01-xinhua-2020-04-17-li-ganjie
山东|gov|李干杰|li-ganjie|2020-07|2021-09|||b:li-ganjie
山东|gov|周乃翔||2021-09|2021-10|1|代省长|p01-xinhua-2021-09-30-zhou-naixiang
山东|gov|周乃翔||2021-10||||b:zhou-naixiang
`

// id | publisher | date | url | name the text must mention | voice (default official)
const OFFICIAL = `
p01-xinhua-2022-11-13-yin-li|新华网|2022-11-13|http://www.news.cn/politics/2022-11/13/c_1129125324.htm|尹力
p01-xinhua-2022-10-28-yin-yong|新华网|2022-10-28|http://www.news.cn/politics/2022-10/28/c_1129085391.htm|殷勇
p01-xinhua-2020-09-03-liao-guoxun|新华网|2020-09-03|https://www.xinhuanet.com/politics/2020-09/03/c_1126449135.htm|廖国勋
p01-xinhua-2022-05-31-zhang-gong|新华网|2022-05-31|http://www.news.cn/politics/2022-05/31/c_1128699821.htm|张工
p01-xinhua-2022-04-22-ni-yuefeng|新华网|2022-04-22|http://www.news.cn/politics/2022-04/22/c_1128585904.htm|倪岳峰
p01-xinhua-2026-07-31-luo-wen|新华网|2026-07-31|https://www.news.cn/politics/20260731/2ada66d5e87f45fe8d3c850fd74bdbef/c.html|罗文
p01-chinanews-2009-01-12-hu-chunhua|中国新闻网|2009-01-12|http://www.chinanews.com.cn/gn/news/2009/01-12/1524725.shtml|胡春华
p01-people-2013-01-29-guo-gengmao|人民网|2013-01-29|http://politics.people.com.cn/n/2013/0129/c351134-20365665.html|郭庚茂
p01-xinhua-2021-10-21-wang-zhengpu|新华网|2021-10-21|http://www.news.cn/politics/2021-10/21/c_1127980451.htm|王正谱
p01-xinhua-2022-12-29-lan-foan|新华网|2022-12-29|http://www.news.cn/politics/2022-12/29/c_1129240579.htm|蓝佛安
p01-xinhua-2023-10-28-tang-dengjie|新华网山西频道|2023-10-28|http://www.sx.xinhuanet.com/20231028/93bed0fa5603412f83905f66038ee0ba/c.html|唐登杰
p01-xinhua-2022-12-30-jin-xiangjun|新华网|2022-12-30|https://www.news.cn/local/2022-12/31/c_1129246277.htm|金湘军
p01-xinhua-2025-06-03-lu-dongliang|新华网|2025-06-03|https://www.news.cn/politics/20250603/0151cfc1639b461c93822bb0de94cf7c/c.html|卢东亮
p01-xinhua-2025-06-16-lu-dongliang|新华网|2025-06-16|https://www.news.cn/politics/20250616/af38bade552c47948f9e68742b81acfd/c.html|卢东亮
p01-xinhua-2022-04-30-sun-shaocheng|新华网|2022-04-30|http://www.news.cn/politics/2022-04/30/c_1128611881.htm|孙绍骋
p01-xinhua-2025-09-30-wang-weizhong|新华网|2025-09-30|http://www.news.cn/20250930/4352b65f7f274c6ebcc5d16322867d1f/c.html|王伟中
p01-xinhua-2008-04-03-bater|新华网（搜狐转载）|2008-04-03|https://news.sohu.com/20080403/n256092544.shtml|巴特尔
p01-people-2021-08-05-wang-lixia|人民网内蒙古频道|2021-08-05|http://nm.people.com.cn/n2/2021/0805/c356216-34853837.html|王莉霞
p01-xinhua-2021-09-09-wang-lixia|新华网|2021-09-09|http://www.news.cn/politics/2021-09/09/c_1127845260.htm|王莉霞
p01-xinhua-2025-10-13-bao-gang|新华网|2025-10-13|https://www.news.cn/politics/20251013/35f0483703494b868fea7957eaaf895b/c.html|包钢
p01-xinhua-2025-10-18-bao-gang|新华网|2025-10-18|https://www.news.cn/politics/20251018/24550d15c3644d3eae8c4ba414d02d47/c.html|包钢
p01-sina-2001-02-27-bo-xilai|辽宁日报（新浪转载）|2001-02-27|https://news.sina.com.cn/c/195395.html|薄熙来
p01-cnr-2008-01-16-zhang-wenyue|央广网|2008-01-16|http://gs.cnr.cn/zhuanti/lh/rsrm/20080116/t20080116_504680298.html|张文岳
p01-xinhua-2022-11-28-hao-peng|新华网|2022-11-28|https://www.news.cn/2022-11/28/c_1129166261.htm|郝鹏
p01-xinhua-2025-09-30-xu-kunlin|新华网|2025-09-30|http://www.news.cn/politics/20250930/16121025781c41aeaa682546eeba151e/c.html|许昆林
p01-xinhua-2021-10-20-li-lecheng|新华网|2021-10-20|http://www.news.cn/2021-10/20/c_1127976893.htm|李乐成
p01-xinhua-2025-03-01-wang-xinwei|新华网|2025-03-01|http://www.news.cn/20250301/3340bd13b403464bbe7af45e55bd2b07/c.html|王新伟
p01-xinhua-2020-11-20-jing-junhai|新华网|2020-11-20|http://www.xinhuanet.com/politics/2020-11/20/c_1126765882.htm|景俊海
p01-people-2024-06-28-jilin-anhui|人民网|2024-06-28|http://politics.people.com.cn/n1/2024/0628/c1001-40266456.html|黄强
p01-people-2014-09-30-wang-rulin|人民网|2014-09-30|http://renshi.people.com.cn/n/2014/0930/c139617-25763973.html|王儒林
p01-xinhua-2020-11-25-han-jun|新华网|2020-11-25|https://www.xinhuanet.com/politics/2020-11/25/c_1126783690.htm|韩俊
p01-xinhua-2023-04-02-hu-yuting|新华网|2023-04-02|http://www.news.cn/politics/2023-04/02/c_1129488395.htm|胡玉亭
p01-chinanews-2003-04-24-song-fatang|中国新闻网|2003-04-24|https://www.chinanews.com.cn/n/2003-04-24/26/297249.html|宋法棠
p01-xinhua-2021-02-02-hu-changsheng|新华网|2021-02-02|http://www.xinhuanet.com/politics/2021-02/02/c_1127054230.htm|胡昌升
p01-people-2022-12-09-liang-huiling|人民网黑龙江频道|2022-12-09|http://hlj.people.com.cn/n2/2022/1209/c220027-40226254.html|梁惠玲
p01-xinhua-2022-10-28-chen-jining|新华网|2022-10-28|http://www.news.cn/2022-10/28/c_1129084681.htm|陈吉宁
p01-xinhua-2020-03-23-gong-zheng|新华网|2020-03-23|https://www.xinhuanet.com/politics/2020-03/23/c_1125754501.htm|龚正
p01-xinhua-2020-07-21-gong-zheng|新华网|2020-07-21|https://www.xinhuanet.com/politics/2020-07/21/c_1126265544.htm|龚正
p01-xinhua-2026-09-04-zhu-zhongming|新华网|2026-09-04|https://www.news.cn/politics/20260904/16f337f3feaa4cd3ba20374b63573c31/c.html|朱忠明
p01-xinhua-2026-09-30-zhu-zhongming|新华网|2026-09-30|https://www.news.cn/20260930/c83314ed42ec4a8790c302fd675ebe86/c.html|朱忠明
p01-xinhua-2023-01-03-xin-changxing|新华网|2023-01-03|http://www.news.cn/politics/2023-01/03/c_1129253181.htm|信长星
p01-xinhua-2021-10-20-xu-kunlin|新华网|2021-10-20|http://www.news.cn/politics/2021-10/20/c_1127974793.htm|许昆林
p01-xinhua-2022-01-23-xu-kunlin|新华网|2022-01-23|http://www.news.cn/politics/2022-01/23/c_1128292549.htm|许昆林
p01-xinhua-2025-10-09-liu-xiaotao|新华网|2025-10-09|https://www.news.cn/politics/20251009/5931f5193bbf4a1589b184c13739e26a/c.html|刘小涛
p01-xinhua-2025-10-14-liu-xiaotao|新华网|2025-10-14|https://www.news.cn/politics/20251014/8b46b5fa13464cfb998018d2bca81312/c.html|刘小涛
p01-xinhua-2022-12-07-three-provinces|新华网|2022-12-07|http://www.news.cn/politics/2022-12/07/c_1129189426.htm|易炼红
p01-xinhua-2018-01-30-yuan-jiajun|新华网|2018-01-30|http://www.xinhuanet.com/politics/2018-01/30/c_1122341919.htm|袁家军
p01-xinhua-2021-09-30-wang-hao|新华网|2021-09-30|http://www.news.cn/politics/2021-09/30/c_1127922344.htm|王浩
p01-xinhua-2024-12-18-liu-jie|新华网|2024-12-18|https://www.news.cn/politics/20241218/eb9a4760fd16491a8e8651209472c1db/c.html|刘捷
p01-chinanews-2002-10-16-xu-zhonglin|中国新闻网|2002-10-16|https://www.chinanews.com.cn/2002-10-16/26/232644.html|许仲林
p01-xinhua-2015-07-28-li-jinbin|新华网|2015-07-28|http://www.xinhuanet.com/politics/2015-07/28/c_1116069156.htm|李锦斌
p01-xinhua-2026-09-23-three-provinces|新华网|2026-09-23|https://www.news.cn/20260923/5cdae31939214e0d91b4e0fe15f49aca/c.html|李乐成
p01-people-2021-02-02-wang-qingxian|人民网|2021-02-02|http://renshi.people.com.cn/n1/2021/0202/c139617-32019888.html|王清宪
p01-xinhua-2026-09-23-wang-dongwei|新华网|2026-09-23|https://www.news.cn/20260923/2b8b353130cb459d9f5f6c7128101d86/c.html|王东伟
p01-xinhua-2022-11-13-zhou-zuyi|新华网|2022-11-13|http://www.news.cn/2022-11/13/c_1129124602.htm|周祖翼
p01-xinhua-2020-07-02-wang-ning|新华网|2020-07-02|https://www.xinhuanet.com/politics/2020-07/02/c_1126189233.htm|王宁
p01-xinhua-2020-09-15-wang-ning|新华网|2020-09-15|http://www.xinhuanet.com/politics/2020-09/15/c_1126495840.htm|王宁
p01-xinhua-2021-10-22-zhao-long|新华网|2021-10-22|http://www.news.cn/politics/2021-10/22/c_1127984649.htm|赵龙
p01-xinhua-2021-10-21-ye-jianchun|新华网江西频道|2021-10-21|http://jx.news.cn/2021-10/22/c_1127983171.htm|叶建春
p01-people-2026-09-24-ye-jianchun|人民网江西频道|2026-09-24|http://jx.people.com.cn/n2/2026/0924/c186330-41706478.html|叶建春
p01-sdchorography-1998-2002-government|山东地情档案（二轮山东省志·政权志）||https://shandong-chorography.org/database/g0/section/15/article/102/|张高丽|history
p01-xinhua-2021-09-30-li-ganjie|新华网|2021-09-30|http://www.news.cn/politics/2021-09/30/c_1127920007.htm|李干杰
p01-xinhua-2022-12-29-lin-wu|新华网|2022-12-29|http://www.news.cn/politics/2022-12/29/c_1129240585.htm|林武
p01-xinhua-2020-04-17-li-ganjie|新华网|2020-04-17|http://www.xinhuanet.com/politics/2020-04/17/c_1125870421.htm|李干杰
p01-xinhua-2021-09-30-zhou-naixiang|新华网|2021-09-30|https://www.news.cn/politics/2021-09/30/c_1127922297.htm|周乃翔
`

const BIO_KEEP: Record<string, string[]> = {
  'dai-xianglong': ['2002年12月至2007年12月28日', '两个月后的12月28日'],
  'huang-xingguo': ['2003年11月，任中共天津市委副书记', '2014年12月，时任中共天津市委书记孙', '湖北省委书记李鸿忠调任天津市委书记'],
  'liao-guoxun': ['廖国勋（1963年2月9日', '2020年8月31日，廖国勋离开上海'],
  'zhang-gong': ['2022年5月28日，张工调任'],
  'niu-maosheng': ['1998年10月至1999年1月'],
  'ji-yunshi': ['1998年9月，出任江苏省人民政府代理省长', '出任河北省代理省长'],
  'hu-chunhua': ['2008年3月，中共中央宣布任命胡春华', '2009年11月，中共中央调胡春华接替储波'],
  'chen-quanguo': ['2009年11月，任中共河北省委副书记'],
  'zhang-qingwei': ['2011年8月，任中共河北省委副书记', '2012年1月10日，在河北省第十一届'],
  'xu-qin': ['2017年4月1日，56岁的许勤', '2021年10月19日，许勤调往黑龙江'],
  'wang-zhengpu': ['转任中共河北省委副书记', '2022年1月20日，在河北省第十三届'],
  'liu-zhenhua': ['1999年6月至2000年1月'],
  'zhang-baoshun': ['2001年9月，出任中共山西省委副书记', '2010年5月，转任中共安徽省委书记'],
  'yu-youjun': ['2005年7月，于幼军再次奉调北上'],
  'meng-xuenong': ['9月3日，获提名出任山西省副省长', '2008年1月22日，山西省十一届'],
  'wang-jun': ['2006年10月，任中华全国供销合作总社'],
  'li-xiaopeng': ['2012年12月，晋升中共山西省委副书记', '2016年8月30日，辞去山西省省长职务'],
  'lan-foan': ['2021年4月7日，任中共山西省委副书记'],
  'jin-xiangjun': ['2022年12月，调任中共山西省委副书记', '2023年1月，正式当选为山西省人民政府', '4月23日，金湘军辞去山西省人民政府省长职务'],
  'tian-chengping': ['1999年6月，任中共山西省委书记'],
  'yuan-chunqing': ['2010年5月31日，中共中央宣布', '2014年9月，袁纯清被免去山西省委书记'],
  wuyunqimuge: ['2000年6月12日，时任自治区主席的云'],
  bater: ['2009年1月当选为内蒙古自治区主席', '2016年3月30日，在内蒙古自治区十二'],
  'bu-xiaolin': ['历任内蒙古自治区人民政府法制局副处长', '同年8月，因身体原因刚满63岁的布小林'],
  'chen-zhenggao': ['2007年12月，55岁的陈政高', '5月5日辞去辽宁省人民政府省长职务'],
  'li-xi': ['2014年4月，调任中共辽宁省委副书记'],
  'chen-qiufa': ['2015年5月，任中共辽宁省委副书记', '2017年10月，任中共辽宁省委书记', '2020年10月，不再担任中共辽宁省委书'],
  'liu-ning': ['2020年6月，任中共辽宁省委副书记'],
  'li-lecheng': ['2021年10月，任中共辽宁省委副书记', '2022年1月，当选为辽宁省人民政府省长', '2025年2月，调任工业和信息化部党组书'],
  'wang-xinwei': ['2025年3月1日，任辽宁省人民政府党组'],
  'wang-min': ['数月后，又接任吉林省代省长', '2009年11月30日，中共中央决定，任'],
  'han-changfu': ['为补充其地方管理经验，2006年12月'],
  'jiang-chaoliang': ['2014年8月底，任中共吉林省委副书记'],
  'han-jun': ['2020年11月，任中共吉林省委副书记', '2023年3月14日，接替已调任国家发改'],
  'hu-yuting': ['2023年4月1日，调任中共吉林省委委员'],
  'zhang-zuoji': ['2003年3月，部长任期结束后', '2007年12月25日，在黑龙江省第十届'],
  'li-zhanshu': ['2003年12月，栗战书转任中共黑龙江省'],
  'wang-xiankui': ['2010年8月，任中共黑龙江省委副书记'],
  'lu-hao': ['2013年3月20日，陆昊离开北京', '在黑龙江工作五年之后，2018年3月19'],
  'wang-wentao': ['2018年2月24日，当选为第十三届全国'],
  'hu-changsheng': ['2021年1月，任中共黑龙江省委副书记'],
  'liang-huiling': ['2022年12月，任中共黑龙江省委副书记', '2023年1月16日，黑龙江省第十四届'],
  'chen-liangyu': ['2001年12月陈良宇被中央任命为上海市'],
  'han-zheng': ['2003年2月，在上海市第十二届人民代表', '2012年11月15日，58岁的韩正'],
  'yang-xiong': ['自2012年12月26日起代理上海市市长'],
  'ying-yong': ['2017年1月20日，正式当选上海市人民', '2020年3月23日，上海市人大常委会接'],
  'liang-baohua': ['1994年12月，梁保华当选中共江苏省委'],
  'luo-zhijun': ['2003年4月，任中共江苏省委常委、南京', '2010年12月6日，接替已退休的梁保华'],
  'li-xueyong': ['2010年12月7日，任中共江苏省委副书'],
  'shi-taifeng': ['2015年11月，任江苏省人民政府副省长'],
  'wu-zhenglong': ['2017年5月31日，被任命为为江苏省副'],
  'xi-jinping': ['1999年8月，习近平出任福建省人民政府', '2002年10月，习近平转任中共浙江省委'],
  'lv-zushan': ['1993年2月至1998年11月，任中共'],
  'xia-baolong': ['2011年8月升任浙江省代省长'],
  'li-qiang': ['2012年12月，在中共十八大闭幕一个月'],
  'che-jun': ['2016年6月，任中共浙江省委副书记'],
  'wang-hao': ['2021年9月，任中共浙江省委副书记、浙', '2022年1月，正式当选为浙江省人民政府', '2024年12月，辞去浙江省人民政府省长'],
  'liu-jie': ['2024年12月，任浙江省人民政府党组书', '2025年1月，正式当选浙江省人民政府省'],
  'wang-jinshan': ['2002年10月，王金山出任安徽省人民政'],
  'wang-sanyun': ['2007年11月，任中共安徽省委副书记'],
  'li-bin': ['2011年12月11日，57岁的李斌'],
  'wang-xuejun': ['2013年3月27日，任中共安徽省委副书'],
  'li-guoying': ['2015年8月，任中共安徽省委专职副书记'],
  'lu-zhangong': ['2001年1月，卢展工被调往福建省'],
  'huang-xiaojing': ['1995年4月，黄小晶出任福建省人民政府', '2011年4月，黄小晶辞去福建省省长职务'],
  'su-shulin': ['2011年4月2日，中共中央决定，由苏树', '2015年11月3日，福建省人大常委会接受苏树林'],
  'yu-weiguo': ['2015年11月26日，任福建省人民政府'],
  'tang-dengjie': ['2017年12月，转任中共福建省委副书记', '2020年7月2日，不再担任福建省人民政'],
  'zhao-long': ['同年10月，赵龙再获晋升'],
  'huang-zhiquan': ['2001年5月在江西省人大九届五次会议上', '2006年10月，辞去江西省省长职务'],
  'wu-xinxiong': ['2007年1月，在江西省第十届人大第五次', '2011年5月底，中共中央宣布，吴新雄'],
  'lu-xinshe': ['2011年5月，任中共江西省委副书记'],
  'yi-lianhong': ['2018年8月，调任中共江西省委副书记', '2021年10月，任中共江西省委书记'],
  'han-yuqun': ['按照副省级干部任职年龄的规定', '2007年6月13日，年届64岁的韩寓群'],
  'jiang-daming': ['1998年7月，姜大明调往山东省工作', '2013年3月29日，山东省人大常委会同意'],
  'guo-shuqing': ['2013年3月19日，任中共山东省委副书'],
  'li-ganjie': ['2020年4月，任中共山东省委副书记、代', '2021年9月，李干杰任山东省委书记'],
  'zhou-naixiang': ['2021年9月30日，任中共山东省委副书'],
}

const LIST_TITLE: Record<string, [string, string]> = {}
const out: string[] = []
const say = (s: string) => out.push(s)
const paras = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
const peekPath = (id: string) => `.probe/peek-${id}.txt`
const q = (s: string) => JSON.stringify(s)

// --- chiefs
type Chief = { prov: string; post: string; name: string; person?: string; from: string; to?: string; acting?: boolean; note?: string; cite: string }
const chiefs: Chief[] = CHIEFS.trim().split('\n').map((line) => {
  const parts = line.split('|')
  if (parts.length !== 9 || !SLUG[parts[0]]) throw new Error(`bad line ${line}`)
  const [prov, post, name, person, from, to, acting, note, c] = parts
  const cite = c === 'L' ? `p01-wiki-${SLUG[prov]}-${post}` : c.startsWith('b:') ? `p01-wiki-${c.slice(2)}` : c
  return { prov, post, name, person: person || undefined, from, to: to || undefined, acting: acting === '1' || undefined, note: note || undefined, cite }
})

// --- people check
const inflight = new Set<string>(parse(readFileSync('research/round.yaml', 'utf8')).inflight ?? [])
const people = new Map<string, { name: string; batch: string }>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const p of parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) people.set(p.id, { name: p.name, batch: f.replace('.yaml', '') })
  } catch {}
}
const byName = new Map<string, string>()
for (const [id, p] of people) if (!inflight.has(p.batch)) byName.set(p.name, id)
for (const c of chiefs) {
  if (c.person) {
    const p = people.get(c.person)
    if (!p) say(`PERSON MISSING ${c.person} ${c.name}`)
    else if (p.name !== c.name) say(`PERSON NAME ${c.person}: ${p.name} != ${c.name}`)
    else if (inflight.has(p.batch)) say(`PERSON INFLIGHT ${c.person} (${p.batch})`)
  } else if (byName.has(c.name)) say(`HAS ENTRY BUT NO person: ${c.name} -> ${byName.get(c.name)}`)
}

// --- urls registered by other batches
const otherUrls = new Map<string, string>()
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml') && f !== 'P01.yaml')) {
  try {
    const m = parse(readFileSync(`research/manifests/${f}`, 'utf8'))
    for (const e of [...(m?.web ?? []), ...(m?.docs ?? [])]) if (e?.url) otherUrls.set(e.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), e.id)
  } catch {}
}
const norm = (u: string) => decodeURI(u).replace(/^https?:\/\//, '').replace(/\/$/, '')

// --- list keeps
const listKeeps = (id: string, names: string[]): string[] => {
  if (!existsSync(peekPath(id))) {
    say(`NO PEEK ${id}`)
    return []
  }
  const ps = paras(readFileSync(peekPath(id), 'utf8'))
  const keeps: string[] = []
  const nameRe = (n: string) => new RegExp(n.split('').join('\\s?'))
  const hasName = (p: string) => names.some((n) => nameRe(n).test(p))
  for (const p of ps) {
    if (/^(副书记|常务委员|秘书长|本页面|此条目|\^|分类|取自|参见)/.test(p)) continue
    const years = [...p.matchAll(/(1[89]\d\d|20\d\d)年/g)].map((m) => +m[1])
    const dotYears = [...p.matchAll(/\b(199\d|20[0-2]\d)\.\d{1,2}/g)].map((m) => +m[1])
    const ys = [...years, ...dotYears]
    let take = false
    if (/^书\s?记：/.test(p) && hasName(p) && ys.some((y) => y >= 1999)) take = true
    else if (p.includes('→') && names.filter((n) => nameRe(n).test(p)).length >= 3) take = true
    else if (p.length <= 70 && ys.length && Math.min(...ys) >= 1993 && Math.max(...ys) >= 1997 && !/^第/.test(p)) take = true
    else if (p.length <= 30 && names.some((n) => new RegExp(`^${n.split('').join('\\s?')}([，：（\\s]|$)`).test(p))) take = true
    else if (/^现任/.test(p) && hasName(p)) take = true
    else if (id.endsWith('jiangxi-gov') && p.includes('江西：空缺')) take = true
    if (!take) continue
    const k = p.length <= 40 ? p : p.slice(0, 30)
    if (!keeps.includes(k)) keeps.push(k)
  }
  return keeps
}

// --- official start/end
const FOOTER = /^(责任编辑|【责任编辑|责编|（责编|\(责编|编辑[:：]|【纠错】|纠错|分享到|扫一扫|版权所有|相关新闻|相关阅读|关闭窗口|打印本页|网站声明|Copyright|关于我们|\[责任编辑|（编辑|【编辑|来源：新华社$|（完）$)/
// paragraphs (by prefix) where the automatic start / end pick is wrong
const MANUAL: Record<string, { s?: string; e?: string }> = {
  'p01-people-2013-01-29-guo-gengmao': { s: '1950年12月生，河北冀州人', e: '十六届中央候补委员，十七届' },
  'p01-sina-2001-02-27-bo-xilai': { e: '薄熙来：对这些深层次的问题' },
  'p01-sdchorography-1998-2002-government': { s: '1998年4月15日，山东省第九届', e: '受张高丽辞去山东省省长职务的请求' },
}
const official = (id: string, name: string) => {
  if (!existsSync(peekPath(id))) return { title: '', start: '', end: '' }
  const all = readFileSync(peekPath(id), 'utf8')
  const ps = paras(all)
  const title = (ps[0] ?? '').replace(/\s*[-_|—].{0,20}$/, '').trim()
  const man = MANUAL[id] ?? {}
  let s = man.s ? ps.findIndex((p) => p.startsWith(man.s!)) : ps.findIndex((p, i) => i > 0 && /(电|讯|消息)/.test(p.slice(0, 40)) && /\d+月\d+日/.test(p.slice(0, 40)) && p.includes(name))
  if (s < 0) s = ps.findIndex((p, i) => i > 0 && p.includes(name) && p.length > 25)
  if (s < 0) return { title, start: '', end: '' }
  let e = s
  if (man.e) e = ps.findIndex((p, i) => i >= s && p.startsWith(man.e!))
  else
    for (let i = s + 1; i < ps.length; i++) {
      if (FOOTER.test(ps[i]) || ps[i].includes('【纠错】')) break
      if (ps[i].replace(/&emsp;|\s/g, '').length > 6) e = i
      if (i - s > 40) break
    }
  const lead = ps[s].match(/^(&emsp;)*/)![0].length
  const i0 = all.indexOf(ps[s]) + lead
  let start = ps[s].slice(lead, lead + 16)
  for (let n = 16; all.indexOf(start) !== i0 && n < ps[s].length; n += 6) start = ps[s].slice(lead, lead + n)
  let end = ps[e].slice(-14)
  const pe = all.indexOf(ps[e], i0 - lead) + ps[e].length
  for (let n = 14; all.indexOf(end, i0) + end.length !== pe && n < ps[e].length; n += 6) end = ps[e].slice(-n)
  return { title, start, end, preview: ps.slice(s, e + 1).map((p) => p.slice(0, 50)).join(' ¶ ') }
}

// --- manifest
const used = new Set(chiefs.map((c) => c.cite))
const lines: string[] = ['# P01: provincial chiefs (诸侯表) of 华北、东北、华东, 2000 – today', 'web:', '  # --- Wikipedia list pages ---']
const listIds: string[] = []
const oldManifest = readFileSync('research/manifests/P01.yaml', 'utf8')
for (const m of oldManifest.matchAll(/- \{ id: (p01-wiki-[a-z]+-(?:sec|gov)), title: ([^,]+), publisher: 维基百科, voice: wiki, url: (\S+), excerpt/g)) LIST_TITLE[m[1]] = [m[2], m[3]]
for (const [prov, slug] of Object.entries(SLUG))
  for (const post of ['sec', 'gov']) {
    const id = `p01-wiki-${slug}-${post}`
    const [title, url] = LIST_TITLE[id]
    const names = [...new Set(chiefs.filter((c) => c.prov === prov && c.post === post).map((c) => c.name))]
    const keeps = listKeeps(id, names)
    say(`${id}: ${keeps.length} keeps`)
    lines.push(`  - { id: ${id}, title: ${title}, publisher: 维基百科, voice: wiki, url: ${url}, excerpt: true, keep: [ ${keeps.map(q).join(', ')} ] }`)
    listIds.push(id)
  }
lines.push('  # --- Wikipedia biographies (acting periods, exact months) ---')
const bioIds: string[] = []
for (const [sfx, name, wtitle] of BIOS) {
  const id = `p01-wiki-${sfx}`
  if (!used.has(id)) continue
  const keep = BIO_KEEP[sfx]
  if (!keep) say(`NO KEEP ${id}`)
  if (existsSync(peekPath(id))) {
    const t = readFileSync(peekPath(id), 'utf8')
    for (const k of keep ?? []) if (!t.includes(k)) say(`BIO KEEP MISSING ${id}: ${k}`)
  } else say(`NO PEEK ${id}`)
  const url = `https://zh.wikipedia.org/zh-hans/${wtitle.replace(/ /g, '_')}`
  lines.push(`  - { id: ${id}, title: ${name}（维基百科）, publisher: 维基百科, voice: wiki, url: ${url}, excerpt: true, keep: [ ${(keep ?? []).map(q).join(', ')} ] }`)
  bioIds.push(id)
}
lines.push('  # --- appointment notices ---')
const offIds: string[] = []
for (const l of OFFICIAL.trim().split('\n')) {
  const [id, publisher, date, url, name, voice] = l.split('|')
  if (!used.has(id)) say(`UNUSED ${id}`)
  if (otherUrls.has(norm(url))) say(`URL TAKEN ${id} by ${otherUrls.get(norm(url))}`)
  const o = official(id, name)
  if (!o.start) say(`NO START ${id}`)
  else say(`OFF ${id} | ${o.title} | start=${o.start} | end=${o.end}\n    ${o.preview}`)
  lines.push(`  - id: ${id}`, `    title: ${q(o.title || `${name}任免（${publisher}）`)}`, `    publisher: ${publisher}`)
  if (date) lines.push(`    date: ${date}`)
  lines.push(`    voice: ${voice || 'official'}`, `    url: ${url}`)
  if (o.start) lines.push(`    start: ${q(o.start)}`, `    end: ${q(o.end)}`)
  offIds.push(id)
}
for (const c of used) if (!c.startsWith('p01-') ? false : ![...listIds, ...bioIds, ...offIds].includes(c)) say(`CITE NOT REGISTERED ${c}`)
writeFileSync('research/manifests/P01.yaml', lines.join('\n') + '\n')

// --- chiefs yaml
const cy = chiefs.map((c) => {
  const f = [`prov: ${c.prov}`, `post: ${c.post}`, `name: ${c.name}`]
  if (c.person) f.push(`person: ${c.person}`)
  f.push(`from: ${q(c.from)}`)
  if (c.to) f.push(`to: ${q(c.to)}`)
  if (c.acting) f.push('acting: true')
  if (c.note) f.push(`note: ${q(c.note)}`)
  f.push(`cite: ${c.cite}`)
  return `- { ${f.join(', ')} }`
})
mkdirSync('content/chiefs', { recursive: true })
writeFileSync('content/chiefs/P01.yaml', `# P01 诸侯表：华北、东北、华东 15 个省级单位的党委书记与行政首长，2000 年 1 月至今\n${cy.join('\n')}\n`)

// --- counts
for (const prov of Object.keys(SLUG)) say(`COUNT ${prov} sec=${chiefs.filter((c) => c.prov === prov && c.post === 'sec').length} gov=${chiefs.filter((c) => c.prov === prov && c.post === 'gov').length}`)
say(`TOTAL ${chiefs.length}`)
say(`IDS ${[...listIds, ...bioIds, ...offIds].join(' ')}`)
say(`OFFIDS ${offIds.join(' ')}`)
writeFileSync('.probe/P01-gen.txt', out.join('\n') + '\n')
