# 第十四轮批次（补缺：概念、政策连线、关系、照片、案件记录、缺卡、事件、上位之路）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`。用户的选择见 `research/decisions.md` #58–#66。用户 2026-10-19 要求“数据、功能有缺的继续补”。本轮补的是 v1.0 对照（`research/audit-v1.md`）与覆盖统计里还差的部分：概念 142（目标 150）、68 个概念没有 policies、只有 410 人出现在人物关系里、专题人物 162 人无照片、84 名落马者没有案件记录。

八批并行，**分工防撞**：

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| I11 | 新概念 | `content/concepts/I11.yaml`、`content/concept-more/I11.yaml` |
| LK3 | 已有概念的 policies | `content/concept-more/LK3.yaml` |
| E13 | 新事件 | `content/events/E13.yaml`、`content/concept-more/E13.yaml` |
| C13 | 缺卡的人 | `content/people/C13.yaml`、`content/falls/C13.yaml`、`research/roster/C13.yaml` |
| R11 | 案件记录与结局 | `content/falls/R11.yaml`；另可改下面列明的旧文件 |
| RL1 | 人物关系 | `content/relations/RL1.yaml` |
| PH7 | 照片 | `content/photos/PH7.yaml`、`public/photos/` 新增文件 |
| U09 | 上位之路 | `content/turns/U09.yaml` |

各批来源登记 `research/manifests/<批次>.yaml`，id 以小写批次号开头，正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`。同一人只建一张卡，先 Grep `content/people/`；同一天同一件事只建一条事件，先 Grep `content/events/`。

## I11：新概念

做法同 I05–I08（`research/round9.md`、howto §14），参照 `content/concepts/I08.yaml`。I10 当时中止，未留文件。先 Grep `content/concepts/` 确认不重复（新型举国体制、铸牢中华民族共同体意识、自我革命已有，只能在 `content/concept-more/I11.yaml` 补字段）。

| 来自 | 概念 |
|---|---|
| I05 | 大党独有难题；历史周期率与窑洞对（“第二个答案”）；四个伟大；新安全格局；人类文明新形态；中华民族现代文明；新型国际关系；正确义利观 |
| I07 | 新农村建设；中部崛起；一号文件；积极财政政策（1998）；2009 产业振兴规划；自主创新（外界批评放 voices） |
| I08（论争，kind: debate，2–4 方） | 郎顾之争；七不讲；去政治化（马戎）；北京共识（雷默）与华盛顿共识；反内卷 |
| I08（formula） | 英雄烈士保护法；民营经济促进法 |
| 其他回报 | 两面人；天网与猎狐（fox-hunt）；南方谈话（southern-tour）；鸟笼经济（birdcage-economy） |

每条有出处（官方原文先查 `content/corpus` 和已有来源），lists 逐字核对；能落到政策的写 policies（events 只用已有事件 id，没有的在回报里建议）。论争各方要有当事人原文。who/by 只用已有人物 id，缺卡的在回报里列出。合计 18–22 条。

## LK3：给没有 policies 的概念补政策与事件

现有 142 个概念里有 68 个没有 policies，思想落地图（`#/ideas/chain`）对它们是空的。先写脚本 `research/scripts/LK3-*` 列出这 68 个概念（读法照 `tools/build/load.ts` 的 loadAll）。逐个判断：

1. 有明确落地文件、会议、法律、运动的，在 `content/concept-more/LK3.yaml` 追加 policies（格式见 `src/data/schema.ts` 的 ConceptMoreSchema 与已有 `content/concept-more/E11.yaml`）：date、name、text、cite，events 填站内已有事件 id（Grep `content/events/`）。
2. 只是提法、思潮、论争，没有可指认的政策的，不硬写，在回报里列为“无政策”。
3. 有政策但站内没有事件的，policies 照写（events 留空），回报里列出建议事件。

同名同日的政策会在构建时合并，名字照抄已有条目即可把事件挂上去。不碰 I11 新建的概念。合计至少给 40 个概念写上 policies。

## E13：建议事件与薄弱年份

写 `content/events/E13.yaml`，格式照 `content/events/E11.yaml`、`E12.yaml`。

