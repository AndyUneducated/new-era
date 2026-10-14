// One-off: print the manifest lines for the P02 governor biographies (zh.wikipedia), to paste into research/manifests/P02.yaml.
// Usage: node research/scripts/P02-bios.ts   (output .probe/p02-bios.yaml)
import { writeFileSync } from 'node:fs'

// [id suffix, article title, post word kept]
const bios: [string, string, string][] = [
  ['li-chengyu', '李成玉', '省长'], ['guo-gengmao', '郭庚茂', '省长'], ['xie-fuzhan', '谢伏瞻', '省长'], ['chen-runer', '陈润儿', '省长'],
  ['yin-hong', '尹弘', '省长'], ['wang-kai', '王凯_(1962年)', '省长'], ['wang-lujin', '王陆进', '省长'],
  ['zhang-guoguang', '张国光_(1945年)', '省长'], ['luo-qingquan', '罗清泉', '省长'], ['li-hongzhong', '李鸿忠', '省长'], ['wang-guosheng', '王国生_(1956年)', '省长'],
  ['wang-xiaodong', '王晓东_(1960年)', '省长'], ['wang-zhonglin', '王忠林_(1962年)', '省长'], ['li-dianxun', '李殿勋', '省长'],
  ['zhang-yunchuan', '张云川_(1946年)', '省长'], ['zhou-bohua', '周伯华', '省长'], ['zhou-qiang', '周强', '省长'], ['xu-shousheng', '徐守盛', '省长'],
  ['du-jiahao', '杜家毫', '省长'], ['xu-dazhe', '许达哲', '省长'], ['mao-weiming', '毛伟明', '省长'],
  ['huang-huahua', '黄华华', '省长'], ['zhu-xiaodan', '朱小丹', '省长'], ['ma-xingrui', '马兴瑞', '省长'], ['wang-weizhong', '王伟中', '省长'], ['meng-fanli', '孟凡利_(1965年)', '省长'],
  ['lu-bing', '陆兵_(1944年)', '主席'], ['ma-biao', '马飚', '主席'], ['chen-wu', '陈武_(1954年)', '主席'], ['lan-tianli', '蓝天立', '主席'], ['wei-tao', '韦韬', '主席'],
  ['wei-liucheng', '卫留成', '省长'], ['luo-baoming', '罗保铭', '省长'], ['jiang-dingzhi', '蒋定之', '省长'], ['shen-xiaoming', '沈晓明', '省长'],
  ['feng-fei', '冯飞', '省长'], ['liu-xiaoming', '刘小明', '省长'],
  ['wang-hongju', '王鸿举', '市长'], ['huang-qifan', '黄奇帆', '市长'], ['tang-liangzhi', '唐良智', '市长'], ['hu-henghua', '胡衡华', '市长'], ['chen-xinwu', '陈新武', '市长'],
  ['jiang-jufeng', '蒋巨峰', '省长'], ['wei-hong', '魏宏', '省长'], ['huang-qiang', '黄强_(1963年)', '省长'], ['shi-xiaolin', '施小琳', '省长'],
  ['shi-xiushi', '石秀诗', '省长'], ['lin-shusen', '林树森', '省长'], ['zhao-kezhi', '赵克志', '省长'], ['chen-miner', '陈敏尔', '省长'],
  ['sun-zhigang', '孙志刚_(官员)', '省长'], ['chen-yiqin', '谌贻琴', '省长'], ['li-bingjun', '李炳军', '省长'],
  ['xu-rongkai', '徐荣凯', '省长'], ['qin-guangrong', '秦光荣', '省长'], ['li-jiheng', '李纪恒', '省长'], ['ruan-chengfa', '阮成发', '省长'], ['wang-yubo', '王予波', '省长'],
  ['qiangba-puncog', '向巴平措', '主席'], ['padma-choling', '白玛赤林', '主席'], ['losang-jamcan', '洛桑江村', '主席'], ['che-dalha', '齐扎拉', '主席'],
  ['yan-jinhai', '严金海', '主席'], ['karma-tseten', '嘎玛泽登', '主席'],
  ['jia-zhibang', '贾治邦', '省长'], ['chen-deming', '陈德铭', '省长'], ['yuan-chunqing', '袁纯清', '省长'], ['zhao-zhengyong', '赵正永', '省长'],
  ['lou-qinjian', '娄勤俭', '省长'], ['hu-heping', '胡和平', '省长'],
  ['lu-hao', '陆浩', '省长'], ['liu-weiping', '刘伟平_(1953年)', '省长'], ['lin-duo', '林铎_(1956年)', '省长'], ['tang-renjian', '唐仁健', '省长'],
  ['ren-zhenhe', '任振鹤', '省长'], ['kong-shaoxun', '孔绍逊', '省长'],
  ['yang-chuantang', '杨传堂', '省长'], ['song-xiuyan', '宋秀岩', '省长'], ['luo-huining', '骆惠宁', '省长'], ['wang-jianjun', '王建军_(1958年)', '省长'],
  ['liu-ning', '刘宁_(1962年)', '省长'], ['xin-changxing', '信长星', '省长'], ['wu-xiaojun', '吴晓军', '省长'], ['luo-dongchuan', '罗东川', '省长'],
  ['wang-zhengwei', '王正伟', '主席'], ['liu-hui', '刘慧', '主席'], ['xian-hui', '咸辉', '主席'], ['zhang-yupu', '张雨浦', '主席'],
  ['abdulahat-abdurixit', '阿不来提·阿不都热西提', '主席'], ['ismail-tiliwaldi', '司马义·铁力瓦尔地', '主席'], ['nur-bekri', '努尔·白克力', '主席'],
  ['shohrat-zakir', '雪克来提·扎克尔', '主席'], ['erkin-tuniyaz', '艾尔肯·吐尼亚孜', '主席'],
]
const lines = bios.map(
  ([id, title, post]) =>
    `  - { id: p02-wiki-${id}, title: ${title.replace(/_\(.*\)$/, '')}（维基百科）, publisher: 维基百科, voice: wiki, url: https://zh.wikipedia.org/zh-hans/${title}, excerpt: true, keep: [ ${post} ] }`,
)
writeFileSync('.probe/p02-bios.yaml', lines.join('\n') + '\n')
writeFileSync('.probe/p02-bio-ids.txt', bios.map(([id]) => `p02-wiki-${id}`).join(' ') + '\n')
console.log(lines.length)
