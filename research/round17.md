# 第十七轮批次（M10–M13、M6 已收尾，用户离开期间继续补数据，#83）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`、`research/round15.md`“共同要点”。来源登记 `research/manifests/<批次>.yaml`，id 以小写批次号开头，正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`。登记前 Grep `research/manifests/` 看同一 URL 是否已登记，已登记的直接引用。不要 git commit，不要 push，不要启动 dev server。每做 5–8 条跑一次 `node tools/build-data.ts --batch=<批次>`，修到 0 error、没有本批的 warning。

旧文件只用 StrReplace 小改（CRLF 文件，不要整文件重写）。BD2 与 C16 会同时改旧人物文件：BD2 只碰 `born`、`birthplace`、`verify` 三个字段（刘宁一张卡例外），C16 只碰 `fall` 字段与 `content/falls/` 里的案件记录，互不越界。

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| BD2 | 出生年月第二批 | 旧人物卡的 `born`、`birthplace`、`verify`；刘宁卡 |
| C16 | 审查中、已开除者的后续（起诉、判决） | 旧人物卡的 `fall`；`content/falls/*.yaml` 里对应记录 |
| K09 | 案件人物前后任建卡、补关系第二批 | `content/people/K09.yaml`、`research/roster/K09.yaml`、`content/relations/RL5.yaml` |
| CS9 | 两篇专题 | `content/cases/CS9.yaml`、`content/people/CS9.yaml`、`content/falls/CS9.yaml`、`research/roster/CS9.yaml`、`content/events/CS9.yaml` |
| I12 | 概念与事件 | `content/concepts/I12.yaml`、`content/events/I12.yaml` |
| PH11 | 剩余照片 | `content/photos/PH11.yaml`、`public/photos/` 新增文件 |

## BD2：出生年月第二批（M10 未达标项）

名单 `research/lists/R17-no-born.txt`：157 人缺出生年月（其中 154 人已标 `verify: true`）。BD1 回报搜索引擎被封，本批换来源：

1. 官方简历页（各省政府、人大、政协官网领导介绍；国资委、央企官网领导班子；高校官网）、人民网“中国共产党新闻网·领导人资料库”、中国经济网“地方党政领导人物库”、新华网任免简历、维基百科与 Wikidata（`research/wikidata/` 已有的 json 先查）、判决书与通报里写的出生年月。
2. 找到的写 `born`（只到可靠来源写到的精度，如 `1962-05`），来源加进该卡 `cites`，并删去 `verify: true`（若该卡再无其他缺项）。来源冲突时正文用更权威的，另一说在 `statusNote` 或 bio 里写“另说……”附出处（#60）。
3. 顺带核两处：怀进鹏出生地（卡上写哈尔滨，新华称山东济南人，可能是籍贯与出生地之别——都有来源就分写 `birthplace` 与 `origin`）；刘宁卡写“现任河南人大主任”，新华 2026-09 只说卸任河南省委书记，按最新可靠来源改 bio、positions、status。
4. 异见者、家属、商人查不到的不勉强。

目标：缺出生年月从 157 降到 100 以下（理想是 60）。

## C16：审查中、已开除者的后续

名单 `research/lists/R17-pending-cases.txt`：299 条案件记录 outcome 仍为 `probe`（审查中）或 `expelled`（已开除），按最后一步日期排序，最早的 2013 年。许多人早已起诉、判决而没补上。

1. 逐人查：之后有无移送起诉、开庭、一审、二审判决（法院网、最高检、新华、人民网、澎湃、财新；12309 镜像见 C15 的来源）。体制外人物（sys `other`、grade `none`）跳过。
2. 有判决的：人物卡 `fall.steps` 补起诉、开庭、判决各步（每步 cite），案件记录补 `sentence`、`charges`、`amount`（法院认定数），`outcome` 由构建从步骤读出的就不手写，需要手写的按 schema（`src/data/schema.ts` OUTCOMES）；判决报道写明自首、立功、退赃、认罪悔罪的补 `plea`（格式见 R12 改过的记录，`content/falls/R11.yaml` 等）。
3. 查不到后续的不改；军事法院判决通常不公开，跳过。

目标：补 80 人以上的后续，优先 2013–2022 年立案的。

## K09：案件人物的前后任、搭档建卡并补关系（第二批）

K08、RL3、RL4 之后，40 篇专题的 668 人中 497 人有关系，仍缺 171 人，名单 `research/lists/R17-case-people-no-relation.txt`（第 5 列是所在专题）。