1. CS6 建议：2018-10-11 王三运受审；2019-05-24 包商银行被接管；2019-11-15 上海华信破产受理；2020-04-30 蒙商银行开业；2020-07-17 接管明天系 6 家机构；2021-02-07 包商银行破产；2022-08-19 肖建华判决；2014-12-27 楼忠福被带走；2016-12-13 斯鑫良判决。
2. I07 建议里 E11 没建的：1986 复关申请、2001 七一讲话、2005 省部级和谐社会专题研讨班、2013–2014 群众路线教育实践活动（先 Grep 确认）。
3. 事件偏少的年份：2000（8 条）、2001（12）、2002（4）、2013（23）。补这些年的重要事件，九条泳道都要顾到（power、purge、army、ideo、econ、society、ethnic、hkmt、foreign，另有 folk 民间话语）。

能落到已有概念的，在 `content/concept-more/E13.yaml` 追加 policies（带 events）。`people`、`factions`、`concepts` 只填已有 id。回报里按专题 id（`huaxin-ye-jianming`、`tomorrow-group`、`zhejiang-guangsha` 等）列出应补进 events 的新事件 id。合计 35–45 条。

## C13：专题与上位之路里缺卡的人

为下列没有卡的人建档案卡（tier 2，howto §4），落马者同时写案件记录 `content/falls/C13.yaml`（§10）。先 Grep `content/people/` 确认没有卡。

1. CS6 华信：李光金、王宏源、杨庆龙、何志平、叶选宁（赖昌星若 CS6 正文点名也收）。
2. CS6 明天系：周虹文、邓家贵、焦伟、周学东。
3. CS6 广厦：楼明、楼江跃、斯力、金惠芳、吴英、吴坚。
4. U07、U08 建议：付建华、赵胜轩、郑维敏、韩立平、王仲田、卢彦、龚正、聂春玉（已有卡的跳过）。
5. 其余：写脚本 `research/scripts/C13-*` 把 `content/cases/*.yaml` 正文里点名、但 `content/people/` 没有卡的人名列出来（R08、C11、C12、R09 已做过一轮，剩下的多是零星点名），能用来源确认身份的收。

每张卡写清与哪个专题相连。卡写 `content/people/C13.yaml`，登记 `research/roster/C13.yaml`。回报里按专题 id 列出应补进 people 的新卡 id。合计 50 人左右。

## R11：案件记录补全与结局更新

1. 有落马步骤（卡里有 `fall`）但没有案件记录的 84 人：先写脚本 `research/scripts/R11-*` 列出（读法照 `research/scripts/CS6-tiers.ts`），为他们写案件记录 `content/falls/R11.yaml`（§10，sys、grade、trigger、politics 必填，notice、amount、with 能写就写）。
2. 有案件记录但缺 `trigger` 的 29 条：在原文件里补 trigger（只加这一字段）。
3. 第十三轮回报里结局待补的人（`research/queue.md` “第十三轮整合”一节）：陈共炎、陈爽、刘峰、张建军、任海川、王筠权；冯建龙、高强、沈荣勤、李工、张旭、张松柏、孔繁波、何泽蜀、郭三野、甘成久；高飞二审；吴国舫判决；李亚力、孙平、丛文景、丁雪峰、刘俊林、陈争鸣。查到新的判决或通报的，在他们卡的 `fall` 里加步骤、在案件记录里补 sentence、amount。

为第 2、3 项，本批可以改 `content/falls/*.yaml` 和 `content/people/R09.yaml`、`R10.yaml`、`C12.yaml` 里这些人的条目，别的人和别的字段不动。

## RL1：人物关系

现在只有 410 人出现在人物关系里（howto §6，`content/relations/*.yaml`）。优先：

1. 没有任何关系的完整传记（31 人）：吴邦国、吴官正、贺国强、张德江、彭丽媛、刘云山、张高丽、王沪宁、秦刚、王毅、刘鹤、刘晓波、许志永、马云、任志强、黎智英、林郑月娥、艾未未、李文亮、杨洁篪、苏荣、鲁炜、赖小民、许其亮、任正非、许家印、尹力、李作成、俞可平、林毅夫、郑永年。每人 1–4 条。
2. 案件专题（`content/cases/*.yaml`）里的秘书、提携、姻亲、对立关系：判决书、通报、专题正文写明的“秘书”“提拔”“妻子/弟弟/儿子”“举报”“对抗”。同案、行贿不算 relation（那是案件记录的 `with`），除非来源写明提携或秘书关系。
3. 派系页核心成员之间（`content/factions/*.yaml` 的 core）缺的提携、秘书关系。

