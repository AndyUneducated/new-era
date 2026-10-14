# 内容批次操作手册

每个内容批次（B01…、C01…、E01…、F01、I01、K01）按本手册独立工作。多个批次**同时**在同一仓库里工作，所以第 1 节的规则必须遵守。

先读：`research/decisions.md`（用户的 21 项选择）、`research/methods.md`（来源与声部）、示范文件 `content/people/00-exemplar.yaml`、`content/quotes/00-exemplar.yaml`、`research/manifests/00-exemplar.yaml`、`src/data/schema.ts`（字段的权威定义）。

## 1. 并行规则（必须遵守）

- **只写自己批次的文件**，文件名以批次号开头：
  - `research/manifests/<批次>.yaml`：来源登记
  - `content/people/<批次>.yaml`：人物
  - `content/quotes/<批次>.yaml`：名言（人物 id → 列表）
  - `content/tags/<批次>.yaml`：派系标签（人物 id → 列表），用于给**别的批次的人物**加标签；自己批次的人物直接写在人物条目的 `factions:` 里
  - `content/events/<批次>.yaml`、`content/concepts/<批次>.yaml`、`content/factions/<批次>.yaml`、`content/congresses/<批次>.yaml`、`content/corpus/<批次>.yaml`
- **不要改**别的批次的文件、`src/`、`tools/`、`research/roster.yaml`、`*-plan.yaml`。需要新的人物、派系、概念 id 时，在最终回报里提出。
- **抓取时总是写明 id**：`node tools/fetch-web.ts --report=<批次> id1 id2 ...`。不带 id 会把所有批次的待抓来源一起抓。
- **校验只校验自己：** `node tools/build-data.ts --batch=<批次>`。完整报告写在 `.probe/build-report-<批次>.txt`（UTF-8；控制台中文会乱码，读这个文件）。必须做到 **0 error**。warning 中“planned but has no entry yet”是正常的（别的批次还没写完）。
- **第二轮起，已整合的内容都能看到、都能引用。** `--batch` 只跳过 `research/round.yaml` 里本轮其他批次的文件，前几轮的人物、派系、事件、概念、来源全部加载。所以：
  - **登记来源前先查是否已有。** 在 `research/manifests/*.yaml` 里 Grep 网址（或网址的一段、标题关键词）。已登记的直接引用原 id，它的存档文本在 `sources/text/<id>.txt`，引文从那里复制。同一网址用本批次前缀再登记一次会**报错**。已有 id 的存档只是摘录、缺你要的段落时，在回报里写明“请给 <id> 加 keep: …”，自己另找来源，不要重复登记。
  - 来源登记（`research/manifests/`）例外：本轮其他批次的也会加载，所以 V01 修正旧文件时引用的 `v01-` 来源不会让你报错。
  - 引用别的批次的人物、派系、事件 id 前，先在 `content/` 里 Grep 确认存在（或在 roster / plan 里）。
- 不要 `git commit`，不要 `npm install`，不要启动 dev server。

## 2. 来源

### 登记

在 `research/manifests/<批次>.yaml` 的 `web:` 下登记，字段见 `methods.md` §1。id 用 `<出版方简称>-<日期>-<主题>`，如 `xinhua-2017-10-25-pb-list`、`bbc-2012-04-10-bo-xilai`、`nyt-2012-10-25-wen-wealth`。全站唯一：**在 id 前加批次号小写**以免撞车，如 `b04-xinhua-2013-03-14-xi-president`。

### 用哪类来源

| 用途 | 首选 | voice |
|---|---|---|
| 履历骨架（生卒、籍贯、学历、职务） | 讣告/生平（新华社）、人民网“中国共产党新闻网·领导人资料”简历、新华社任免消息、中纪委通报 | `doc` / `official` |
| 基本事实兜底 | Wikidata（`node tools/fetch-wikidata.ts Q...`，引用 id 为 `wd-Q...`） | `wiki` |
| 派系标签、评价、内幕 | BBC 中文、DW、RFA、VOA、联合早报、端、中央社、FT 中文网、纽约时报中文网、日经中文网；NYT、WSJ、FT、Reuters、Bloomberg、Guardian、AP；Brookings、China Leadership Monitor、Jamestown China Brief 等学者文章 | `zh` / `west` / `japan` / `scholar` |
| 名言 | 讲话原文（新华社、人民网、政府网、外交部网站）、记者会实录、外媒采访原文 | 视来源 |

- 维基百科（`voice: wiki`）只能作基本事实的辅助来源，**不能**作派系标签来源。大纪元、看中国、新唐人、博讯、多维**不收**。
- 有版权的来源（媒体、学者、维基百科）一律 `excerpt: true` + `keep: [...]`，`keep` 写能唯一定位所需段落的短字符串（段落里的几个字即可）。官方文件（`doc`、`official` 的新华社/政府网/人民网通稿）全文入库，用 `start`/`end` 截掉页眉页脚。
- 不确定段落怎么截：`node tools/fetch-web.ts --peek <id>` 只把全文写到 `.probe/peek-<id>.txt`，看完再定 `start`/`end`/`keep`。
- 抓不到（401、403、超时）：换同一内容的转载页（如政府网 ↔ 新华网 ↔ 人民网），外媒换中文版，或用 Wayback：`https://web.archive.org/web/2024/<原网址>`。路透、明报、经济学人直连会 401/403。
- 查找网址可用 WebSearch。抓取后**一定打开 `sources/text/<id>.txt` 看一眼**，确认是正文而不是导航、登录页或 cookie 提示。