1. 查每人的来源（`sources/text/`）和官方简历，找出写明的前任、继任、正职搭档、提拔者；没卡的建 tier 2 卡（howto §4，省部级以上；厅局级只在与已有案件直接相关时建，#65），例如 RL2 提到而仍无卡的刘晓榕。建前先 Grep `content/people/`、`research/roster/`。
2. 关系写 `content/relations/RL5.yaml`，格式同 `content/relations/RL3.yaml`：前后任、主持工作、正职搭档算 colleague（a 是继任者）；patron 只在原文写明提携时用；同案、行贿不算关系；传闻标 `rumor: true`；`quote` 须逐字出现在所引来源里。写前 Grep `content/relations/` 防重（同一对人、同一 kind 只能一条）。
3. 金融证监中层、只有同案的行贿人、评论者不必勉强。

目标：新关系 60–120 条，缺关系的 171 人降到 110 以下。

## CS9：两篇专题

做法同 CS7、CS8（`content/cases/CS8.yaml`、howto §13）。专题 `people` 全部有卡，`events` 只用已有或本批新建的事件 id（新事件不超过 8 条，先 Grep `content/events/` 防重）。

1. **2026 年中央委员落马群像**（id `cc20-fallen-2026`）：二十届中央委员、候补委员在 2026 年被查、被开除、被罢免或缺席全会的人，串起五中全会前后的递补与处分。先从已有卡里筛（positions 有第二十届中央委员或候补委员，落马日期在 2026 年；构建出的 `public/data/db.json` 可用脚本筛），讲清时间顺序、官方措辞、所在系统（军队、部委、地方、央企），与十八届、十九届同期的比较只在有来源时写。编者分析单列 `editor`，传闻只进 voices。
2. **投案自首与量刑**（id `surrender-sentencing`）：R12 已从判决报道读出自首、立功、退赃、认罪认罚（`plea` 字段）。专题讲主动投案的典型（秦光荣等）、“认罪认罚从宽”入法后的变化、法院如何写从轻情节，以及有情节者与无情节者刑期的对照（只用本站数据能算出的数字，写明口径）。与 `sentencing-tiers` 分工：那篇讲数额档次，这篇讲情节。
3. 附带核：何松 he-song-pla、温刚 wen-gang、余剑锋 yu-jianfeng、张忠阳 zhang-zhongyang 是否属于 `soe-chiefs-2024`（军工、能源央企负责人 2024–2026 年连串去职）。不要改 CS8 文件，把结论和来源写进回报。

## I12：概念与事件

先 Grep `content/concepts/`、`content/concept-more/`、`content/events/` 防重，格式同 `content/concepts/I11.yaml`。

1. 概念：新农村建设（2005 十六届五中全会）、积极财政政策（1998）、2009 年十大产业振兴规划、自主创新（2006 科技大会、建设创新型国家）、反内卷（2024 起的“内卷式竞争”整治）、习近平关于党的建设的重要思想（提出时间以来源为准）、正确政绩观。能写长条目的写分节正文，挂上已有事件与人物。
2. 事件（`content/events/I12.yaml`，已有的不重建）：1986 年申请恢复关贸总协定缔约国地位、2001 年七一讲话、2005 年省部级干部构建社会主义和谐社会专题研讨班、2013–2014 党的群众路线教育实践活动，以及上面概念需要的起止事件。

目标：概念 6–7 个，事件 6–12 条。

## PH11：剩余照片

`research/lists/R16-photo-next2.txt`：PH10 之后仍缺的 70 人（将领 29，多只有集体照或同名；官员金融 10；商人亲属掮客 16；维权异见 7；只有黑白 4）。做法同 PH10（`content/photos/PH10.yaml`）。

1. 将领：央视、解放军报、中国军网会议与授衔画面，图说写明位置才裁切；人大、政协会议代表照。
2. 商人、亲属：财新、澎湃、21 世纪经济报道、公司官网、上市公司年报里的管理层照片。
3. 维权异见：BBC、VOA、RFA、DW、美联社、维基共享资源。
4. 必须能认出是本人，彩色才收，低质量彩照保留（#62）；认不准的宁可缺；身份靠推断的不收（PH10 删过 4 张）。

目标：收 15–35 人。

## 完成时回报

按 howto §9。另写：新建条目数；仍缺的及原因；事实冲突及处理；发现的旧错（不要自己改不在上表里的文件）；建议新增的事件、专题、概念。