colleague（共事）只收来源特别强调的搭档（例如“搭班子”），普通同事由职务数据自动计算，不要录。a、b 只用已有人物 id。合计 180–220 条。

## PH7：彩色照片（续）

做法同 PH4–PH6（`research/round10.md`），写 `content/photos/PH7.yaml`、`public/photos/`。优先顺序：

1. 完整传记缺照片的三人：俞可平、林毅夫、郑永年。
2. 案件专题 people 里没有照片的人（约 160 人，先写脚本列出）；PH6 回报“百科无图、只有同名者、只有黑白”的人（`research/queue.md` 第十三轮整合 PH6 一条）只在找到新来源时收。
3. 其余 tier 2 中的中央委员、上将、中管干部、现任省部级。

低质量照片也保留（#63），但要是彩色、是本人。合计 150–200 张。

## U09：上位之路续

做法同 round7.md、howto §12，参照 `content/turns/U07.yaml`。先 Grep `content/turns/` 跳过已有记录的人。

1. 完整传记里没有转折点的学者三人：俞可平（中央编译局）、林毅夫（世界银行首席经济学家）、郑永年（体制外，影响力来自哪里）。route 用 scholar 等已有枚举。
2. 现任国务院组成部门部长、主任，以及中央和国家机关主要部门的现任负责人（不是政治局委员的）。没有卡的先建 tier 2 卡，写在 `content/people/U09.yaml`，登记 `research/roster/U09.yaml`。

转折点是“事”不是“职务”；`did` 写给普通人看；4–6 位写成 `deep: true`。履历太薄、找不到能说明“为什么是这件事”的来源的，只写事实陈述，不编因果。route 枚举不够用的，在回报里建议，不改 schema。合计 30 人左右。

## 追加：E14 与 C14（LK3、I11 回报后）

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| E14 | LK3、I11 建议的事件 | `content/events/E14.yaml`、`content/concept-more/E14.yaml` |
| C14 | I11 概念里缺卡的思想人物 | `content/people/C14.yaml`、`research/roster/C14.yaml`、`content/concept-more/C14.yaml` |

**E14**：把 `research/queue.md`“第十四轮整合”一节里 LK3、I11 两条列出的建议事件建出来（约 34 条），格式照 `content/events/E13.yaml`。先 Grep `content/events/` 确认没有建过。建好后在 `content/concept-more/E14.yaml` 给对应概念的 policies 挂上事件：LK3 已写好 policy、只是 events 为空的，照抄已有 policy 的 date 和 name（构建时同日同名合并），只填 events；I11 的新概念（`content/concepts/I11.yaml`）同理。来源 id 以 `e14-` 开头，LK3、I11 回报里给出的已有来源优先。

**C14**：为 I11 新概念正文点名、但没有卡的人建 tier 2 卡：马戎、乔舒亚·库珀·雷默、黄炎培、黄克诚、胡联合、杨瑞龙、周放生、严友松、汪文斌、赵文欣、盖保德、张文中、约翰·威廉森、斯蒂格利茨、葛振林、宋学义（毛泽东先 Grep，若真无卡也建）。每张卡写清身份、与哪个概念相连，学者引本人文章或访谈。建好后在 `content/concept-more/C14.yaml` 把新卡 id 写进对应概念的 `by`（论争的各方 `sides` 难以追加的，在回报里列出）。来源 id 以 `c14-` 开头。

## 共同要点

- 来源冲突时正文用更权威的来源，另一说法写在同段，以“另说……”起句并附出处（#60）。
- 任何“”里 8 字以上的引文必须逐字出现在所引来源里。先 Grep 已有来源，不要重复登记。
- 传闻（voice: rumor）不能设 fall 或 status。
- 每做 10–15 条跑 `node tools/build-data.ts --batch=<批次>`，修到 0 error。
- 只改上表列出的文件（加上自己的 manifests、roster、`sources/text/<小写批次>-*`、`research/scripts/<批次>-*`、`research/wikidata/` 新增文件），不要 git commit，不要 push。删除文件单独执行。

## 完成时回报

按 §9。另写：新建条目数；应补进专题 people、events 的 id（按专题 id 列）；仍缺的及原因；事实冲突及处理；建议新增的事件、概念、专题。
