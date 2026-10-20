# 第十五轮批次（M10 数据补齐、M11 时事跟进、M12 schema 扩展、M13 海军空军）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`。用户 2026-10-19 晚的选择见 `research/decisions.md` #67–#85，里程碑见 `research/milestones.md` M10–M13。名单已由 `research/scripts/R15-lists.mjs` 从构建结果导出到 `research/lists/R15-*.txt`（制表符分隔：id、姓名、状态、头衔、附加信息），直接用，不必重写脚本。

八批并行，**分工防撞**：

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| RL2 | 案件人物的关系 | `content/relations/RL2.yaml` |
| PH8 | 照片 | `content/photos/PH8.yaml`、`public/photos/` 新增文件 |
| BD1 | 出生年月、职务、待核日期 | 旧人物文件里所列人物的 `born`、`birthplace`、`positions`、`cites`、`verify` 字段 |
| E15 | 2026 年事件；四项基本原则 | `content/events/E15.yaml`、`content/concept-more/E15.yaml` |
| C15 | 2026 年落马者建卡与结局更新 | `content/people/C15.yaml`、`content/falls/C15.yaml`、`research/roster/C15.yaml`；旧卡的 `fall`、`status`、`statusNote` |
| R12 | 体制外人物改判、量刑情节补缺 | 旧 `content/falls/*.yaml` 里所列人物的 `politics`、`trigger`、`plea` 字段 |
| U10 | 上位之路重新归类与新路线 | 旧 `content/turns/*.yaml` 的 `routes` 字段；新记录写 `content/turns/U10.yaml`，新卡 `content/people/U10.yaml`、`research/roster/U10.yaml` |
| CS7 | 海军、空军专题 | `content/cases/CS7.yaml`、`content/people/CS7.yaml`、`content/falls/CS7.yaml`、`research/roster/CS7.yaml`、`content/events/CS7.yaml` |

