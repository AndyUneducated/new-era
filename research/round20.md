# 第二十轮批次（用户离开期间继续补数据，#83）

共同规则同 `research/round19.md` 开头：来源登记 `research/manifests/<批次>.yaml`（id 以小写批次号开头），正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`；登记前 Grep `research/manifests/` 防重，已登记的直接引用；旧文件只用 StrReplace 小改（CRLF 文件，不要整文件重写）；不要 git commit/push，不要启动 dev server。每做 5–8 条跑一次构建，修到 0 error、无本批 warning：FX4 用 `node tools/build-data.ts --integrated --warn`，K10、CS13 用 `node tools/build-data.ts --batch=<批次> --warn`（`research/round.yaml` 的 inflight 列着 K10、CS13，`--integrated` 会跳过它们）。

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| FX4 | 第十九轮留下的小待办 | 下文点名的旧文件里的点名字段 |
| K10 | 央企一把手等建卡，补因缺卡写不了的关系 | `content/people/K10.yaml`、`research/roster/K10.yaml`、`content/relations/RL8.yaml` |
| CS13 | 两篇专题：秦岭违建别墅、统计造假 | `content/cases/CS13.yaml`、`content/people/CS13.yaml`、`content/falls/CS13.yaml`、`research/roster/CS13.yaml`、`content/events/CS13.yaml` |

## FX4：小待办（`research/queue.md`“第十九轮整合”各条）

每项先查原始来源再改；查不实的不改，写进回报。

1. 概念 `fox-hunt`（Grep `content/concepts/` 找文件）：policies 或相关字段挂事件 `cs12-2014-zhuitaoban-established`、`cs12-2018-judicial-assistance-law`、`cs12-2025-asia-red-notices-cleared`（按该概念已有结构，只加不删）。
2. isms 里的 `chongqing-model`（Grep `content/` 找文件）：如有事件字段，挂 `cs11-2008-chongqing-dipiao`。
3. 概念 `promotion-tournament`（`content/concepts/E16.yaml`）：在“周黎安的修正”一节或 voices 补一句周黎安等 2020 年 *Review of Economics and Statistics* 城市领导人晋升激励与城市空间扩张的研究（来源 `cs11-pku-lmeqf-zhou-lian`，先读原文确认写法）。
4. `research/manifests/C13.yaml` 里 `c13-jiemian-2020-08-05-zhou-xuedong` 的 `date`：正文写“11月13日银保监会核准”，按正文与网页实际发布日期改。
5. 郝卫平（Grep `content/people/` 找卡）：登记财新 2016-10-21 报道（不服一审、上诉北京高院），fall 步骤或 statusNote 写明已上诉；查二审结果，查到就补。
6. 金融专题（`finance-2023` 或其他讲银行系统的专题，看正文是否合适）可在 `events` 挂 `cs12-2018-xu-chaofan-repatriated`；不合适就不挂。
7. 刘建超 `liu-jianchao`：找可靠来源写明他任中央追逃办负责人、中央纪委国际合作局局长的任期，补 positions；找不到不补。
8. 怀进鹏出生地（卡写哈尔滨，新华称山东济南人）：BD2 已处理的话核对一下，未处理就按 #60 分写 `birthplace` 与籍贯。

## K10：央企一把手等建卡，补关系

RL7 回报：不少案件人物写不了关系，是因为同期一把手没有卡。名单 `research/lists/R19-case-people-no-relation.txt`（RL7 之后仍缺的 134 人；先用 `public/data/db.json` 重算一遍现状）。

1. 先给这些人建 tier 2 卡（howto §4，均为省部级以上；建前 Grep `content/people/`、`research/roster/`）：傅成玉（中海油、中石化）、宁高宁（华润、中粮、中化）、舒印彪（国家电网、华能）、熊群力（中国电科）、常振明（中信）、王群（湖北？以来源为准，陈柏槐的提携者）、张建龙（国家林草局，李春良的上级）。
2. 再看名单里其他人：同期一把手、正职搭档、前后任是省部级而无卡的，按需建卡（每张卡都要有官方简历或可靠来源的 positions、cites）。厅局级只在与已有案件直接相关时建（#65）。目标新卡 10–25 张。
3. 关系写 `content/relations/RL8.yaml`，格式同 `content/relations/RL7.yaml`：前后任、主持工作、正职搭档算 colleague（a 是继任者或正职）；patron 只在原文写明提携时用；同案、行贿不算关系；传闻标 `rumor: true`；`quote` 须逐字出现在所引来源里。写前 Grep `content/relations/` 防重（同一对人、同一 kind 只能一条）。新卡的人与已有卡之间写得出的关系也可以写。
4. 金融系统司局级、军队将领：找“领导班子名单”“分工通知”这类能同时点名正副职、写明时间的来源，写得出就写。

目标：新关系 50–100 条，名单 134 人降到 100 以下。

## CS13：两篇专题

做法同 CS11、CS12（`content/cases/CS12.yaml`、howto §13）。专题 `people` 全部有卡（缺的在 CS13 文件里建，先 Grep 防重，厅局级按 #65），`events` 只用已有或本批新建的事件 id（两篇合计新事件不超过 10 条，先 Grep `content/events/` 防重）。

1. **秦岭违建别墅**（id `qinling-villas`）：2014 年起习近平六次批示、2018 年 7 月中央专项整治（已有事件“秦岭违建别墅专项整治”，Grep 找 id）、1194 栋别墅拆除与没收、魏民洲、钱引安、赵正永、冯新柱等人的处理、陕西“系统性腐败”的官方说法、“讲政治”“政治问题”的定性，以及 2019 年 1 月央视专题片。先 Grep `content/` 里“秦岭”已有的卡和事件。官方、媒体、学者说法分写；编者分析单列 `editor`。
2. **统计造假**（id `statistics-fraud`）：2017 年起辽宁、内蒙古、天津滨海新区承认经济数据注水，2017 年中办国办《关于深化统计管理体制改革提高统计数据真实性的意见》、《防范和惩治统计造假、弄虚作假督察工作规定》，国家统计局局长王保安落马（2016），2023–2024 年统计督察与通报，与“晋升锦标赛”概念（`promotion-tournament`）的关系（只写有来源的说法）。先 Grep `content/` 里“统计造假”“数据造假”已有的卡和事件。

## 完成时回报

按 howto §9：新建条目数；改了哪些旧文件哪些字段；仍缺的及原因；事实冲突及处理；发现的旧错（不要自己改不在上表里的文件）；建议新增的事件、专题、概念，以及建议挂接的 id。
