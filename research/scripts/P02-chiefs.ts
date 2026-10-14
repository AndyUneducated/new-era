// P02 one-off: write content/chiefs/P02.yaml from the table below, link people by exact name, and set the
// manifest keeps (list pages and cited bios); uncited P02 bios are dropped. Report in .probe/p02-chiefs.txt.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

// line: `[a ]name from to cite[ | note]`; to `-` = in office; cite L = list page, B:x = p02-wiki-x,
// N:x = the P02 news id ending in x, anything else = an existing id
const table = `
河南 sec
马忠臣 1998-02 2000-10 L
陈奎元 2000-10 2002-12 L
李克强 2002-12 2004-12 L
徐光春 2004-12 2009-11 L
卢展工 2009-11 2013-03 L
郭庚茂 2013-03 2016-03 L
谢伏瞻 2016-03 2018-03 L
王国生 2018-03 2021-05 L
楼阳生 2021-05 2024-12 L | 名录作 2021 年 5 月；维基传记作 2021 年 6 月 1 日
刘宁 2024-12 2026-09 N:henan-guangxi-sec
周祖翼 2026-09 - N:anhui-3-sec
河南 gov
李克强 1998-07 2003-01 L
李成玉 2003-01 2008-04 B:li-chengyu | 卸任月份据传记；名录作 2008 年 3 月
a 郭庚茂 2008-04 2009-01 B:guo-gengmao
郭庚茂 2009-01 2013-03 B:guo-gengmao
谢伏瞻 2013-04 2016-04 B:xie-fuzhan
陈润儿 2016-04 2019-12 B:chen-runer
a 尹弘 2019-12 2020-01 B:yin-hong
尹弘 2020-01 2021-04 B:yin-hong
a 王凯 2021-04-02 2021-06 N:wang-kai-acting
王凯 2021-06 2026-09 B:wang-kai
a 王陆进 2026-09-24 - N:wang-lujin-acting | 代省长；据省人大常委会决定（9 月 24 日），维基传记作 9 月 23 日
湖北 sec
贾志杰 1994-11 2000-12 L | 名录（省长列表页的书记栏）作 2001 年 1 月卸任
蒋祝平 2000-12 2001-12 L
俞正声 2001-12 2007-10 L
罗清泉 2007-10 2010-12 L
李鸿忠 2010-12 2016-09 L
蒋超良 2016-10 2020-02 L
应勇 2020-02 2022-03 L
王蒙徽 2022-03 2024-12 L
王忠林 2024-12 2026-05 N:hubei-qinghai-sec
关志鸥 2026-05 - N:2026-05-30-hubei-sec
湖北 gov
蒋祝平 1995-02 2001-01 L
a 张国光 2001-01 2001-02 B:zhang-guoguang
张国光 2001-02 2002-10 B:zhang-guoguang
a 罗清泉 2002-10 2003-01 B:luo-qingquan
罗清泉 2003-01 2007-12 L
a 李鸿忠 2007-12 2008-01 B:li-hongzhong
李鸿忠 2008-01 2010-12 B:li-hongzhong
a 王国生 2010-12 2011-02 B:wang-guosheng
王国生 2011-02 2016-07 L
a 王晓东 2016-09 2017-01 B:wang-xiaodong
王晓东 2017-01 2021-05 B:wang-xiaodong
a 王忠林 2021-05-07 2021-05-30 N:wang-zhonglin-acting
王忠林 2021-05-30 2025-01 B:wang-zhonglin
a 李殿勋 2025-01-02 2025-01-20 N:li-dianxun-acting
李殿勋 2025-01-20 - N:li-dianxun-elected
湖南 sec
杨正午 1998-10 2005-12 L
张春贤 2005-12 2010-04 L
周强 2010-04 2013-03 L
徐守盛 2013-03 2016-08 L
杜家毫 2016-08 2020-11 L
许达哲 2020-11 2021-10 N:jilin-4-sec
张庆伟 2021-10 2023-03 c03-xinhua-2021-10-19-five-provinces
沈晓明 2023-03 - N:hunan-3-sec
湖南 gov
储波 1998-09 2001-08 L
a 张云川 2001-08 2002-02 L
张云川 2002-02 2003-03 N:zhang-yunchuan
周伯华 2003-03 2006-09 B:zhou-bohua
a 周强 2006-09 2007-02 B:zhou-qiang
周强 2007-02 2010-06 L
a 徐守盛 2010-06 2010-09 L
徐守盛 2010-09 2013-04 B:xu-shousheng
a 杜家毫 2013-04 2013-05 B:du-jiahao
杜家毫 2013-05 2016-09 B:du-jiahao
a 许达哲 2016-09 2016-12 B:xu-dazhe
许达哲 2016-12 2020-11 B:xu-dazhe
a 毛伟明 2020-11-27 2021-01 N:mao-weiming-acting
毛伟明 2021-01 - B:mao-weiming
广东 sec
李长春 1998-05 2002-12 L
张德江 2002-12 2007-12 L
汪洋 2007-12 2012-12 L
胡春华 2012-12 2017-10 L
李希 2017-10 2022-10 L
黄坤明 2022-10 - b11-gd-2022-10-28-huang-guangdong
广东 gov
卢瑞华 1996-02 2003-01 L
黄华华 2003-01 2011-11 L
a 朱小丹 2011-11 2012-01 B:zhu-xiaodan
朱小丹 2012-01 2016-12 B:zhu-xiaodan
a 马兴瑞 2016-12 2017-01 B:ma-xingrui
马兴瑞 2017-01 2021-12 L
a 王伟中 2021-12 2022-01 N:wang-weizhong-acting
王伟中 2022-01 2025-10 B:wang-weizhong
a 孟凡利 2025-10-11 2025-10-15 N:meng-fanli-acting
孟凡利 2025-10-15 - N:meng-fanli-elected
广西 sec
曹伯纯 1997-07 2006-06 L
刘奇葆 2006-06 2007-12 L
郭声琨 2007-12 2012-12 L
彭清华 2012-12 2018-03 L
鹿心社 2018-03 2021-10 L
刘宁 2021-10 2024-12 N:guangxi-yunnan-sec
陈刚 2024-12 - N:henan-guangxi-sec
广西 gov
李兆焯 1998-01 2003-04 L
陆兵 2003-04 2007-12 L
a 马飚 2007-12 2008-01 B:ma-biao
马飚 2008-01 2013-03 B:ma-biao
a 陈武 2013-03 2013-04 B:chen-wu
陈武 2013-04 2020-10 L
a 蓝天立 2020-10-19 2021-01-25 N:lan-tianli-acting
蓝天立 2021-01-25 2025-05 N:lan-tianli-elected | 2025 年 5 月因涉嫌严重违纪违法接受审查调查（据名录）
a 韦韬 2025-07-03 2025-07-18 N:wei-tao-acting
韦韬 2025-07-18 - B:wei-tao
海南 sec
杜青林 1998-02 2001-08 L
白克明 2001-08 2002-11 L
王岐山 2002-11 2003-04 L
汪啸风 2003-04 2006-12 L
卫留成 2006-12 2011-08 L
罗保铭 2011-08 2017-04 L
刘赐贵 2017-04 2020-11 f07-wiki-liu-cigui
沈晓明 2020-11 2023-03 N:fujian-hainan-sec
冯飞 2023-03 - N:hunan-3-sec
海南 gov
汪啸风 1998-02 2003-10 L
a 卫留成 2003-10 2004-02 B:wei-liucheng
卫留成 2004-02 2007-01 B:wei-liucheng
a 罗保铭 2007-01 2007-02 B:luo-baoming
罗保铭 2007-02 2011-08 B:luo-baoming
a 蒋定之 2011-08 2012-02 L
蒋定之 2012-02 2014-12 L
a 刘赐贵 2015-01 2015-02 f07-wiki-liu-cigui
刘赐贵 2015-02 2017-04 f07-wiki-liu-cigui
a 沈晓明 2017-04 2017-05 B:shen-xiaoming
沈晓明 2017-05 2020-12 B:shen-xiaoming
a 冯飞 2020-12 2021-01 N:feng-fei-acting
冯飞 2021-01 2023-04 B:feng-fei
a 刘小明 2023-04 2023-05-31 B:liu-xiaoming
刘小明 2023-05-31 - N:liu-xiaoming-elected
重庆 sec
贺国强 1999-06 2002-10 L
黄镇东 2002-10 2005-12 L
汪洋 2005-12 2007-12 L
薄熙来 2007-12 2012-03 L
张德江 2012-03 2012-11 L
孙政才 2012-11 2017-07 L
陈敏尔 2017-07 2022-12 L
袁家军 2022-12 - N:chongqing-sec
重庆 gov
包叙定 1999-06 2002-10 L
a 王鸿举 2002-10 2003-01 B:wang-hongju
王鸿举 2003-01 2009-11 L
a 黄奇帆 2009-11 2010-01 B:huang-qifan
黄奇帆 2010-01 2016-12 L
a 张国清 2016-12 2017-01 c02-wiki-zhang-guoqing
张国清 2017-01 2017-12 L
a 唐良智 2018-01-02 2018-01-31 N:tang-liangzhi-acting
唐良智 2018-01-31 2021-12 N:tang-liangzhi-elected
a 胡衡华 2021-12 2022-01-21 B:hu-henghua
胡衡华 2022-01-21 2026-05 N:hu-henghua-elected | 卸任月份据市长名录，任内因涉嫌严重违纪违法被查；市委页作 2026 年 3 月不再任市委常委
a 陈新武 2026-07-31 2026-08 N:chen-xinwu-acting
陈新武 2026-08 - B:chen-xinwu
四川 sec
谢世杰 1993-04 2000-01 L
周永康 2000-01 2002-12 L
张学忠 2002-12 2006-12 L
杜青林 2006-12 2007-12 L
刘奇葆 2007-12 2012-11 L
王东明 2012-11 2018-03 L
彭清华 2018-03 2022-04 L
王晓晖 2022-04 - N:sichuan-sec
四川 gov
张中伟 1999-06 2007-01 L
a 蒋巨峰 2007-01-23 2007-01-31 N:jiang-jufeng-acting
蒋巨峰 2007-01-31 2013-01 N:jiang-jufeng-elected
a 魏宏 2013-01-05 2013-01-29 B:wei-hong
魏宏 2013-01-29 2016-01 B:wei-hong
a 尹力 2016-01 2016-01-29 c02-wiki-yin-li
尹力 2016-01-29 2020-12 c02-wiki-yin-li
a 黄强 2020-12-02 2021-02 N:huang-qiang-acting
黄强 2021-02 2024-07 B:huang-qiang
a 施小琳 2024-07-04 2024-07-31 N:shi-xiaolin-acting
施小琳 2024-07-31 - N:shi-xiaolin-elected
贵州 sec
刘方仁 1993-07 2001-01 L
钱运录 2001-01 2005-12 L
石宗源 2005-12 2010-08 L
栗战书 2010-08 2012-07 L
赵克志 2012-07 2015-07 L
陈敏尔 2015-07 2017-07 L
孙志刚 2017-07 2020-11 L
谌贻琴 2020-11 2022-12 N:jilin-4-sec
徐麟 2022-12 - N:guizhou-sec
贵州 gov
钱运录 1998-12 2001-01 L
a 石秀诗 2001-01-06 2001-01-16 B:shi-xiushi
石秀诗 2001-01-16 2006-07 B:shi-xiushi
a 林树森 2006-07 2007-01 B:lin-shusen
林树森 2007-01 2010-08 B:lin-shusen
a 赵克志 2010-08 2010-09 B:zhao-kezhi
赵克志 2010-09 2012-12 B:zhao-kezhi
a 陈敏尔 2012-12-28 2013-01-30 B:chen-miner
陈敏尔 2013-01-30 2015-10 B:chen-miner
a 孙志刚 2015-10 2016-01 B:sun-zhigang
孙志刚 2016-01 2017-09 B:sun-zhigang
a 谌贻琴 2017-09-06 2018-01-30 N:chen-yiqin-acting
谌贻琴 2018-01-30 2020-11 N:chen-yiqin-elected
a 李炳军 2020-11-24 2021-01 N:li-bingjun-acting
李炳军 2021-01 - B:li-bingjun
云南 sec
令狐安 1997-08 2001-10 L
白恩培 2001-10 2011-08 L
秦光荣 2011-08 2014-10 L
李纪恒 2014-10 2016-08 L
陈豪 2016-08 2020-11 L
阮成发 2020-11 2021-10 N:jilin-4-sec
王宁 2021-10 - N:guangxi-yunnan-sec
云南 gov
李嘉廷 1998-01 2001-06 L
a 徐荣凯 2001-06 2002-01 B:xu-rongkai
徐荣凯 2002-01 2006-11 B:xu-rongkai
a 秦光荣 2006-11 2007-01 B:qin-guangrong
秦光荣 2007-01 2011-08 B:qin-guangrong
a 李纪恒 2011-08 2012-02 N:li-jiheng-acting
李纪恒 2012-02 2014-10 B:li-jiheng
a 陈豪 2014-10 2015-01 c07-wiki-chen-hao
陈豪 2015-01 2016-12 c07-wiki-chen-hao
a 阮成发 2016-12 2017-01 B:ruan-chengfa
阮成发 2017-01 2020-11 B:ruan-chengfa
a 王予波 2020-11-25 2021-01-29 N:wang-yubo-acting
王予波 2021-01-29 - B:wang-yubo
西藏 sec
陈奎元 1992-11 2000-09 L
郭金龙 2000-09 2004-12 L
杨传堂 2004-12 2005-11 L
张庆黎 2005-11 2011-08 L
陈全国 2011-08 2016-08 L
吴英杰 2016-08 2021-10 L
王君正 2021-10 2026-09 c03-xinhua-2021-10-19-five-provinces
胡昌升 2026-09 - N:xizang-3-sec
西藏 gov
列确 1998-05 2003-05 L | 名录作 2003 年 4 月卸任；据中新网 2003-05-16 消息，当日向巴平措当选主席
向巴平措 2003-05 2010-01 N:qiangba-puncog | 名录作 2003 年 4 月；据中新网当选消息作 5 月
白玛赤林 2010-01 2013-01 B:padma-choling
洛桑江村 2013-01 2017-01 N:losang-jamcan
齐扎拉 2017-01 2021-10 B:che-dalha
a 严金海 2021-10 2022-01 B:yan-jinhai
严金海 2022-01 2024-11 N:yan-jinhai-elected
a 嘎玛泽登 2024-11 2025-01 B:karma-tseten
嘎玛泽登 2025-01 - N:karma-tseten-elected
陕西 sec
李建国 1997-08 2007-03 L
赵乐际 2007-03 2012-11 L
赵正永 2012-11 2016-03 L
娄勤俭 2016-03 2017-10 L
胡和平 2017-10 2020-07 L
刘国中 2020-07 2022-11 N:2020-07-31-shaanxi-sec
赵一德 2022-11 - N:2022-11-27-shaanxi-sec
陕西 gov
程安东 1994-12 2002-05 L
a 贾治邦 2002-05-20 2003-01-18 N:jia-zhibang-acting
贾治邦 2003-01-18 2004-10 N:jia-zhibang-elected
a 陈德铭 2004-10 2005-02 B:chen-deming
陈德铭 2005-02 2006-06 B:chen-deming
a 袁纯清 2006-06 2007-02 B:yuan-chunqing
袁纯清 2007-02 2010-06 B:yuan-chunqing
a 赵正永 2010-06 2011-01 B:zhao-zhengyong
赵正永 2011-01 2012-12 B:zhao-zhengyong
a 娄勤俭 2012-12 2013-01 B:lou-qinjian
娄勤俭 2013-01 2016-03 B:lou-qinjian
a 胡和平 2016-04-01 2016-04-27 B:hu-heping
胡和平 2016-04-27 2018-01 B:hu-heping
a 刘国中 2018-01-04 2018-01-30 N:liu-guozhong-acting
刘国中 2018-01-30 2020-08 N:liu-guozhong-elected
a 赵一德 2020-08-02 2020-08-25 N:zhao-yide-acting
赵一德 2020-08-25 2022-12 N:zhao-yide-elected
a 赵刚 2022-12-01 2023-01 N:zhao-gang-acting
赵刚 2023-01 - f07-wiki-zhao-gang
甘肃 sec
孙英 1998-04 2001-01 L
宋照肃 2001-01 2003-08 L
苏荣 2003-08 2006-07 L
陆浩 2006-07 2011-12 L
王三运 2011-12 2017-04 L
林铎 2017-04 2021-03 B:lin-duo | 据传记（2017 年 4 月 1 日）；名录作 2017 年 3 月
尹弘 2021-03 2022-12 L
胡昌升 2022-12 2026-09 N:2022-12-07-gansu-sec
吴晓军 2026-09 - N:2026-09-22-gansu-sec
甘肃 gov
宋照肃 1998-04 2001-01 L
a 陆浩 2001-01-03 2001-01-17 B:lu-hao
陆浩 2001-01-17 2006-10 N:lu-hao
a 徐守盛 2006-10 2007-01 B:xu-shousheng
徐守盛 2007-01 2010-07 B:xu-shousheng
a 刘伟平 2010-07 2011-01 B:liu-weiping
刘伟平 2011-01 2016-03 B:liu-weiping
a 林铎 2016-04-01 2016-05-24 B:lin-duo
林铎 2016-05-24 2017-04 B:lin-duo
a 唐仁健 2017-04 2017-05 B:tang-renjian
唐仁健 2017-05 2020-12 B:tang-renjian
a 任振鹤 2020-12-03 2021-01 N:ren-zhenhe-acting
任振鹤 2021-01 2026-09 B:ren-zhenhe
a 孔绍逊 2026-09-02 2026-09-29 N:kong-shaoxun-acting
孔绍逊 2026-09-29 - N:kong-shaoxun-elected
青海 sec
白恩培 1999-06 2001-10 L
苏荣 2001-10 2003-08 L
赵乐际 2003-08 2007-03 L
强卫 2007-03 2013-03 L
骆惠宁 2013-03 2016-06 L
王国生 2016-06 2018-03 L
王建军 2018-03 2022-03 L
信长星 2022-03 2023-01 L
陈刚 2023-01 2024-12 L
吴晓军 2024-12 2026-09 N:hubei-qinghai-sec
罗东川 2026-09 - N:xizang-3-sec
青海 gov
赵乐际 1999-08 2003-10 L
a 杨传堂 2003-10 2004-01 B:yang-chuantang
杨传堂 2004-01 2004-12 B:yang-chuantang
a 宋秀岩 2004-12 2005-01 L
宋秀岩 2005-01 2010-01 B:song-xiuyan
a 骆惠宁 2010-01-12 2010-01-30 B:luo-huining
骆惠宁 2010-01-30 2013-03 B:luo-huining
a 郝鹏 2013-03 2013-04 f07-wiki-hao-peng
郝鹏 2013-04 2016-12 f07-wiki-hao-peng
a 王建军 2016-12 2017-01 B:wang-jianjun
王建军 2017-01 2018-08 B:wang-jianjun
a 刘宁 2018-08 2018-09 B:liu-ning
刘宁 2018-09 2020-07 B:liu-ning
a 信长星 2020-08-01 2020-08-26 B:xin-changxing
信长星 2020-08-26 2022-03 B:xin-changxing
a 吴晓军 2022-03-31 2022-05-28 N:wu-xiaojun-acting
吴晓军 2022-05-28 2025-01 N:wu-xiaojun-elected
a 罗东川 2025-01-04 2025-01-23 N:luo-dongchuan-acting
罗东川 2025-01-23 - N:luo-dongchuan-elected
宁夏 sec
毛如柏 1997-08 2002-03 L
陈建国 2002-03 2010-07 L
张毅 2010-07 2013-03 L
李建华 2013-03 2017-04 L
石泰峰 2017-04 2019-10 L
陈润儿 2019-10 2022-03 L
梁言顺 2022-03 2024-06 N:2022-03-29-ningxia-sec
李邑飞 2024-06 - N:2024-06-28-ningxia-sec
宁夏 gov
马启智 1997-09 2007-05 L
a 王正伟 2007-05 2008-01 B:wang-zhengwei
王正伟 2008-01 2013-03 B:wang-zhengwei
刘慧 2013-03 2016-07 L | 名录作 2013 年 3 月；维基传记作 2013 年 4 月当选
a 咸辉 2016-07 2016-09 B:xian-hui
咸辉 2016-09 2022-05 B:xian-hui
a 张雨浦 2022-05-09 2022-05-21 B:zhang-yupu
张雨浦 2022-05-21 - N:zhang-yupu-elected
新疆 sec
王乐泉 1995-09 2010-04 L | 1994 年 9 月至 1995 年 9 月为代理书记
张春贤 2010-04 2016-08 L
陈全国 2016-08 2021-12 L
马兴瑞 2021-12 2025-07 b08-xinhua-2021-12-25-ma-xinjiang
陈小江 2025-07 - b08-xinhua-2025-07-01-ma-leaves-xinjiang
新疆 gov
阿不来提·阿不都热西提 1994 2003-01 B:abdulahat-abdurixit
司马义·铁力瓦尔地 2003-01 2007-12 B:ismail-tiliwaldi
a 努尔·白克力 2007-12 2008-01 B:nur-bekri
努尔·白克力 2008-01 2014-12 B:nur-bekri
a 雪克来提·扎克尔 2014-12 2015-01 B:shohrat-zakir
雪克来提·扎克尔 2015-01 2021-09 B:shohrat-zakir
a 艾尔肯·吐尼亚孜 2021-09 2022-01-27 B:erkin-tuniyaz
艾尔肯·吐尼亚孜 2022-01-27 - N:erkin-elected
`

