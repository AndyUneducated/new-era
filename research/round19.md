# 第十九轮批次（用户离开期间继续补数据，#83）

共同规则同 `research/round17.md` 开头：来源登记 `research/manifests/<批次>.yaml`（id 以小写批次号开头），正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`；登记前 Grep `research/manifests/` 防重，已登记的直接引用；旧文件只用 StrReplace 小改（CRLF 文件，不要整文件重写）；不要 git commit/push，不要启动 dev server；每做 5–8 条跑一次构建，修到 0 error、无本批 warning：FX3 用 `node tools/build-data.ts --integrated --warn`，其他批次用 `node tools/build-data.ts --batch=<批次> --warn`（`research/round.yaml` 的 inflight 列着 RL7、PH12、CS11、CS12，`--integrated` 会跳过它们）。

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| FX3 | 队列里的旧错与待核项 | 下文点名的旧文件里的点名字段 |
| RL7 | 案件人物补关系第三批 | `content/relations/RL7.yaml`；`content/people/RL7.yaml`、`research/roster/RL7.yaml`（只在必须建卡时） |
| PH12 | 新卡照片 | `content/photos/PH12.yaml`、`public/photos/` 新增文件 |
| CS11 | 专题：土地指标与拆村并居；三张学者卡 | `content/cases/CS11.yaml`、`content/people/CS11.yaml`、`content/falls/CS11.yaml`、`research/roster/CS11.yaml`、`content/events/CS11.yaml` |
| CS12 | 专题：外逃与追逃 | `content/cases/CS12.yaml`、`content/people/CS12.yaml`、`content/falls/CS12.yaml`、`research/roster/CS12.yaml`、`content/events/CS12.yaml` |

## FX3：旧错与待核项（`research/queue.md`“第十八轮整合”各条）

每项先查原始来源再改；查不实的不改，写进回报。

1. 案件记录 `trigger`：周本顺、王珉、王三运、黄兴国、卢恩光、朱明国、万庆良、金道铭、武长顺、秦玉海现为 `unknown`，CS10 称有来源写明巡视发现线索（`cs10-thepaper-2018-03-06-li-xiaohong`、`cs5-people-2015-04-12-inspection-findings`）。逐人核对来源原文写的是本人，再改 `inspection`；苏荣现为 `report`，原文兼写巡视的，按 schema 能否多值决定（不能多值就不改，写进回报）。
2. `li-xiaohong-xunshi`（黎晓宏）卡：补任职起止、北京市政府秘书长、证监会纪委书记等缺的 positions，核实级别；卸任月份财新 2017-09 / 澎湃 2017-11 冲突，按 #60 处理。
3. `zhang-huawei`（张化为）bio 漏了大唐任职，补一句（有来源）。
4. 王天普（`content/people/R02.yaml` 或 `content/falls/R02.yaml` 里）一处“2015 年接受巡视”，中石化实为 2014 年 11–12 月巡视，按来源改。
5. 事件 `e03-2015-victory-day-troop-cut` 补“首次由将军领队”一句（有来源；领队将领有卡的写进 `people`）。
6. `yue-xin`（岳昕）卡缺 status：按 howto §status 定义和可靠来源补 status、statusNote。
7. 事件 `e14-2019-base-burden-year`、`e03-2016-sixth-plenum-core` 的 `concepts` 加 `three-distinctions`（只在事件正文或来源确实讲到容错纠错时加）。
8. 刑期届满在即的三人：郝卫平（约 2026-10/11）、余远辉（约 2026-10）、谭栖伟（约 2026-09）。查有无出狱、减刑报道；有可靠来源才改 status（刑满出狱标 `retired`，沿用何志平先例），没有就只更新 statusNote 的日期措辞。
9. 张新明 `content/falls/` 记录：界面新闻同文既称“四年六个月”又称 2016 年判 13 年。找判决原文或另一可靠来源厘清，按 #60 处理。

## RL7：案件人物补关系第三批

44 篇专题的人物中仍有 215 人没有任何关系，名单 `research/lists/R19-case-people-no-relation.txt`（第 5 列是所在专题）。做法同 K09、RL5（`content/relations/RL5.yaml`）。

1. 先写 CS10 回报的四组：张化为–刘立宪（2015 第十一巡视组）、黎晓宏–董宏（合著）、董宏–王岐山（媒体称 protege，标注来源、按原文措辞定 kind 与 `rumor`）、李文喜/薛恒/王大伟先后任辽宁公安厅长（colleague，a 是继任者）。
2. 再按名单逐人查来源（`sources/text/`）和官方简历：前后任、主持工作、正职搭档算 colleague（a 是继任者）；patron 只在原文写明提携时用；同案、行贿不算关系；传闻标 `rumor: true`；`quote` 须逐字出现在所引来源里。写前 Grep `content/relations/` 防重（同一对人、同一 kind 只能一条）。
3. 另一方没卡的：省部级以上可在 `content/people/RL7.yaml` 建 tier 2 卡（howto §4，先 Grep `content/people/`、`research/roster/`），厅局级只在与已有案件直接相关时建（#65）。
4. 学者、评论者、只有同案的行贿人、异见者不必勉强。

目标：新关系 60–120 条，215 人降到 150 以下。

## PH12：新卡照片

`research/lists/R19-no-photo.txt`：134 人缺照片（PH11 之后多为 K09、CS9、CS10 新建的卡，另有 PH11 也没找到的将领）。做法同 PH10、PH11（`content/photos/PH11.yaml`）。先看 `content/photos/` 与 PH11 回报里已标“找不到”的人，不重复查。

1. 官员：省市政府、人大官网领导页，新华、人民网任免与会议图片，央企官网领导班子。
2. 将领：央视、解放军报、中国军网会议与授衔画面，图说写明位置才裁切；人大、政协会议代表照。
3. 商人、亲属：财新、澎湃、21 世纪经济报道、公司官网、年报管理层照片。
4. 必须能认出是本人，彩色才收，低质量彩照保留（#62）；认不准的宁可缺；身份靠推断的不收。

目标：收 30–60 人。

## CS11：土地指标与拆村并居

做法同 CS9、CS10（`content/cases/CS10.yaml`、howto §13）。专题 `people` 全部有卡（缺的在 CS11 文件里建，先 Grep 防重），`events` 只用已有或本批新建的事件 id（新事件不超过 8 条，先 Grep `content/events/` 防重）。

1. **土地指标与拆村并居**（id `land-quota`）：城乡建设用地增减挂钩从 2006 年试点到 2018 年节余指标跨省调剂，地方“拆村并居”“被上楼”（2010 年前后山东、河北、江苏等地，2020 年山东合村并居），国发〔2010〕47 号与 2020 年中央叫停，土地财政与指标交易的激励。E16 已建概念 `land-linkage` 与事件（2006 首批试点、国发〔2010〕47 号、2018 跨省调剂、2020 山东合村并居），直接挂。官方、学者、媒体三方说法分写；编者分析单列 `editor`。只写有来源的人与数字；与此相关的落马官员（国土系统、地方主官）有卡且来源写明关联的才进 `people`。
2. 学者卡三张（tier 2，`roles: [scholar]`，先 Grep 防重）：周黎安（北大光华，晋升锦标赛）、陈锡文（中央农办原主任，有官职，roles 加相应项）、贺雪峰（武汉大学，乡村治理、反对合村并居）。卡上写有来源的生年、任职、代表观点；E16 概念 `promotion-tournament`、`land-linkage` 已提到他们，回报里写明哪些概念、事件应挂这几张卡（不要改 E16 文件）。

## CS12：外逃与追逃

做法同上。

1. **外逃与追逃**（id `fugitives-skynet`）：2014 年“猎狐行动”、2015 年起“天网行动”与“百名红通”名单（2015-04 公布）、追回人数与官方统计口径、典型案例（杨秀珠、李华波、乔建军、许超凡、程慕阳、闫永明、黄玉荣之类，以有卡、有来源为准）、劝返与引渡、《监察法》《国际刑事司法协助法》（2018）与缺席审判（2018 刑诉法修订，程三昌案）。先 Grep `content/people/`、`content/falls/` 里 outcome 为 fled、statusNote 含“外逃”的已有卡，构建出的 `public/data/db.json` 可用脚本筛。只用本站数据能算出的数字写明口径；官方统计与外媒、人权组织说法分写（遣返中的人权争议进 voices）。
2. 百名红通里省部级、厅局级与已有案件相关、来源足的人可建卡（#65），商人、基层人员只写在正文里。

## 完成时回报

按 howto §9：新建条目数；改了哪些旧文件哪些字段；仍缺的及原因；事实冲突及处理；发现的旧错（不要自己改不在上表里的文件）；建议新增的事件、专题、概念。
