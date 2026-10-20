# 第十八轮批次（用户离开期间继续补数据，#83）

共同规则同 `research/round17.md` 开头：来源登记 `research/manifests/<批次>.yaml`（id 以小写批次号开头），正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`；登记前 Grep `research/manifests/` 防重；旧文件只用 StrReplace 小改；不要 git commit/push，不要启动 dev server；每做 5–8 条跑一次 `node tools/build-data.ts --integrated --warn`，修到 0 error、无本批 warning。

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| FX1 | 队列里的旧错与待核项 | 下文点名的旧文件里的点名字段；`content/relations/RL6.yaml` |
| E16 | 建议事件与概念 | `content/events/E16.yaml`、`content/concepts/E16.yaml`（长条目正文按惯例可放 `content/concept-more/E16.yaml`） |
| CS10 | 两篇专题 | `content/cases/CS10.yaml`、`content/people/CS10.yaml`、`content/falls/CS10.yaml`、`research/roster/CS10.yaml`、`content/events/CS10.yaml` |

## FX1：旧错与待核项（`research/queue.md`“第十七轮整合”各条）

每项先查原始来源再改；查不实的不改，写进回报。

1. 状态口径：覃伟中（只立案）、吴胜华（开除并移送）卡上 status 为 detained，方红卫、费东斌为 purged。先读 `src/data/schema.ts` 与 `research/howto-content.md` 对 status 的定义，按定义统一这四人。
2. 雷凡培 `lei-fanpei`：卡写 active、“离任时间和现职未见公开报道”；联合早报 2026-10-11 报道已被免去中央军民融合办常务副主任。找到可靠来源后改 statusNote、positions（status 是否变要看来源是否说明原因；未说原因的按 K07 先例标 missing）。
3. 九人据 C16 称只受纪律处分却显示为“开除”：许爱民、朱福寿、刘俊（广西）、李建华（甘肃）、彭玉行、张和（湖北）、刘传胜、肖亚庆、张天心。逐人查原通报：真是开除党籍的不改；只受党纪处分的，改其 `fall` 步骤文字或案件记录，使构建不再读成 expelled（看 `src/lib/caseparse.ts` 的判断依据）。
4. 张冬辰 `zhang-dongchen`：中国电子总经理任期止于 2021-04；K09 称上交所公告免职日为 2021-08-30。找到公告原文后登记来源并改 positions。
5. 胡建学 `hu-jianxue`：1990 年任泰安市长、1991-06 任市委书记、1995-01 免党内职务（旧卡写书记 1990-06 至 1995-11）；张鸿文 `zhang-hongwen`：合肥任职止于 2025-03，继任 2025-04-11 公布。按来源改 positions。
6. 杨发森 `yang-fasen`：判决写明投案，案件记录补 `plea`。
7. `rl2-wiki-caep` 在其 manifest 里补 `keep`（张克俭 2007-12—2015-08、杭义洪 2015-09—2024-07 两任党委书记的行），`node tools/fetch-web.ts --force rl2-wiki-caep` 重抓。
8. 关系写 `content/relations/RL6.yaml`（格式同 RL5，先 Grep `content/relations/` 防重）：杭义洪接张克俭（第 7 项完成后；杭义洪无卡则不写）；丁向群接李云泽（`k06-zaobao-2026-08-07-li-yunze`）；温刚 2023-02 接雷凡培任中船集团董事长（`k05-wiki-ma-zhengwu`）。
9. 概念 `xi-culture-thought` 摘要“最晚提出的分支思想”已过时（2026 年有习近平党建思想），改一句；`sannong` 的“社会主义新农村”术语如与新概念 `new-socialist-countryside` 重复，改为链接。
10. 事件补充：宋林被查事件（Grep“宋林”找到 id）补 2013 年李建军赴香港廉署实名举报宋林一句（PH11 回报，来源先找）。

## E16：建议事件与概念

先 Grep `content/events/`、`content/concepts/`、`content/concept-more/` 防重，格式同 `content/events/I12.yaml`、`content/concepts/I12.yaml`。

1. 事件：2004-09 十六届四中全会（加强党的执政能力建设决定、江泽民辞军委主席）；2015-09-03 抗战胜利 70 周年阅兵（首次由将军领队，名单可给将领卡核对）；2018-04 北大岳昕申请公开沈阳性侵案信息并发公开信；2006-04 城乡建设用地增减挂钩首批试点；2010-12-27 国发〔2010〕47 号（严禁强迫农民住高楼）。
2. 概念：城乡建设用地增减挂钩（含拆村并居、“被上楼”争议）、新时代党的组织路线、好干部二十字标准、晋升锦标赛（周黎安，GDP 考核）、三个区分开来（容错纠错）。能写长条目的写分节正文，挂已有事件、人物。

目标：事件 5–8 条，概念 4–5 个。

## CS10：两篇专题

做法同 CS8、CS9（`content/cases/CS9.yaml`、howto §13）。专题 `people` 全部有卡（缺的在 CS10 文件里建，先 Grep 防重），`events` 只用已有或本批新建的事件 id（新事件不超过 8 条）。

1. **“内鬼”与执法犯法**（id `insiders-law-enforcement`）：政法、纪检系统自身的落马者——2021–2022 年政法队伍教育整顿（事件 `e08-2021-zhengfa-rectification`）查出的公安厅长、法院院长，赵黎平、钟世坚类“执法犯法”，纪检监察干部被查（“灯下黑”）。先从已有卡里筛（案件记录 sys 为 law 或 ccdi 等），与 `sun-lijun-clique`、`zhou-yongkang-network` 分工，不重复写孙力军团伙本身。
2. **中央巡视**（id `central-inspection`）：十八大以来巡视制度（2013 年起轮次、“回头看”、2015 首轮央企专项巡视——中石油、中海油、中石化、武钢、中国电信、民航局等）、巡视发现问题与随后落马的对应关系、巡视组长本人落马（如有）。已有事件 `e12-2013-jiangxi-inspection`、`e12-2016-cbrc-circ-inspection`、`e12-2016-jiangxi-revisit`、`e08-2017-chongqing-inspection-revisit` 可用。

## 完成时回报

按 howto §9：新建条目数；改了哪些旧文件哪些字段；仍缺的及原因；事实冲突及处理；发现的旧错；建议。
