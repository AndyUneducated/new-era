# 第十三轮批次（专题续卡、事件、厅局级、央企金融、上位之路续、照片、专题续）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`。用户的选择见 `research/decisions.md` #58–#66。本轮八批并行，**分工防撞**：

| 批次 | 只碰这些人 |
|---|---|
| C12 | 下面 C12 名单上的人 |
| R09 | 厅局级，不在 C12 名单、不在 `research/roster/*.yaml` 已有名单 |
| R10 | 央企、金融系统落马者，不在 C12 名单；厅局级金融干部归 R10，不归 R09 |
| U07、U08 | 各自的现任省级主官 |
| PH6 | 只加照片，不改卡 |
| E12、CS6 | 不建卡 |

开始前先读 `research/roster/` 下的全部文件；同一人只建一张卡，先 Grep `content/people/`（注意同名，id 冲突时加后缀）。

## C12：CS4、CS5 专题里缺卡的人

为 CS4、CS5 正文提到但没有卡的人建档案卡（tier 2，howto §4），落马者同时写案件记录 `content/falls/C12.yaml`（§10）。

1. CS4（武警、政工、后勤审计、国动）：曹均章、彭京堂、王洪斌、苏海辉、陈德民、李军（政工部主任助理）、夏志和、陈炽、李士生、殷志红、张立克。
2. CS5 南充与四川：刘宏建、杨建华、李仲彬、高先海、王雁飞、古正举。
3. CS5 股灾与金融监管：孟庆丰、刘军、许骏、李超（证监会）、姜洋、黄炜、陈文辉、王东明（中信）、刘鸿儒。
4. CS5 江西：于丽芳、苏铁志、周建华、姚敏建、宁延令、李安泽、陈卫民。
5. CS5 终身监禁：魏鹏远、于铁义、张中生、姜人杰、许迈永。
6. CS5 政治掮客：楼忠福、崔晓玉、魏新、范增玉、郑朋、刘琳、于振永、何宏达、林强、石晓春、李全、邵力平、李茂荣、王合清、李超（湖南）、刘海昌、倪会忠、秦方进、鲁进武。

先读这些人在 `content/cases/CS4.yaml`、`CS5.yaml` 里被怎么写、用了哪些来源（已登记的 `cs4-*`、`cs5-*` 来源优先）。顺带核对两处卡片，结果只写回报，不改别批的文件：王会民（`wang-huimin`）任证监会驻会纪检组长的时间（卡写 2016 年，界面写 2015 年 12 月）；王建平（`wang-jianping`）籍贯（卡写辽宁抚顺，来自英文维基导入的 Wikidata；CS4 说北京青年报写河北赞皇，但没留下原文）。

卡写 `content/people/C12.yaml`，登记 `research/roster/C12.yaml`；来源 `research/manifests/C12.yaml`，id 以 `c12-` 开头。回报里按专题 id 列出应补进 people 的新卡 id。合计 55 人左右。

## E12：CS4、CS5 建议的事件

写 `content/events/E12.yaml`，格式照 `content/events/E10.yaml`。先读 E10、E11，同一天同一件事只建一条（E10 已有 `e10-2015-csrc-zhang-yao`、`e10-2016-xiao-gang-removed` 等）。

1. CS4：2014-11-06 审计署划归中央军委；2015-01 军队首次公布 2014 年 16 起大案、经济适用住房专项清理；2016-02 省军区转隶国防动员部；2016-03-27 全面停止有偿服务（2019-07 宣布基本完成）；2016-09-13 联勤保障部队成立；2017-12-27 武警领导体制调整决定（2018-01-01 生效）；2025-07-21 曹均章以武警代理司令员身份露面、张林与高大光同日被罢免、《政治干部若干规定》公布；2025-09-16 孙斌；2026-01-26 王东海。后三条先读 CS4 正文确认说的是哪件事。
2. CS5：2015-09-15 南充拉票贿选案通报；2017-04-09 项俊波被查；2018-11-05 中信、海通、国信做空案结案；2013 中央第八巡视组巡视江西；2016-10-08 江西“回头看”反馈；2017-01-23 苏荣被判无期；2015-11-01《刑法修正案（九）》施行（2015-08-29 通过）；2016-04-18 两高贪污贿赂司法解释；2016-10-09 白恩培成为终身监禁第一案；2016-11-15 最高法减刑假释规定；2014-12-16 丁书苗被判；2018-12-27 马建被判无期；2024 纪律处分条例写入结交政治骗子；2024-12-20 四川严防政治骗子警示教育大会。

能落到已有概念的（例如 `anti-corruption`、`military-reform`、`rule-by-law` 一类，先 Grep `content/concepts/` 确认 id），在 `content/concept-more/E12.yaml` 追加 policies（带 events）；同名同日的政策会在构建时合并，名字照抄已有条目即可把事件挂上去。来源 `research/manifests/E12.yaml`，id 以 `e12-` 开头。回报里按专题 id（`pap`、`political-work`、`logistics-audit`、`mobilization`、`nanchong-sichuan`、`stock-crash-2015`、`jiangxi-su-rong`、`life-sentences`、`political-brokers`）列出应补进 events 的新事件 id。合计 25–30 条。

## R09：厅局级落马者（只收与已有专题、派系相连的）

用户要求：厅局级只收与站内已有案件专题或派系相连的人（#64 之后的选择）。找法：