const keeps: Record<string, string[]> = {
  'henan-sec': ['马忠臣（1998年02月—2000年10月）', '陈奎元（2000年10月—2002年12月）', '李克强（2002年12月—2004年12月）', '徐光春（2004年12月—2009年11月）', '卢展工（2009年11月—2013年03月）', '书记：卢展工（—2013年3月）', '书记：谢伏瞻（—2018年3月）', '书记：楼阳生（—2024年12月）'],
  'henan-gov': ['李克强', '1998年7月—2003年1月', '李成玉', '2003年1月—2008年3月', '郭庚茂', '2008年3月—2013年3月', '谢伏瞻', '2013年4月—2016年4月', '陈润儿', '2016年4月—2019年12月', '尹 弘', '2019年12月—2021年4月', '王 凯', '2021年4月—2026年9月', '王陆进', '2026年9月—'],
  'hubei-sec': ['书记：关广富（~1994年11月）、贾志杰', '书记：贾志杰（1998年10月—2000年12月）', '书记：俞正声（2007年6月—2007年10月）', '书记：李鸿忠（2012年6月—2016年9月）', '书记：蒋超良（—2020年2月）', '书记：王蒙徽（—2024年12月）'],
  'hubei-gov': ['蒋祝平', '1994年12月－2001年1月', '1995年2月－2001年1月', '张国光', '2001年1月－2002年10月', '罗清泉', '2002年10月－2007年12月', '李鸿忠', '2007年12月－2011年2月', '王国生', '2011年2月－2016年7月', '王晓东', '2016年9月－2021年5月', '王忠林', '2021年5月－2025年1月', '李殿勋', '2025年1月－'],
  'hunan-sec': ['书记：王茂林（－1998年10月）、杨正午', '书记：杨正午（－2005年12月）', '书记：张春贤（－2010年4月）', '书记：周强（－2013年3月）', '书记：杜家毫（－2020年11月）', '书记：张庆伟（－2023年3月）'],
  'hunan-gov': ['储 波', '1998年9月－2001年8月', '张云川', '2001年8月－2003年3月', '周伯华', '2003年3月－2006年9月', '周 强', '2006年9月－2010年6月', '徐守盛', '2010年6月－2013年4月', '杜家毫', '2013年4月-2016年9月', '许达哲', '2016年9月-2020年11月', '毛伟明', '2020年11月-'],
  'guangdong-sec': ['李长春（1998年5月 — 2002年12月）', '张德江（2002年12月 — 2007年12月）', '汪洋（2007年12月 — 2012年12月）', '胡春华（2012年12月 — 2017年10月）', '李希（2017年10月 — 2022年10月）', '黄坤明（2022年10月 — ）'],
  'guangdong-gov': ['卢瑞华', '1996年2月9日', '2003年1月20日', '黄华华', '2011年11月4日', '朱小丹', '2011年11月5日', '2016年12月30日', '马兴瑞', '2021年12月27日', '王伟中', '2025年10月11日', '孟凡利'],
  'guangxi-sec': ['1997年7月–2006年6月', '2006年6月–2007年12月', '2007年12月–2012年12月', '彭清华（2012年12月—2018年3月）', '鹿心社（2018年3月—2021年10月）', '刘 宁（2021年10月—2024年12月）', '陈 刚（2024年12月'],
  'guangxi-gov': ['李兆焯', '1998年1月—2003年4月', '陆 兵', '2003年4月—2007年12月', '马 飚', '2007年12月—2013年4月', '陈 武', '2013年4月—2020年10月', '蓝天立', '2020年10月—2025年5月', '2025年5月16日，因涉嫌严重违纪违法接受审查调查', '韦 韬', '2025年7月—'],
  'hainan-sec': ['杜青林（1998年2月－2001年8月）', '白克明（2001年8月－2002年11月）', '王岐山（2002年11月－2003年4月）', '汪啸风（2003年4月－2006年12月）', '卫留成（2006年12月－2011年8月）', '罗保铭（2011年8月－2017年4月）', '书记：罗保铭（－2017年3月）', '书记：刘赐贵（－2020年11月）', '书记：沈晓明（－2023年3月）'],
  'hainan-gov': ['汪啸风', '1998年2月-2003年10月', '卫留成', '2003年10月-2007年1月', '罗保铭', '2007年1月-2011年8月', '蒋定之', '2011年8月-2014年12月', '2011年8月-2012年2月为代省长', '刘赐贵', '2015年1月-2017年4月', '沈晓明', '2017年4月-2020年12月', '冯 飞', '2020年12月-2023年4月', '刘小明', '2023年4月-'],
  'chongqing-sec': ['书 记：张德邻（—1999年6月）、贺国强', '书 记：贺国强（—2002年10月）', '书 记：汪洋（—2007年12月）', '书 记：张德江（—2012年11月）', '书 记：孙政才（—2017年7月', '书 记：陈敏尔（—2022年12月）'],
  'chongqing-gov': ['包叙定', '1999年6月', '王鸿举', '2002年10月', '2003年1月', '黄奇帆', '2009年11月', '2016年12月', '张国清', '2017年12月', '唐良智', '2018年1月', '2021年12月', '胡衡华', '2026年5月', '任内因涉嫌严重违纪违法被查', '陈新武', '2026年7月'],
  'sichuan-sec': ['谢世杰（1993年04月07日—2000年01月06日）', '周永康（2000年01月06日—2002年12月05日）', '张学忠（2002年12月05日—2006年12月03日）', '杜青林（2006年12月03日—2007年12月01日）', '刘奇葆（2007年12月01日—2012年11月20日）', '书记：刘奇葆（—2012年11月）', '书记：王东明（—2018年3月）'],
  'sichuan-gov': ['张中伟', '1999年6月－2007年1月', '蒋巨峰', '2007年1月－2013年1月', '魏宏', '2013年1月－2016年1月', '尹力', '2016年1月－2020年12月', '黄强', '2020年12月－2024年7月', '施小琳', '2024年7月－'],
  'guizhou-sec': ['刘方仁（1993年7月—2001年1月）', '钱运录（2001年1月—2005年12月）', '石宗源（2005年12月—2010年8月）', '栗战书（2010年8月—2012年7月18日）', '赵克志（2012年7月18日—2015年7月）', '陈敏尔（2015年7月—2017年7月）', '孙志刚（2017年7月—2020年11月）', '书记：谌贻琴（女，白族，—2022年12月）', '徐麟（2022年12月—）'],
  'guizhou-gov': ['钱运录', '1998年12月－2001年1月', '石秀诗', '2001年1月－2006年7月', '林树森', '2006年7月－2010年8月', '赵克志', '2010年8月 - 2012年12月', '陈敏尔', '2012年12月 - 2015年10月', '孙志刚', '2015年10月 - 2017年9月', '谌贻琴', '2017年9月 - 2020年11月', '李炳军', '2020年11月 -'],
  'yunnan-sec': ['令狐安（1997年08月—2001年10月）', '白恩培（2001年10月—2011年08月）', '秦光荣（2011年08月—2014年10月）', '书记：秦光荣（—2014年10月）', '书记：陈豪（—2020年11月）'],
  'yunnan-gov': ['李嘉廷', '1998年1月18日－2001年6月1日', '徐荣凯', '2001年6月1日－2006年11月6日', '秦光荣', '2006年11月6日－2011年8月30日', '李纪恒', '2011年8月30日－2014年10月17日', '陈豪', '2014年10月17日－2016年12月13日', '阮成发', '2016年12月13日－2020年11月25日', '王予波', '2020年11月25日－'],
  'xizang-sec': ['陈奎元（1992年11月—2000年09月）', '郭金龙（2000年09月—2004年12月）', '杨传堂（2004年12月—2005年11月）', '张庆黎（2005年11月—2011年8月）', '书记：张庆黎（—2011年8月）', '书记：陈全国（—2016年8月）', '书记：吴英杰（2016年8月—2021年10月）', '书记：王君正（—2026年9月）'],
  'xizang-gov': ['列确', '1998年5月－2003年4月', '向巴平措', '2003年4月－2010年1月', '白玛赤林', '2010年1月－2013年1月', '洛桑江村', '2013年1月－2017年1月', '齐扎拉', '2017年1月－2021年10月', '严金海', '2021年10月－2024年11月', '嘎玛泽登', '2024年11月至今'],
  'shaanxi-sec': ['李建国（1997年8月－）', '书 记：李建国 → 赵乐际（2007年3月－）', '书 记：赵乐际（—2012年11月）', '书 记：娄勤俭（—2017年10月）', '书 记：刘国中（—2022年11月）'],
  'shaanxi-gov': ['程安东', '1994年12月-2002年5月', '贾治邦', '2002年5月-2004年10月', '陈德铭', '2004年10月-2006年6月', '袁纯清', '2006年6月-2010年6月', '赵正永', '2010年6月-2012年12月', '娄勤俭', '2012年12月-2016年3月', '胡和平', '2016年3月-2018年1月', '刘国中', '2018年1月-2020年8月', '赵一德', '2020年8月-2022年12月', '赵刚', '2022年12月-'],
  'gansu-sec': ['孙英（1998年4月—2001年1月）', '宋照肃（2001年1月—2003年8月）', '苏荣（2003年8月—2006年7月）', '陆浩（2006年7月—2011年12月）', '王三运（2011年12月—2017年4月）', '林铎（2017年3月—2021年3月）', '尹弘（2021年3月—2022年12月）', '胡昌升（2022年12月—2026年9月）', '吴晓军（2026年9月—）'],
  'gansu-gov': ['宋照肃', '1998年4月－2001年1月', '陆 浩', '2001年1月－2006年10月', '徐守盛', '2006年10月－2010年7月', '刘伟平', '2010年7月－2016年4月', '2010年7月－2011年1月间为代省长', '林 铎', '2016年4月－2017年4月', '唐仁健', '2017年4月－2020年12月', '任振鹤', '2020年12月－2026年9月', '孔绍逊', '2026年9月－'],
  'qinghai-sec': ['白恩培（1999年06月－2001年10月）', '苏 荣（2001年10月－2003年08月）', '赵乐际（2003年8月－2007年3月）', '强 卫（2007年3月－2013年3月）', '骆惠宁（2013年3月—2016年6月）', '王国生（2016年6月—2018年3月）', '王建军（2018年3月—2022年3月）', '信长星（2022年3月—2023年1月）', '陈刚（2023年1月—2024年12月）', '吴晓军（2024年12月—2026年9月）', '罗东川（2026年9月—）'],
  'qinghai-gov': ['赵乐际', '1999年8月－2003年10月', '杨传堂', '2003年10月－2004年12月', '宋秀岩', '2004年12月－2010年1月', '骆惠宁', '2010年1月－2013年4月', '郝 鹏', '2013年4月－2016年12月', '王建军', '2016年12月－2018年8月', '刘 宁', '2018年8月－2020年7月', '信长星', '2020年8月－2022年3月', '吴晓军', '2022年3月－2025年1月', '罗东川', '2025年1月 -'],
  'ningxia-sec': ['毛如柏（1997年08月—2002年03月）', '陈建国（2002年03月—2010年07月）', '张 毅（2010年07月—2013年03月）', '书记：张毅（—2013年3月）', '书记：石泰峰（—2019年10月）', '书记：梁言顺（—2024年6月28日）'],
  'ningxia-gov': ['马启智', '1997年9月－2007年5月', '王正伟', '2007年5月－2013年3月', '刘 慧', '2013年3月－2016年7月', '咸 辉', '2016年7月－2022年5月', '张雨浦', '2022年5月－'],
  'xinjiang-sec': ['王乐泉（1994.9.24—2010.4.24，1994.9—1995.9代理）', '张春贤（2010.4.24—2016.8.29）', '书记：张春贤（—2016年8月）', '书记：陈全国（—2021年12月）'],
  'xinjiang-gov': ['阿不来提·阿不都热西提 1993年－2003年', '司马义·铁力瓦尔地 2003年－2007年', '努尔·白克力 2007年－2014年', '雪克来提·扎克尔 2014年－2021年', '艾尔肯·吐尼亚孜 2021年－'],
}