各批来源登记 `research/manifests/<批次>.yaml`，id 以小写批次号开头，正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`。同一人只建一张卡：先 Grep `content/people/` 和 `research/roster/`（本轮 C15、CS7、U10 都可能建卡，建前互查对方文件）。同一天同一件事只建一条事件。

**改旧文件的规则（BD1、C15、R12、U10）：** 几批可能同时改同一个旧文件。只用 StrReplace 做小范围替换，每次替换前重新读该段；不要用 Write 重写整个旧文件，不要改所列字段以外的内容，不要动别人的条目。

## RL2：案件专题人物的关系（M10）

`research/lists/R15-case-people-no-relation.txt` 是案件专题（`content/cases/*.yaml`）里还没有任何人物关系的 395 人，第五列是所在专题。做法同 RL1（`content/relations/RL1.yaml`，howto §6）：

1. 先读每个专题正文和所引来源（`sources/text/`），判决书、通报、专题正文写明的“秘书”“提拔/提携”“妻子/弟弟/儿子/情妇”“举报”“对抗”。
2. 同案、行贿不算 relation（那是案件记录的 `with`），除非来源写明提携或秘书关系。colleague 只收来源特别强调的搭档。
3. a、b 只用已有人物 id；关系的另一端也可以是已有关系的人。

目标：这 395 人里至少 280 人有关系，合计 300–380 条。每做 40 条跑一次 `--batch=RL2`。

## PH8：彩色照片（M10）

做法同 PH4–PH7（`research/round10.md`、howto §11），写 `content/photos/PH8.yaml`、`public/photos/`。名单 `research/lists/R15-no-photo.txt` 已按优先级排好（第五列 rank0 案件专题人物、rank1 有案件记录、rank2 其他落马/去世/流亡、rank3 中委将领部长省级、rank4 其余）：

1. PH7 已核对为本人但未收的 tier 2 约 70 人（`research/photo-PH7.md`）。
2. rank0–rank2：PH7 回报“百科无图、只有同名、只有黑白”的人只在找到新来源时收。
3. rank3，然后 rank4。

低质量照片也保留（#62），但要彩色、是本人；认不准的宁可缺。目标：全站 1623 → 1800 以上，即本批 180–220 张。

## BD1：出生年月、职务、待核日期（M10）

1. `research/lists/R15-no-born.txt`（233 人）：查官方简历、百科、新华社任免报道，补 `born`（能到月就到月），顺带补缺的 `birthplace`，所引来源加进该卡 `cites`。Wikidata 有出生日期的构建时会自动用，先查 `research/wikidata/` 跳过已有的。查不到的，在该卡加 `verify: true`。
2. `research/lists/R15-no-positions.txt`（76 人）：补 `positions`（格式同同文件其他卡），至少写落马、出名或入选时的职务，每条有 cite。查不到的加 `verify: true`。
3. 第十四轮 U09 未能核实的四人：兰佛安 2023-10-24 任命、贺荣 2023-02 起职、怀进鹏各任职日期、张军首次任职（`research/queue.md`“第十四轮整合”一节）。按官方简历改。

只改这些卡的上述字段。目标：缺出生年月 ≤ 60 人，没有职务记录 ≤ 10 人。

## E15：2026 年事件与四项基本原则（M11）

1. 最新事件是 2026-10-13 黄奇帆被查。补 2026 年 1 月至 10 月 19 日的重要事件，九条泳道（power、purge、army、ideo、econ、society、ethnic、hkmt、foreign）与 folk 都顾到；先 Grep `content/events/` 看已有的 37 条 2026 年事件。purge 泳道只建政治局委员、中央委员、上将级别的落马事件，其余落马由 C15 建卡，不建事件。二十届五中全会（10 月 26–29 日）不写（#72）。
2. 能挂到已有概念的，在 `content/concept-more/E15.yaml` 追加 policies（带 events）。
3. 概念 `four-cardinal-principles`（四项基本原则）缺出处：在 `content/concept-more/E15.yaml` 补首次提出（1979 年邓小平讲话）、写入党章宪法的原文出处。

合计 35–50 条事件。

## C15：2026 年落马者（M11）

1. 中纪委网站“审查调查”“党纪政务处分”栏目 2026 年 1 月至 10 月 19 日的中管干部通报，逐条与 `content/people/` 比对，没有卡的建 tier 2 卡（howto §4）并写案件记录 `content/falls/C15.yaml`（§10：sys、grade、trigger、politics 必填，notice、amount、with 能写就写）。2026 年落马、罢免的少将以上军官同理，但**海军、空军的归 CS7**，不建。
2. 已有卡的人 2026 年有新步骤（开除、起诉、判决、二审）的，在其卡的 `fall` 里加步骤（必要时改 `status`、`statusNote`）。有案件记录要补的，原地小改该记录。
3. 回报里列出：比对过的通报总数、新建卡数、已有卡补步骤数，以及应挂进哪个专题（专题 id）的新卡。

合计约 40–70 人（视 2026 年通报数量）。

## R12：体制外人物改判与量刑情节（M12）

schema 已加 `POLITICS.repression`（政治打压）、`TRIGGERS.persecution`（迫害）、`CaseRecord.plea`（自首 surrender、立功 merit、退赃退赔 refund、认罪悔罪 plea）。

1. `research/lists/R15-outside-cases.txt`：有案件记录、没有官员角色的 130 人（异见者、律师、学者、商人、媒体人、家属等）。逐个判断：因言论、维权、宗教、民族、政治活动被抓、被判的，`politics.level` 改 `repression`，`why` 写依据（引人权组织、主流媒体、本人或律师的说法，并注明官方罪名），cites 至少一条可靠来源。起因是当局打压（而非巡视、举报、他案牵出）的，`trigger.kind` 改 `persecution`。因经济犯罪被查的商人（如受贿案行贿人）不改。构建会拒绝给官员角色的人用这两个值。
2. `research/lists/R15-sentenced-no-plea.txt`：已判刑但构建没读出量刑情节的 173 人。查判决报道（先看已入库的 `sources/text/`），法院写明自首、立功、退赃退赔、认罪悔罪的，在其案件记录加 `plea:`（kind、text、cite；text 抄原句要点），来源须可靠。报道明确说没有的，或找不到判决报道的，不写，在回报里统计。注意“责令退赔”“继续追缴”是法院命令，不算退赃。

## U10：上位之路重新归类与新路线（M12）

schema 已加十类路线：org 组织人事、transfer 跨省交流、office 秘书长与办公厅、think 智库转实职、soe 央企转地方、aid 援疆援藏、united 统战与民族、parties 民主党派、open 公开选拔、campus 高校校长从政（`src/data/schema.ts` 的 ROUTES）。

1. `research/lists/R15-turns.txt`：已有 195 条记录，第五列是现在的 routes。逐条对照该记录的 turns 与人物履历，按新类型重排 routes（最重要的在前），只改 routes 字段。没有新类型适用的保持原样。
2. 为新路线补典型人物：每类找 2–4 位履历最能说明这条路的人（已有卡但没有上位之路记录的优先，没有卡的先建 tier 2 卡），写进 `content/turns/U10.yaml`（howto §12，参照 `content/turns/U09.yaml`），合计 20–30 人。转折点是“事”不是“职务”，`did` 写给普通人看。

回报里给出：改了 routes 的条数、每类新路线的人数。

## CS7：海军、空军专题（M13）

做法同 CS3–CS6（`research/round10.md`、howto §13），参照 `content/cases/CS5.yaml`：

1. 海军、空军各写一篇重点案件长文（kind 视内容用 system 或 cluster），讲清 2012 年以来（尤其 2023 年以后）两个军种的落马、罢免、下落不明：谁、何时、通报措辞、与火箭军和装备系统清洗的关系、与派系的关联（编者分析单列 `editor`）。
2. 专题里点名的人，没有卡的建 tier 2 卡（`content/people/CS7.yaml`，登记 `research/roster/CS7.yaml`），落马者写案件记录 `content/falls/CS7.yaml`；状态只由可靠来源设定，传闻（voice: rumor）只进 voices。
3. 专题 events 只用已有事件 id；缺的关键事件建在 `content/events/CS7.yaml`（不超过 10 条）。

每篇 `people` 全部有卡。

## 共同要点

- 来源冲突时正文用更权威的来源，另一说法写在同段，以“另说……”起句并附出处（#60）。
- 任何“”里 8 字以上的引文必须逐字出现在所引来源里。先 Grep 已有来源，不要重复登记。
- 传闻（voice: rumor）不能设 fall 或 status。
- 每做 10–15 条跑 `node tools/build-data.ts --batch=<批次>`，修到 0 error（报告在 `.probe/build-report-<批次>.txt`）。
- 只改上表列出的文件（加上自己的 manifests、roster、`sources/text/<小写批次>-*`、`research/scripts/<批次>-*`、`research/wikidata/` 新增文件），不要 git commit，不要 push，不要启动 dev server。

## 完成时回报

按 howto §9。另写：新建条目数；应补进专题 people、events 的 id（按专题 id 列）；仍缺的及原因；事实冲突及处理；建议新增的事件、概念、专题。
