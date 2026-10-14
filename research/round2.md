# 第二轮批次（M2）

14 个批次并行。共同规则见 `research/agent-brief.md`、`research/howto-content.md`（尤其 §1 末尾的“第二轮起”）。本轮所有批次都在 `research/round.yaml` 的 `inflight` 里。

第一轮已整合：270 人（完整传记 60、档案卡 210）、25 个派系、297 个事件、43 个概念、1712 个来源。批次模式下这些全部可见、可引用。**先查已有来源，再登记新来源。**

例外说明：V01、P01 要改前几轮的文件，规则见各自一节；其他批次只写自己批次号开头的文件。

---

## V01 核实与修正

唯一可以改第一轮文件（`content/people/B0*.yaml`、`C0*.yaml`、`content/events/E0*.yaml` 等）的批次。改法：每次用精确替换改一小处，改完立刻 `node tools/build-data.ts --batch=V01` 确认 0 error，别让文件处在坏的中间状态（其他批次的校验也会读这些文件）。新来源登记在 `research/manifests/V01.yaml`，id 前缀 `v01-`。

逐项核实，能确认就改，不能确认就保持原样并在回报里说明：

1. 易炼红、胡衡华、魏小东、徐留平、张硕辅：截至今天（2026-10-13）是只有立案，还是已有开除党籍通报？按最新官方通报改 `status`、`statusNote`、`fall`。
2. 常万全：“降级”只有德国之声转述南华早报。有更可靠来源就补；没有就维持“退休、无 fall”，`statusNote` 写明“据德国之声转述《南华早报》，曾被降级处理，官方未公布”并引用。
3. 罗干：是否已去世？查新华社讣告。
4. 黄奇帆：2026-10-13 前后是否被立案？E04 已加事件，核对事件与来源；该人物本轮由 C07 写卡片，你只改事件。
5. 秦刚：现标 missing。查 2024–2026 有无新的官方信息（如全国人大代表资格、中央委员身份的处理）。
6. 刘亚洲：`missing` 只有一个来源。补主流媒体来源（美国之音、BBC、自由亚洲、日经等），找不到就改回 `retired`，`statusNote` 写“据某某报道已被判刑，官方未通报”。
7. 十八届军委：房峰辉、张阳在 2017-10 十九大前是否有官方免职公告（K01 的 `changes`）。
8. 陈全国：2022 年未满 67 岁即出中央委员会，核对出生日期与各方说法；中央党校校长 2026-06 由陈希改为蔡奇的日期（B06、B09 两处一致吗）。
9. 王建平（C03）去世：找可靠来源，有则写 `died`/`status: dead`。
10. C01 的四句无出处背景句：田纪云“赵紫阳的改革助手”、尉健行“陈希同下台后兼任北京市委书记”、吴仪“主持对美贸易谈判”、王乐泉“七五事件后次年调离新疆”。给每句补上 `cites` 能支撑的来源，或改写为有来源支撑的说法。
11. 张高丽“江系”标签与泰山轶事只出自马来西亚《东方日报》：补主流来源，补不到就删标签、保留轶事并写明出处。
12. 蒋洁敏、李东生的 zhou-clique 标签依据偏弱（BBC“另外三位”未点名）：找点名的来源替换，找不到就删。
13. 2003-06-20 温家宝签署废止收容遣送令（E01）缺来源；2007 反卫星试验只有官方“外空试验”表述，补外媒来源。
14. 抽查：在 `content/people/C0*.yaml` 里随机挑 20 张卡片，逐条核对 `bio` 里每个事实都有 `cites` 支撑；不支撑的改写或删去。回报抽查结果（几张有问题、什么问题）。

## P01 照片

唯一可以改 `content/photos.yaml`、`public/photos/`、`tools/fetch-photos.ts` 的批次。

目标：给下列第一轮无照片的 80 人找照片。Commons 优先（decisions #10）；Commons 没有的，用官方标准像：新华社、人民网领导人资料库、政府网、国防部网站、中纪委网站、省政府网站的任职公告配图；落马官员用落马前的官方照片；异见人士和港台人物可用 VOA（美国政府作品，Public domain）、Commons 上的 Flickr CC 图片。

条目格式（手写条目工具不会覆盖）：

```yaml
su-rong:
  file: https://...jpg            # 直链图片；Commons 写 File:名称
  url: https://...                # 图片所在网页，作为“出处”链接
  author: 新华社                   # 拍摄者或机构
  license: 版权归原发布机构         # Commons 照录；VOA 写 Public domain（美国之音）
  date: 2013-03-05
```

然后 `node tools/fetch-photos.ts <id1> <id2> ...` 下载（**一定带 id**，不带会重下全部）。下载后用读图工具打开 `public/photos/<id>.jpg` 看一眼：是本人、是正面头像、不是群像或错图。头像偏下或偏侧时加 `focus: 50% 20%`（CSS object-position）。有的官网要 Referer 才给图，可以改 `tools/fetch-photos.ts` 加请求头。