const bioKeeps: Record<string, string[]> = {
  'li-chengyu': ['2003年1月至2008年4月任中共河南省委副书记、河南省省长'],
  'guo-gengmao': ['2008年4月河南省人大常委会任命郭庚茂为副省长、代省长'],
  'xie-fuzhan': ['谢伏瞻出任中共河南省委副书记'],
  'chen-runer': ['陈润儿在黑龙江工作三年之后', '12月6日，辞去河南省人民政府省长职务'],
  'yin-hong': ['尹弘转任中共河南省委副书记'],
  'wang-kai': ['王凯任中共河南省委副书记、河南省人民政府代省长'],
  'zhang-guoguang': ['张国光辞去辽宁省省长职务'],
  'luo-qingquan': ['2002年10月任湖北省副省长、代省长'],
  'li-hongzhong': ['12月兼任湖北省人民政府副省长、代省长'],
  'wang-guosheng': ['任中共湖北省委副书记、副省长、代省长'],
  'wang-xiaodong': ['任湖北省政府党组书记、代省长'],
  'wang-zhonglin': ['出任湖北省代省长'],
  'zhou-bohua': ['2003年3月至2006年9月任湖南省委副书记'],
  'zhou-qiang': ['出任湖南省代理省长'],
  'xu-shousheng': ['徐升任省委副书记、代省长', '2010年5月，任中国共产党湖南省委员会副书记、代省长'],
  'du-jiahao': ['4月10日，任湖南省人民政府副省长'],
  'xu-dazhe': ['9月5日，任湖南省人民政府副省长、代理省长'],
  'mao-weiming': ['2021年1月，当选为湖南省人民政府省长'],
  'zhu-xiaodan': ['2011年11月4日起，接替黄华华'],
  'ma-xingrui': ['任命马兴瑞为广东省人民政府代省长'],
  'wang-weizhong': ['2022年1月22日，当选广东省人民政府省长'],
  'ma-biao': ['政府副主席、代主席；2008年1月'],
  'chen-wu': ['2013年3月，出任中共广西壮族自治区党委副书记'],
  'wei-tao': ['任广西壮族自治区人民政府代理主席'],
  'wei-liucheng': ['出任中共海南省委副书记，海南省代省长'],
  'luo-baoming': ['2007年1月，任中共海南省委副书记，海南省人民政府副省长、代省长'],
  'shen-xiaoming': ['同月7日，任海南省人民政府副省长'],
  'feng-fei': ['2021年1月，冯飞当选为海南省人民政府省长'],
  'liu-xiaoming': ['被任命为海南省人民政府副省长、代理省长'],
  'wang-hongju': ['接替包叙定出任代市长'],
  'huang-qifan': ['重庆市人民政府代理市长（2009.11—2010.01）'],
  'hu-henghua': ['同月任重庆市人民政府副市长、代理市长'],
  'chen-xinwu': ['升任重庆市人民政府代理市长'],
  'wei-hong': ['被任命为四川省人民政府代理省长'],
  'huang-qiang': ['2021年2月，当选四川省省长'],
  'shi-xiushi': ['代理：2001年1月6日-1月16日', '2001年1月6日—2006年7月19日'],
  'lin-shusen': ['被任命为贵州省代省长'],
  'zhao-kezhi': ['2010年8月，任中共贵州省委副书记、省政府党组书记，代省长'],
  'chen-miner': ['代理：2012年12月28日－2013年1月30日', '2012年12月28日—2015年10月16日'],
  'sun-zhigang': ['孙志刚调任中共贵州省委副书记'],
  'li-bingjun': ['2020年11月，升任贵州省委副书记、代省长'],
  'xu-rongkai': ['2001年5月31日中共中央决定徐荣凯'],
  'qin-guangrong': ['秦光荣接替徐荣凯出任云南省代理省长'],
  'li-jiheng': ['获提名出任云南省省长'],
  'ruan-chengfa': ['2016年12月，调任中共云南省委副书记'],
  'wang-yubo': ['2021年1月29日，任云南省人民政府省长'],
  'padma-choling': ['2010年1月15日，在西藏自治区九届人大三次会议上'],
  'che-dalha': ['2017年1月15日，任西藏自治区人民政府主席'],
  'yan-jinhai': ['2021年10月8日，任西藏自治区人民政府代理主席'],
  'karma-tseten': ['11月28日，就任自治区政府代理主席'],
  'chen-deming': ['两年后，任代理省长'],
  'yuan-chunqing': ['出任陕西省人民政府代省长'],
  'zhao-zhengyong': ['赵正永出任中共陕西省委副书记、陕西省代理省长'],
  'lou-qinjian': ['2012年12月，任中共陕西省委副书记，副省长、代省长'],
  'hu-heping': ['同年4月1日任陕西省人民政府代省长'],
  'lu-hao': ['2001年1月3日，任甘肃省人民政府代理省长'],
  'liu-weiping': ['2010年7月，任甘肃省委副书记，副省长、代省长'],
  'lin-duo': ['2016年4月1日，任中共甘肃省委副书记'],
  'tang-renjian': ['四月起担任副省长、代省长'],
  'ren-zhenhe': ['2021年1月，当选甘肃省人民政府省长'],
  'yang-chuantang': ['2003年10月，接替赵乐际'],
  'song-xiuyan': ['2005年1月23日，被青海省第十届人民代表大会'],
  'luo-huining': ['2010年1月30日—2013年3月28日', '骆惠宁任青海省代理省长. 人民网. 2010-01-12'],
  'wang-jianjun': ['2016年12月19日，王建军任青海省人民政府副省长'],
  'liu-ning': ['2018年8月，出任青海省人民政府副省长、代理省长'],
  'xin-changxing': ['2020年8月1日，信长星被任命为'],
  'wang-zhengwei': ['2007年5月12日又出任代理主席'],
  'xian-hui': ['兼任自治区人民政府代理主席'],
  'zhang-yupu': ['任自治区人民政府代理主席'],
  'abdulahat-abdurixit': ['1994年至2003年任新疆维吾尔自治区主席'],
  'ismail-tiliwaldi': ['2003年1月至2007年12月，任新疆自治区政府主席'],
  'nur-bekri': ['努尔·白克力代理新疆维吾尔自治区主席. 新华网. 2007-12-28', '2008年1月，白克力当选自治区人民政府主席'],
  'shohrat-zakir': ['自治区政府代主席。2015年1月起任自治区政府主席', '2021年9月30日，辞去自治区政府主席职务'],
  'erkin-tuniyaz': ['2021年9月，任中共新疆维吾尔自治区党委副书记、自治区政府代主席', '2022年1月27日，当选新疆维吾尔自治区政府主席'],
}