1. 已有专题（`content/cases/*.yaml`）、派系（`content/factions/*.yaml`、`content/faction-voices/*.yaml`）、案件记录（`content/falls/*.yaml`）的正文和来源里点名、但没有卡的厅局级干部（地级市委书记、市长，省直厅局长，央企二级单位负责人，中管干部的秘书）。
2. 中管干部判决书或通报里写明的同案、行贿人、受托人中的厅局级官员。

每人写清和哪个专题或派系相连（`factions` 带 quote 出处，或在 bio 里写明“与 X 案同案”并引来源）。不收只在网民帖子里出现的人。落马的写案件记录 `content/falls/R09.yaml`。卡写 `content/people/R09.yaml`，登记 `research/roster/R09.yaml`；来源 id 以 `r09-` 开头。合计 50 人左右。回报里列出每人相连的专题或派系 id。

## R10：央企与金融系统落马者

1. 对照中央纪委国家监委网站“中管干部”栏目中的中管企业、中管金融企业通报（2013 年至今），找出站内没有案件记录的人（先跑脚本把 `content/falls/*.yaml` 已有的人列出来）。
2. 2021 年以来金融系统反腐（`finance-2023` 专题、`stock-crash-2015` 专题）点名的非中管金融干部：政策性银行、国有大行、证监会、银保监会（金融监管总局）、外汇局、地方金控的负责人。

卡写 `content/people/R10.yaml`，案件记录写 `content/falls/R10.yaml`，登记 `research/roster/R10.yaml`；来源 id 以 `r10-` 开头。已有卡但没有案件记录的，只写案件记录，不重写卡。合计 60 人左右。回报里列出应补进 `cnpc-system`、`china-resources`、`finance-2023`、`stock-crash-2015`、`tobacco-system` 等专题 people 的 id。

## U07、U08：现任省级主官的上位之路

用户要求更多转折点。tier 1 已经写完；本轮写现任省级主官（多为 tier 2 卡），他们是下一批进中央的人，最有参照价值。名单从 `content/chiefs/P01.yaml`、`P02.yaml` 取没有 `to` 的条目（现任）；先 Grep `content/turns/` 跳过已有记录的人。

| 批次 | 人物 |
|---|---|
| U07 | 31 个省级单位现任党委书记 |
| U08 | 31 个省级单位现任行政首长（省长、主席、市长） |

做法同 round7.md 与 howto §12：转折点是“事”不是“职务”；`did` 写给普通人看；每批 4–6 位写成 `deep: true`。没有卡的现任主官先建 tier 2 卡（写 `content/people/<批次>.yaml`，登记 `research/roster/<批次>.yaml`），并在回报里列出 chiefs 表应补的 `person` id。记录写 `content/turns/<批次>.yaml`；来源 id 以小写批次号开头。若某人履历太薄、找不到能说明“为什么是这件事”的来源，只写事实陈述的转折点，不编因果。

## PH6：彩色照片（续）

做法同 PH4、PH5（`research/round10.md`），写 `content/photos/PH6.yaml`、`public/photos/`。优先顺序：

1. PH5 没找到的：王文全、徐西盛、李传广、董宏、孙波（中船）。
2. 已整合专题（`content/cases/*.yaml`）的 people 里没有照片的人（先跑脚本列出，约 100 人，多为 R08、C11 新卡）。
3. 其余 tier 2 中的中央委员、上将、中管干部。

低质量照片也保留（#63），但要是彩色、是本人。合计 150–200 张。

## CS6：专题续

写 `content/cases/CS6.yaml`，格式与要求同 CS4、CS5（`research/round11.md`）。

1. `huaxin-ye-jianming`：华信叶简明与胡怀邦、王三运的金融请托链。
2. `tomorrow-group`：明天系肖建华，资本与高层“白手套”，2017 年被带回、2022 年判决、接管与处置。
3. `zhejiang-guangsha`：浙江楼忠福、斯鑫良的政商网络。
4. `sentencing-tiers`：两高 2016 司法解释以后，受贿数额与死缓、无期、十年以上等量刑档次的对应；用站内 `content/falls/*.yaml` 已有的 sentence 和 sum 做统计（写脚本 `research/scripts/CS6-*`，正文里给出数字和口径）。

people、events 只填已有 id；正文点名但没有卡的人在回报里列出（不建卡）。建议新增的事件也在回报里列出。

## 共同要点

- 来源冲突时正文用更权威的来源，另一说法写在同段，以“另说……”起句并附出处（#60）。
- 任何“”里 8 字以上的引文必须逐字出现在所引来源里。先 Grep 已有来源，不要重复登记。
- 传闻（voice: rumor）不能设 fall 或 status。
- 每做 10–15 条跑 `node tools/build-data.ts --batch=<批次>`，修到 0 error。
- 只改自己批次的文件（`content/*/<批次>.yaml`、`research/manifests/<批次>.yaml`、`research/roster/<批次>.yaml`、`sources/text/<小写批次>-*`、`research/scripts/<批次>-*`、`research/wikidata/` 新增文件、PH6 的 `public/photos/` 新增文件），不要 git commit，不要 push。删除文件单独执行。

## 完成时回报

按 §9。另写：新卡与案件记录数；应补进专题 people、events 的 id（按专题 id 列）；chiefs 表应补的 person id（U07、U08）；仍缺的人及原因；事实冲突及处理；建议新增的事件与专题。