名单（id）：wu-guanzheng luo-gan chen-liangyu miao-hua zhang-shengmin ding-guangen li-tieying jiang-chunyun wang-lequan zhang-lichang fu-quanyou wang-ke wang-ruilin li-jinai liao-xilong qiao-qingchen zhang-dingfa xie-fei zhang-chunxian zhang-yang zhao-keshi shi-taifeng li-shulei liu-jinguo su-rong jiang-jiemin li-dongsheng bai-enpei wang-min zhou-benshun zhu-mingguo wang-sanyun xiang-junbo gu-junshan li-chuncheng wan-qingliang qiu-he lai-xiaomin sun-lijun wang-like gong-daoan deng-huilin liu-yanping wang-xiangxi wei-xiaodong xu-liuping zhang-shuofu wang-jianping tian-xiusi li-yuchao he-hongjun wang-xiubin qin-shutong ding-jiaxi wang-quanzhang jiang-tianyong yu-wensheng li-heping wang-yi-pastor xu-zhangrun xiao-jianhua wu-xiaohui ye-jianming bao-fan qi-qiaoqiao xi-mingze xi-yuanping wen-yunsong zhang-peili jiang-mianheng li-xiaolin gu-kailai wang-lijun zhou-bin ling-gu liu-yuan liu-yazhou jin-canrong hu-angang li-yining

优先级：政治局常委与委员（吴官正、罗干、李书磊、石泰峰、张升民、苗华……）> 落马大老虎 > 其他。找不到合适照片的（如习明泽无可靠公开照）就不放，回报里列出。

## B11–B14 完整传记（升级）

`content/people/B11.yaml` 等文件里已有这 5 人第一轮写的档案卡，作为起点：**在原条目上扩写**（不要另起条目），写完把 `tier: 2` 改为 `tier: 1`。要求见 `howto-content.md` §4“完整传记”：`life` 5–9 段、`assess` 2–5 条、`family`、名言 3–6 句（`content/quotes/<批次>.yaml`）、每人 1500–3000 字、来源 ≥ 4 个且至少 1 个非官方声部。卡片原有的 `factions`、`positions`、`fall` 保留并补全。

- **B11 习时期领导人：** 杨洁篪 yang-jiechi、孟建柱 meng-jianzhu、孙春兰 sun-chunlan、陈敏尔 chen-miner、黄坤明 huang-kunming
- **B12 习时期落马：** 孙力军 sun-lijun、傅政华 fu-zhenghua、苏荣 su-rong、鲁炜 lu-wei、赖小民 lai-xiaomin（赖小民 2021 年已被执行死刑）
- **B13 军队：** 房峰辉 fang-fenghui、魏凤和 wei-fenghe、范长龙 fan-changlong、许其亮 xu-qiliang（2023-06 去世）、谷俊山 gu-junshan
- **B14 社会与前史：** 习仲勋 xi-zhongxun、赵紫阳 zhao-ziyang、任正非 ren-zhengfei、郭文贵 guo-wengui（2024 年在美国被定罪）、许家印 xu-jiayin

## C06–C09 新档案卡

id 与姓名已在 `research/roster.yaml`（文件末尾按批次分组）。要求见 `howto-content.md` §4“档案卡”。每人先查身份：有些是别的批次凭印象提的，**身份对不上、找不到可靠来源的不写**，在回报里说明。

- **C06 维权、公民社会、港台**（21 人）：王宇、周世锋（709 案）；林荣基、桂民海（铜锣湾书店）；杜导正（炎黄春秋）；蒋彦永（SARS）；谭作人；许艳（余文生之妻）、耿和（高智晟之妻）、金变玲（江天勇之妻）、王峭岭（李和平之妻）；罗冠聪；丁子霖（天安门母亲）；戴晴；萧瀚；林祖銮、薛锦波（乌坎）；陈水扁、李登辉、唐英年、郑丽文（国民党主席）。
- **C07 习时期官员与派系骨干**（18 人）：钟绍军、宋涛、季文林、吴长顺、徐麟、杜家毫、陈豪、陆昊、郭永祥、李崇禧、娄勤俭、李子奇、张福海、庹震、朱海仑、郑必坚、黄奇帆、陈云林。重点是派系标签（之江新军、闽系、陕西帮、周永康系等），每条标签一个媒体或学者来源。
- **C08 军队与落马**（11 人）：王厚斌（火箭军司令员）、许忠波、张振中、王刚（空军，id `wang-gang-af`，与政治局委员王刚区分）、王永春（中石油）、莫建成、刘志军（铁道部）、文强（重庆，2010 年被执行死刑）、杨达才（“表哥”）、王永平（7·23 动车事故发言人）、努尔·白克力。
- **C09 思潮人物、家属、前史**（19 人）：汪晖、崔之元、王绍光、甘阳、强世功、刘小枫、潘维、张宏良、范景刚、岳昕、王小东（民族主义作者，id `wang-xiaodong-writer`）、吴思、周志兴；王冶坪（江泽民夫人）、朱琳（李鹏夫人）、曾伟（曾庆红之子，财富只写主流媒体调查）；邓小平、胡耀邦、陈希同（前史人物，写清与 2000 年后政治的关联，如邓的“隔代指定”说）。思潮人物的 `roles` 用 `scholar` 或 `media`，`bio` 写清他属于哪一派思潮（新左派、自由派、国家主义、毛左等）、谁这样归类。