const slug: Record<string, string> = { 河南: 'henan', 湖北: 'hubei', 湖南: 'hunan', 广东: 'guangdong', 广西: 'guangxi', 海南: 'hainan', 重庆: 'chongqing', 四川: 'sichuan', 贵州: 'guizhou', 云南: 'yunnan', 西藏: 'xizang', 陕西: 'shaanxi', 甘肃: 'gansu', 青海: 'qinghai', 宁夏: 'ningxia', 新疆: 'xinjiang' }
const actingNote = (prov: string) => (['广西', '西藏', '宁夏', '新疆'].includes(prov) ? '代主席' : prov === '重庆' ? '代市长' : '代省长')

const manPath = 'research/manifests/P02.yaml'
let man = readFileSync(manPath, 'utf8')
const eol = man.includes('\r\n') ? '\r\n' : '\n'

const newsEntry = [
  '  - id: p02-xinhua-2025-01-23-luo-dongchuan-elected',
  '    title: 吴晓军当选青海省人大常委会主任 罗东川当选青海省省长',
  '    publisher: 新华社',
  '    date: 2025-01-23',
  '    voice: official',
  '    url: http://www.news.cn/20250123/0eaaa8cecb324b8a956e0096d1ce71d4/c.html',
  `    start: ${JSON.stringify('新华社西宁1月23日电')}`,
  `    end: ${JSON.stringify('选举罗东川为青海省人民政府省长。')}`,
]
if (!man.includes('p02-xinhua-2025-01-23-luo-dongchuan-elected')) man = man.replace(/\s*$/, '') + eol + newsEntry.join(eol) + eol