## 3. 引文规则（构建时逐字核对，对不上就报错）

- `quotes` 的 `text`、派系标签的 `quote`、`assess`/`voices` 里 `quote: true` 的 `text`：必须是出处文本里一字不差的连续片段。可以用 `……` 省略中间部分；句末标点可不同；各种引号互通。
- 正文（`bio`、`life.text`、`summary`、`family.text`）里用 “” 括起、**8 个字以上**的句子，视为引文，必须出现在该段 `cites` 的某个来源里。短于 8 字的“团派”“七上八下”之类是术语，不查。
- 外文来源：`text` 写原文（英文/日文），`zh` 写译文。
- 先抓取、读原文，再从原文**复制**引文。不要凭记忆写引文。

## 4. 人物条目

字段定义见 `src/data/schema.ts` 的 `PersonSchema`，样例见 `00-exemplar.yaml`。要点：

- `id`、`name` 按 `research/roster.yaml`，不要改。
- `roles`：`psc pb sec cmc cc acc ccdi prov minister general tiger dissent biz hkmt scholar media family`，可多选。
- `status`：`active`（在任）、`retired`、`purged`（落马：被立案或开除）、`detained`（在押服刑）、`watched`（获释或未起诉，但受监控、软禁、限制出境）、`exiled`、`missing`、`dead`。今天是 **2026-10-13**，状态写今天的状态；`statusNote` 一句话说明。
- `fall`：落马经过，每步一条（立案、开除党籍、判决），`date` + `text` + `cite`（中纪委、新华社通报）。
- `positions`：主要职务，`sys` 为 `party`/`gov`/`army`/`other`，地方职务写 `place`（省级名称，如 `浙江`），`from`/`to` 写到月。每条最好有 `cite`。
- `factions`：`{ f: <派系 id>, cite: <来源 id>, quote: <来源中给出该标签的原句> }`。派系 id 见 `research/faction-plan.yaml`。**只写媒体或学者明确这样说过的**，一条标签一个来源。找不到就不写。
- `ids.wikidata`：查 QID：`node tools/fetch-wikidata.ts --find --out=<批次> 名字1 名字2`，结果在 `.probe/<批次>.json`；然后 `node tools/fetch-wikidata.ts Q1 Q2 ...` 抓记录，`cites` 里加 `wd-Q...`。
- `cites`：整条的主要来源，至少一个。

### 完整传记（tier 1）

- `headline`：一行身份，如“中共中央总书记、国家主席、中央军委主席（2012– ）”。
- `bio`：概述，150–300 字，写清此人在 2000 年后中国政治里的位置。
- `life`：按时期分 5–9 段，每段 100–300 字，每段有 `cites`。覆盖早年、仕途各阶段、2000 年后的关键事件、（如有）落马或去世。争议处并列说法，写明谁说的。
- `assess`：2–5 条不同声部的评价（官方定性 + 外媒/学者），尽量 `quote: true` 引原文。
- `family`：配偶、子女、重要亲属；财富与商业利益**只写主流媒体调查报道**，写明媒体与日期，有当事方回应的一并写。
- 名言：`content/quotes/<批次>.yaml`，每人 3–6 句，`kind` 为 `public`/`adlib`/`interview`/`leaked`/`rumor`（见 `methods.md` §4），挑一句最有代表性的加 `star: true`。`leaked`/`rumor` 的出处是刊载这一说法的文章。
- 目标：每人 1500–3000 字，来源 ≥ 4 个，至少 1 个非官方声部。

### 档案卡（tier 2）

- `headline`、`bio`（1–3 句，60–150 字）、`positions`（3–8 条主要职务）、`status`、`fall`（如有）、`cites`。
- 来源：Wikidata + 至少一个官方或媒体来源（简历、任免、通报）。
- 有媒体派系标签的照样写 `factions`。
- 名言可选。

## 5. 事件条目（`content/events/<批次>.yaml`）

字段见 `EventSchema`。`lane`：`prelude`（1989–1999 前史）`power` `purge` `army` `ideo` `econ` `society` `ethnic` `hkmt` `foreign` `folk`（民间话语、网络流行语、梗，须注明出处与语境）。`major: true` 只给最重要的约 1/5。`summary` 80–200 字。`people`/`factions`/`concepts` 用已有或计划中的 id。`voices` 可选：同一事件的官方说法与外媒/学者说法并列。

## 6. 完成时回报

最终回复写：完成的条目数（传记、档案卡、名言、事件……）；`--batch` 校验结果（0 error）；未能完成的条目及原因；建议新增的 id（人物、派系、概念）；发现的事实冲突或存疑之处。