## F03 新派系与争议

写 `content/factions/F03.yaml`，ids 已在 `research/faction-plan.yaml` 末尾：

- `conservatives` 保守派（李鹏、陈云系；classic 框架）
- `hebei-zhengding` 河北 / 正定旧部（xi 框架；吴国光等的分类）
- `sun-lijun-gang` 孙力军政治团伙（purged；官方用语，见中纪委、DW、BBC）：傅政华、孙力军、王立科、龚道安、邓恢林、刘彦平
- `he-miao` 何卫东、苗华案（purged；BBC 等）：何卫东、苗华、何宏军、袁华智、王厚斌……
- `southwest-army` 西南军系（army；原成都军区、第 14 集团军；法广、明报）：张又侠……
- `dongbei-army` 东北军系（army；原沈阳军区）：徐才厚……

每个派系的字段与 `content/factions/F01.yaml` 同（看现有条目照写）。成员标签写在 `content/tags/F03.yaml`。另外，给现有派系补“各方说法”：F02 记录的争议（刘国中是否航天系、刘鹤与习是否同学、习近平本人是否江/曾门生）写进相关派系的 `voices`，并列不同媒体的说法，各自引原句。

## F04 补派系标签

186 人还没有任何派系标签。其中维权人士、企业家、港台人物、家属大多本就不该有标签；但下面这些官员应当查一查：李鹏、吴官正、罗干、孙政才、王毅、李瑞环、尉健行、李岚清、田纪云、吴仪、王兆国、回良玉、刘淇、曾培炎、王刚、马凯、孙春兰、李建国、张春贤、郭金龙、杨晶、王晨、杨洁篪、杨晓渡、郭声琨、尤权、尹力、石泰峰、陈文清、陈吉宁、刘金国、苏荣、白恩培、周本顺、黄兴国、王三运、鲁炜、项俊波、万庆良、仇和、赵正永、周江勇、唐仁健、易会满、金湘军、孙绍骋、易炼红、骆惠宁、郑雁雄、赵克志、周强、张军、曹建明、夏宝龙；军队：迟浩田、张万年、曹刚川、梁光烈、陈炳德、吴胜利、马晓天、李作成。

写 `content/tags/F04.yaml`（人物 id → 标签列表）。规则不变：只写媒体或学者明确说过的，一条标签一个来源一句原句；查不到就不写，回报里列出“查过、无标签”的人。可以用 F03 的新派系 id（会有 planned 警告，正常）。B11–B14 正在升级的 20 人不要标（他们的批次自己标）。

## E05 事件补缺

写 `content/events/E05.yaml`。先 Grep `content/events/` 确认没有，再写：

- 2012 谷俊山落马；2012 黄岩岛对峙；2001 “七一”讲话（允许私营企业主入党）前后的网络话语；2004 芙蓉姐姐（folk）
- 2021 彭帅微博、WTA 暂停中国赛事、2023 恢复；秦岭违建别墅（2018 起）
- 新疆泄密文件：2019 纽约时报“新疆文件”、2019 “中国电文”、2022 “新疆公安文件”（E03/E04 已有一部分，补缺的）
- 2022 上海封城；2017 北京大兴火灾与“低端人口”；2024 取消总理记者会；2023 中央科技委员会成立（已有的跳过）
- 2026-08-12 朱镕基逝世、2026-08-17 江泽民百年诞辰纪念会、2026-09-08 董建华逝世、2026-09 黄之锋认罪（核对 E04 是否已有）
- 2026-09-23 至 25 习近平访美；2026-10-26 至 29 二十届五中全会（尚未召开，写“定于”，日期以官方预告为准）

## I03 概念补缺

写 `content/concepts/I03.yaml`，ids 已在 `research/concept-plan.yaml` 末尾：战狼外交、七上八下、蛋糕论、幸福广东、新权威主义、一国两制、社会主义市场经济、八荣八耻、和谐世界、应收尽收。字段照 `content/concepts/I01.yaml`。官方提法写首次提出的文件或讲话（引原文）；非官方说法（战狼、七上八下、蛋糕论、新权威主义）写谁提出、谁这样叫，引媒体或学者原句。能挂到人物的写 `by`（如蛋糕论：汪洋、薄熙来）。