const ids: string[] = [...man.matchAll(/id: (p02-[\w-]+)/g)].map((m) => m[1])
const out: string[] = []
const problems: string[] = []
const people = new Map<string, string[]>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as { id: string; name: string }[])
    people.set(p.name, [...(people.get(p.name) ?? []), p.id])
// 王国生: the only entry is the PLA general (b. 1947), not the provincial secretary (b. 1956)
const choose: Record<string, string> = { 王宁: 'wang-ning-yunnan', 王凯: 'wang-kai-henan', 王国生: '' }

const cited = new Set<string>()
const noPerson = new Map<string, Set<string>>()
let prov = ''
let post = ''
const counts = new Map<string, number>()
for (const raw of table.trim().split('\n')) {
  const line = raw.trim()
  const head = line.match(/^(\S+) (sec|gov)$/)
  if (head) {
    ;[, prov, post] = head
    continue
  }
  const [body, note] = line.split(' | ')
  const parts = body.split(' ')
  const acting = parts[0] === 'a'
  if (acting) parts.shift()
  const [name, from, to, c] = parts
  let cite: string
  if (c === 'L') cite = `p02-wiki-${slug[prov]}-${post}`
  else if (c.startsWith('B:')) cite = `p02-wiki-${c.slice(2)}`
  else if (c.startsWith('N:')) {
    const m = ids.filter((i) => !i.startsWith('p02-wiki-') && i.endsWith(c.slice(2)))
    if (m.length !== 1) problems.push(`cite ${c} matches ${m.length}: ${m.join(' ')}`)
    cite = m[0]
  } else cite = c
  if (cite.startsWith('p02-') && !ids.includes(cite)) problems.push(`unknown cite ${cite} (${prov} ${name})`)
  cited.add(cite)
  const hits = people.get(name) ?? []
  const person = choose[name] ?? (hits.length === 1 ? hits[0] : undefined)
  if (hits.length > 1 && !choose[name]) problems.push(`ambiguous person ${name}: ${hits.join(' ')}`)
  if (!person) noPerson.set(prov, (noPerson.get(prov) ?? new Set()).add(name))
  const f: string[] = [`prov: ${prov}`, `post: ${post}`, `name: ${name}`]
  if (person) f.push(`person: ${person}`)
  f.push(`from: ${JSON.stringify(from)}`)
  if (to !== '-') f.push(`to: ${JSON.stringify(to)}`)
  if (acting) f.push('acting: true')
  const n = note ? (acting && !note.startsWith('代') ? `${actingNote(prov)}；${note}` : note) : acting ? actingNote(prov) : ''
  if (n) f.push(`note: ${JSON.stringify(n)}`)
  f.push(`cite: ${cite}`)
  out.push(`- { ${f.join(', ')} }`)
  const k = `${prov} ${post} ${acting ? 'acting' : 'full'}`
  counts.set(k, (counts.get(k) ?? 0) + 1)
}
mkdirSync('content/chiefs', { recursive: true })
writeFileSync('content/chiefs/P02.yaml', '# P02 provincial chiefs (Central-South, Southwest, Northwest), January 2000 to 2026-10\n' + out.join('\n') + '\n')

