# 第十二轮批次（专题缺卡、事件续、思想续）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`。本轮与在途的 PH5、R08、CS4、CS5、E10 并行。用户的选择见 `research/decisions.md` #58–#66。

## C11：专题与论争里缺卡的人

为已整合的专题（CS3）、论争（I08）和思想者（I09）里提到、但没有卡的人建档案卡（tier 2，按 howto §4）。并行的 R08 正在为 CS1、CS2 的缺卡者建卡，**不要碰 `research/roster/R08.yaml` 里的人**（先读它）。

1. CS3（军队、军工）：罗琦、王小军、陈国瑛、吴谦、孔军、王仲才、王守业、马发祥、刘卫东、张龙海、陈锡明、郑璇、王刚（空军司令员）、张韶颖、蒋斌。落马者同时写案件记录 `content/falls/C11.yaml`（按 §10）。
2. I08 论争的一方代表，优先：张维迎 `zhang-weiying`、刘国光 `liu-guoguang`、项飙 `xiang-biao`、郝时远 `hao-shiyuan`、姚中秋 `yao-zhongqiu`；其次：周瑞金 `zhou-ruijin`（皇甫平）、冯虞章、杨晓青、郑志学、马钟成、许小年、洪振快、杜光、易富贤、翟振武、顾宝昌、胡联合、李君如、李明辉、张博树、吴小平、郎咸平、顾雏军、周小平、花千芳、刘瑜、慕容雪村、骆华忠、李林（法学）、韩大元。
3. I09：贝淡宁、康晓光。

每张卡写清身份与代表观点（学者引本人文章、著作或访谈），与官方的关系，口吻中性。被处分、封号、限制出境的用 status/statusNote 并引可靠来源。先 Grep `content/people/` 确认没有卡（注意同名，id 冲突时加后缀）。合计 60 人左右就停。

卡写 `content/people/C11.yaml` 并登记 `research/roster/C11.yaml`；新来源登记 `research/manifests/C11.yaml`，id 以 `c11-` 开头。**链回**：把新卡 id 写进 `content/concept-more/C11.yaml`（论争的 `by`、学者相关概念的 `by`）；CS3 的 people 补哪些人，在回报里按专题 id 列出，由维护者补。

## E11：思想落地的事件

把 I06、I07 建议的事件建出来，写进 `content/events/E11.yaml`，格式照 `content/events/E08.yaml`、`E09.yaml`；建好后在 `content/concept-more/E11.yaml` 里给对应概念追加 `policies`（带 events）。并行的 E10 在给更早的概念（I01–I05）补事件，先读 `content/events/E10.yaml`（如果已有）避免重复，同一天同一件事只建一条。

1. I06 建议：2013-10-11 枫桥经验指示（fengqiao-experience）；2015 中国制造2025 印发（made-in-china-2025）；2015-03-12 军民融合上升为国家战略、2017-01 中央军民融合发展委员会成立（military-civil-fusion）；2018-01-02 乡村振兴一号文件（rural-revitalization）；2018-01-24 扫黑除恶启动（anti-mafia-campaign）；2019-05-31 主题教育启动（initial-mission）；2020-09-22 联大双碳承诺、2021-09-22 双碳意见（dual-carbon）；2021-02-20 党史学习教育动员（party-history-education）；2021-02-25 脱贫攻坚总结表彰（poverty-alleviation）；2021-05/08 清朗、饭圈整治（qinglang）；2021-06-10 数据安全法、2023-04-26 反间谍法修订（holistic-security）；2022-03-25 统一大市场意见（unified-national-market）；2022-09-06 新型举国体制意见（new-whole-nation-system）；2023-02-27 数字中国规划（digital-china）；2023-03 中央金融委员会组建、2023-10-30 中央金融工作会议（financial-power）。来源多数已在 `research/manifests/I06.yaml`。
2. I07 建议：1986 复关申请（wto-accession）；2001 七一讲话（three-represents）；2005 省部级和谐社会专题研讨班（harmonious-society）；2013–2014 群众路线教育实践活动（advanced-nature-education 的后续、three-stresses）。并检查 I07 每个概念的 policies，events 为空的补落地事件（如 1999 西部大开发、2003 东北振兴、2004 首个一号文件、2006 全国科技大会、1998 积极财政政策）。

要点同 E10（`research/round11.md`）：每条事件有可靠来源；只有传闻来源的标 rumor。`people`、`factions`、`concepts` 只填已有 id。新来源登记 `research/manifests/E11.yaml`，id 以 `e11-` 开头。合计 30–40 条就停。

## I10：思想续（建议的新概念）

新概念写 `content/concepts/I10.yaml`，给已有概念补字段写 `content/concept-more/I10.yaml`。做法同 I05–I08（`research/round9.md`、howto §14）。先 Grep `content/concepts/` 确认不重复（新型举国体制、铸牢中华民族共同体意识已有）。

| 来自 | 概念 |
|---|---|
| I05 | 大党独有难题；历史周期率与窑洞对（“第二个答案”）；四个伟大；新安全格局；人类文明新形态；中华民族现代文明；新型国际关系；正确义利观；自我革命重要思想（可并入 self-revolution 的 concept-more） |
| I07 | 新农村建设；中部崛起；一号文件；积极财政政策（1998）；2009 产业振兴规划；自主创新（外界批评放 voices） |
| I08（论争，kind: debate，2–4 方） | 郎顾之争；七不讲；去政治化（马戎）；北京共识（雷默）与华盛顿共识；反内卷 |
| I08（formula） | 英雄烈士保护法；民营经济促进法 |

每条有出处（官方原文先查 `content/corpus` 和已有来源），lists 逐字核对，能落到政策的写 policies（events 用已有事件 id，没有的在回报里建议）。论争各方要有当事人原文。who/by 用已有人物 id，没有卡的在回报里列出（C11 正并行建卡）。新来源登记 `research/manifests/I10.yaml`，id 以 `i10-` 开头。合计 20–25 条就停。

## 共同要点

- 来源冲突时正文用更权威的来源，另一说法写在同段，以“另说……”起句并附出处（#60）。
- 任何“”里 8 字以上的引文必须逐字出现在所引来源里。先 Grep 已有来源，不要重复登记。
- 每做 10–15 条跑 `node tools/build-data.ts --batch=<批次>`，修到 0 error。
- 只改自己批次的文件（`content/*/<批次>.yaml`、`research/manifests/<批次>.yaml`、`research/roster/<批次>.yaml`、`sources/text/<小写批次>-*`、`research/scripts/<批次>-*`），不要 git commit，不要 push。删除文件单独执行。

## 完成时回报

按 §9。C11：新卡 id（按来源分）、案件记录数、链回了哪些概念、CS3 应补的 people、仍缺的人。E11：新建事件数、补了哪些概念的 policies、未建及原因。I10：新概念 id、补了什么、缺卡的人、建议事件、事实冲突。
