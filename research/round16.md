# 第十六轮批次（用户离开期间继续补数据，#83）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`、`research/round15.md`“共同要点”。第十五轮的 RL2（关系）、BD1（出生年月、职务）仍在进行，**不要碰** `content/relations/`，也不要改旧人物卡的 `born`、`birthplace`、`positions`、`verify`。

| 批次 | 写什么 | 只碰这些文件 |
|---|---|---|
| PH9 | 照片 | `content/photos/PH9.yaml`、`public/photos/` 新增文件 |
| K07 | 缺卡补建 | `content/people/K07.yaml`、`content/falls/K07.yaml`、`research/roster/K07.yaml`；T01 里赵智勇卡的 `fall` 一处；两条旧来源的 `keep`（见下） |

来源登记 `research/manifests/<批次>.yaml`，id 以小写批次号开头，正文 `sources/text/<小写批次>-*`，脚本 `research/scripts/<批次>-*`。不要 git commit，不要 push，不要启动 dev server。

## PH9：彩色照片（M10 续）

做法同 PH8（`content/photos/PH8.yaml`、howto §11）。名单 `research/lists/R15-photo-next.txt` 是 PH8 留下的 272 人（百科卡片文字已与人物对上，其中 7 人已确认是本人彩照：李静、李明辉、吴晓平、李林、何新、张伟（国家管网）、罗强）。PH8 的脚本 `research/scripts/PH8-yaml.ts`、`PH8-sheet.ts` 等可以复制改名为 `PH9-*` 后用。

1. 先收那 7 人，再逐张在联系表上看其余 265 人：彩色、是本人、头部位置合适才收。
2. 名单收完仍不到目标的，再从 `research/lists/R15-no-photo.txt` rank4 里 PH8 没碰过的人补。
3. 黑白、棕色单色老照片不收（PH8 删过宋学义、周同战两张颜色分数过阈值的棕色照）；同名、认不准的宁可缺。低质量彩照保留（#62）。

目标：本批 180–240 张。

## K07：缺卡补建

以下人物在已有专题、事件或通报里出现，但没有卡。每人建 tier 2 卡（howto §4，写 `content/people/K07.yaml`，登记 `research/roster/K07.yaml`）；落马、被罢免的写案件记录 `content/falls/K07.yaml`（§10）。建前先 Grep `content/people/` 和 `research/roster/` 防重。状态只由可靠来源设定，传闻只进 voices。

1. **张曙光（军）**，id `zhang-shuguang-cmc`：中央军委纪委书记、军委监察委员会主任，2026-07-03 晋升上将（`sources/text/c08-xinhua-2026-07-03-generals.txt`）。与已有的原铁道部张曙光 `zhang-shuguang-rail` 不是一人。
2. **2025 年被罢免人大代表或落马、尚无卡的将领和官员**：刘国跃、樊友山、曾毅、俞培根、高涛、张红文（C15 回报，须先确认身份与时间）。
3. **黄伟**：2026-06-26 被贵州省人大常委会罢免全国人大代表（`sources/text/c03-xinhua-2026-06-26-npc-notice-18.txt`），先确认是哪一位黄伟；**李兰祥**：同一公告里辞去代表职务（山东），确认身份与原因。
4. **李少平**（四川公选出身，U10 回报）、**桑国卫**（U10 回报），建一般人物卡。
5. 胡瑜海、冷少杰、刘亚武（CS7 回报“只有推断”）：只有在找到可靠来源写明其职务和遭遇时才建，否则在回报里说明。
6. 赵智勇（`content/people/T01.yaml`）的 `fall` 缺 2024-02-07“取消待遇、移送起诉”一步：找可靠来源补上，只改 `fall` 这一个字段，用 StrReplace 小改。
7. 给 `rl1-zaobao-2025-12-14-air-force`、`b04-bbc-2025-10-nine-generals` 两条来源补 `keep`（所在 manifest 里原地小改），保留讲空军将领、九名将领被开除的段落，再 `node tools/fetch-web.ts --force <id>` 重抓。

合计约 12–16 张卡。回报里列出每张新卡应挂进的专题 id（例如 `air-force-purge`、`navy-purge`、`cmc-2017`、`rocket-force`、`equipment-aerospace`）和事件 id（例如 `e15-2026-npc-notice-six-generals`、`e15-2026-wang-gang-general`）。

## 完成时回报

按 howto §9。另写：新建条目数；仍缺的及原因；事实冲突及处理；建议新增的事件、专题。