// manifest keeps
const setKeep = (id: string, keep: string[]) => {
  const re = new RegExp(`^(  - \\{ id: ${id},.*keep: )\\[[^\\]]*\\]( \\}\\s*)$`, 'm')
  if (!re.test(man)) problems.push(`no flow line for ${id}`)
  man = man.replace(re, (_, a: string, b: string) => `${a}${JSON.stringify(keep)}${b}`)
}
for (const [k, v] of Object.entries(keeps)) setKeep(`p02-wiki-${k}`, v)
for (const [k, v] of Object.entries(bioKeeps)) {
  if (!cited.has(`p02-wiki-${k}`)) problems.push(`bio keep for uncited ${k}`)
  setKeep(`p02-wiki-${k}`, v)
}
const dropped: string[] = []
for (const id of ids.filter((i) => i.startsWith('p02-wiki-') && !/-(sec|gov)$/.test(i) && !cited.has(i))) {
  man = man.replace(new RegExp(`^  - \\{ id: ${id},.*\\r?\\n`, 'm'), '')
  const t = `sources/text/${id}.txt`
  if (existsSync(t)) unlinkSync(t)
  dropped.push(id)
}
const uncitedNews = ids.filter((i) => !i.startsWith('p02-wiki-') && !cited.has(i))
writeFileSync(manPath, man)

const rep = [
  `entries ${out.length}`,
  ...[...counts].map(([k, v]) => `${k}: ${v}`),
  `problems:`, ...problems,
  `dropped bios: ${dropped.join(' ')}`,
  `uncited news: ${uncitedNews.join(' ')}`,
  `no person:`, ...[...noPerson].map(([p, s]) => `${p}: ${[...s].join('、')}`),
]
writeFileSync('.probe/p02-chiefs.txt', rep.join('\n') + '\n')
console.log(out.length, problems.length)
