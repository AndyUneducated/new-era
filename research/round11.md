# 第十一轮批次（专题续、事件补齐）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`。本轮与在途的 PH5、R08、I06–I08 并行。用户的选择见 `research/decisions.md` #58–#66。

## CS4：军队专题续

写进 `content/cases/CS4.yaml`，做法同 `round10.md` 的 CS3 一节和 `round8.md` 的 CS1/CS2 一节。**不要写 `lead` 字段**。传闻用 `voices` 并在文字前标“（传闻）”。先读已整合的 `content/cases/CS3.yaml`，不要和它重复（九上将、火箭军、装备系统、张又侠、战区缺席已有专题），需要时用一句话带过并写明见哪篇。

| id | 专题 |
|---|---|
| `pap` | 武警：王建平（2017 年被查、2020 年在看守所死亡的官方说法）、张红兵、王春宁，以及武警领导体制 2018 年改由中央军委统一领导 |
| `political-work` | 军委政治工作部：张阳（2017 年自缢的官方说法）、苗华、钟绍军的位置，政工系统在两轮清洗里的位置 |
| `logistics-audit` | 后勤与审计：谷俊山之后的后勤保障部、联勤保障部队、军委审计署；张林、孙斌等 |
| `mobilization` | 国防动员部与省军区：刘发庆、王东海，以及省军区系统 |

## CS5：地方与金融专题续

写进 `content/cases/CS5.yaml`，做法同上；先读 `content/cases/CS1.yaml`、`CS2.yaml`（周永康网络、西山会、山西、辽宁贿选、金融 2023 起等已有专题），不要重复。

| id | 专题 |
|---|---|
| `nanchong-sichuan` | 南充贿选（2016 年起 477 人被处理）与周永康四川线：李春城、郭永祥、李崇禧、谭力、蒋洁敏之前的四川旧部 |
| `stock-crash-2015` | 2015 股灾与救市后的清查：徐翔、中信证券（程博明、刘威等）、证监会张育军、姚刚、刘新华、庄心一，以及 2015–2019 一行三会（项俊波、陈文辉、杨家才等） |
| `jiangxi-su-rong` | 苏荣与江西：苏荣一家、陈安众、姚木根、赵智勇、李华栋等，苏荣在青海、甘肃任上的旧事 |
| `life-sentences` | 终身监禁：2016 年刑法修正案九施行后判处“死缓、终身监禁”的人（白恩培起），量刑与金额、各案共性 |
| `political-brokers` | 政治掮客与商人：在官员之间牵线、代为运作升迁或案件的商人，如令计划案中的人物、郭文贵与马建、苏荣案的商人、各大案判决里写明的“请托人”；只写有判决、通报或可靠报道的 |

## CS4、CS5 共同要点

- 每篇 sections 4–7 段、editor 1–3 段编者分析（与政治斗争的关系、制度原因），口吻中性，每段有 cites。
- people 只列已有卡的人；缺卡的在回报里列出（之后有补卡批，建完会链回专题）。
- 来源之间有冲突时（生年、日期、任职时间），正文用更权威的来源，另一说法写在同段，以“另说……”起句并附出处（decisions #60）。
- 新来源登记到 `research/manifests/<批次>.yaml`，id 以 `cs4-` / `cs5-` 开头，先 Grep 已有来源。任何“”里 8 字以上的引文必须逐字出现在所引来源里。
- 每写完 2–3 篇跑 `node tools/build-data.ts --batch=<批次>`，修到 0 error。
- 只改自己批次的文件（`content/cases/<批次>.yaml`、`research/manifests/<批次>.yaml`、`sources/text/<小写批次>-*`、`research/scripts/<批次>-*`），不要 git commit，不要 push。删除文件单独执行。

## E10：补齐建议事件

各批在回报里建议了新增事件。写进 `content/events/E10.yaml`，格式照 `content/events/E08.yaml`、`E09.yaml`。先 Grep `content/events/` 确认没有重复（同一天同一件事只建一条）。

来源清单：

1. CS3 的建议（军队）：
   - 2016-07 肃清郭徐流毒影响的提法升级为“全面彻底肃清”
   - 2017-10 刘生杰被中纪委撤下
   - 2023-07 装备发展部公开征集线索
   - 2023-12-27 全国政协撤销吴燕生、刘石泉、王长青的委员资格
   - 2024-04 袁洁被替换
   - 2025-12-24 全国政协撤销曹建国等 8 人
   - 2026-02 罢免周新民、刘仓理、罗琦的全国人大代表（2026-04-17 公报写明原因）
   - 2026 刘国治、赵晓哲从院士名单上消失
   - 2025、2026 年两次八一招待会的缺席
   - 2026-09-23 解放军报“重大政治隐患”社论
2. `research/queue.md` 里“建议新增事件（B09）”“（B05）”“（B06）”三节，逐条核对是否已建。
3. 思想→政策→事件：读已整合的 `content/concepts/*.yaml` 与 `content/concept-more/*.yaml` 里 `policies` 下 `events` 为空、或回报里写了“没有合适事件”的政策（I01–I05），给它们建落地事件；建好后在 `content/concept-more/E10.yaml` 里给对应概念的 `policies` 补上（只追加，不改原条目——如果 ConceptMore 只能整条追加 policies，就追加一条带 events 的新 policy，名称与原条相同时在回报里说明）。
4. 专题里提到、但 `events` 里没有的重大节点：读 `content/cases/CS1.yaml`、`CS2.yaml`、`CS3.yaml` 的正文，挑 10–20 件（立案、开除、宣判、全会公报），建好后在回报里按专题 id 列出事件 id，由维护者补进专题的 `events`。

要点：每条事件有可靠来源；传闻类（只有传闻来源）的事件标 rumor，不设落马状态。`people`、`factions`、`concepts` 字段只填已有 id。新来源登记 `research/manifests/E10.yaml`，id 以 `e10-` 开头。合计 60–80 条就停。每做 15–20 条跑 `node tools/build-data.ts --batch=E10`，修到 0 error。只改自己批次的文件（`content/events/E10.yaml`、`content/concept-more/E10.yaml`、`research/manifests/E10.yaml`、`sources/text/e10-*`、`research/scripts/E10-*`），不要 git commit，不要 push。

## 完成时回报

按 §9。CS4/CS5：篇数、每篇段落数、缺卡的人、建议事件、事实冲突与“另说”的处理。E10：新建事件数（按来源分）、补了哪些概念的 policies、按专题列出的事件 id、未建及原因。
