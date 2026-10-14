# 第五轮批次（完整传记 80 → 120+，M2 收尾）

8 个批次并行，每批把 5–6 张已有的档案卡升级为完整传记。共同规则见 `research/agent-brief.md`、`research/howto-content.md`（§4“完整传记”是本轮的标准）。

已整合：1591 人（完整传记 80）、32 个派系、596 个事件、6000 多个来源，批次模式下全部可见、可引用。**先 Grep 已有来源，再登记新的**：这些人大多已有 Wikidata、K 批次名单、落马通报、诸侯表等来源。

## 本轮的写法：在自己的文件里重写，不改原卡

这些人的档案卡在别的批次文件里（`content/people/C01.yaml`、`K03.yaml` 等）。**不要改那些文件**（几个批次会同时读写）。做法：

1. Grep 找到原卡（`id: li-ganjie` 之类），把整张卡复制到 `content/people/<批次>.yaml`。
2. 在复制件上扩写成完整传记，`tier: 2` 改为 `tier: 1`。原卡的 `factions`、`positions`、`fall`、`status`、`statusNote`、`ids`、`cites` 保留并补全，不要丢。
3. 构建时同 id 的完整传记自动顶替档案卡，警告“card superseded by a full biography”是正常的，整合时删原卡。
4. 名言写 `content/quotes/<批次>.yaml`，评价可直接写在条目的 `assess` 里，人物关系写 `content/relations/<批次>.yaml`（§6）。
5. 不需要登记 roster（人已存在）。

标准（§4）：`bio` 150–300 字；`life` 5–9 段，每段 100–300 字、有 `cites`；`assess` 2–5 条不同声部（官方定性 + 外媒/学者），尽量 `quote: true`；`family`（财富只写主流调查报道）；名言 3–6 句，一句 `star: true`；每人 1500–3000 字，来源 ≥ 4 个，至少 1 个非官方声部。可以用传闻来源补内幕（`rumor: true`，正文写明“据某某（传闻）”），但 `status`、`fall` 只按可靠来源。

## 分工

- **B15 二十届政治局（一）：** 李干杰 li-ganjie、张国清 zhang-guoqing、陈吉宁 chen-jining、李书磊 li-shulei、袁家军 yuan-jiajun
- **B16 二十届政治局（二）：** 尹力 yin-li、刘国中 liu-guozhong、陈文清 chen-wenqing、石泰峰 shi-taifeng、李鸿忠 li-hongzhong
- **B17 政法与书记处：** 王小洪 wang-xiaohong、刘金国 liu-jinguo、郭声琨 guo-shengkun、杨晓渡 yang-xiaodu、张春贤 zhang-chunxian、尤权 you-quan
- **B18 江胡时期（一）：** 李瑞环 li-ruihuan、李岚清 li-lanqing、尉健行 wei-jianxing、吴仪 wu-yi、曾培炎 zeng-peiyan
- **B19 江胡时期（二）：** 回良玉 hui-liangyu、刘延东 liu-yandong、王兆国 wang-zhaoguo、王乐泉 wang-lequan、刘奇葆 liu-qibao、王晨 wang-chen
- **B20 军队（一）：** 曹刚川 cao-gangchuan、梁光烈 liang-guanglie、陈炳德 chen-bingde、常万全 chang-wanquan、迟浩田 chi-haotian
- **B21 军队（二）与京城：** 吴胜利 wu-shengli、马晓天 ma-xiaotian、李作成 li-zuocheng、张阳 zhang-yang、郭金龙 guo-jinlong、刘淇 liu-qi
- **B22 前史与元老：** 邓小平 deng-xiaoping、胡耀邦 hu-yaobang、陈云 chen-yun、宋平 song-ping、李建国 li-jianguo

### 第五轮追加（与上面八批同时进行，互不碰文件）

- **P03 诸侯表补卡：** 诸侯表（`content/chiefs/`）里 25 人全站没有条目，另有 1965 年生的陈刚（十九届候补、二十届中委；青海省委书记 2023-01 起、广西区委书记 2024-12 起），名单去重时被并进了 `chen-gang-beijing`，要单独建卡，id 用 `chen-gang-1965`。为每人建档案卡（§3，`tier: 2`）写进 `content/people/P03.yaml`：职务表至少含诸侯表里那一任及前后各一任，状态、出生，落马的按可靠来源写 `fall`。卡建好后，构建会把诸侯表的姓名链接到“同名且职务在该省”的唯一一人，所以不必改 `content/chiefs/`；陈刚有同名，确认 `chen-gang-1965` 的职务写了青海、广西，而 `chen-gang-beijing` 没有。名单：杨雄（上海）、朱忠明（上海，2026）、李嘉廷（云南）、令狐安（云南）、云布龙（内蒙古）、刘明祖（内蒙古）、魏宏（四川）、谢世杰（四川）、廖国勋（天津）、毛如柏（宁夏）、许仲林（安徽）、王东伟（安徽，2026）、李春亭（山东）、韩寓群（山东）、卢瑞华（广东）、刘小涛（江苏，2025）、陈焕友（江苏）、舒圣佑（江西）、舒惠国（江西）、叶连松（河北）、王陆进（河南，2026）、马忠臣（河南）、蒋祝平（湖北）、张国光（湖北、辽宁）、贾志杰（湖北）、孔绍逊（甘肃，2026）、孙英（甘肃）、陈明义（福建）、刘方仁（贵州）、包叙定（重庆）、陈新武（重庆，2026）、程安东（陕西）。诸侯表已登记的来源（`p01-*`、`p02-*`）先复用。
- **N01 概念补建：** 以下提法已被事件或报刊词频引用、但还没有概念条目（§5）：one-country-two-systems 一国两制、wolf-warrior 战狼外交、patriots-governing-hong-kong 爱国者治港、four-winds 四风、liuzhi 留置、three-red-lines 三道红线、housing-not-speculation 房住不炒、sinicization-of-religion 宗教中国化、great-firewall 防火长城、positive-energy 正能量、honor-disgrace 八荣八耻、socialist-market-economy 社会主义市场经济、harmonious-world 和谐世界、super-ministry 大部制、mass-incidents 群体性事件。写进 `content/concepts/N01.yaml`，每条有首次出现（带原文引文）、是否写入党章/宪法、相关人物与事件；民间造词（战狼、防火长城）以外媒和学者为主要声部。Grep `wolf-warrior` 等 id，看哪些事件已经引用。

已知的待核事项（见 `research/queue.md`）：常万全“降级”只有德国之声转述（B20）；V01 指出尤权、杜青林等卡片说法与来源不符（B17 重写尤权时逐句对来源）；王乐泉“七五事件后次年调离新疆”缺出处（B19）；陈云、邓小平、胡耀邦以 1978–1999 为主，2000 年后写其遗产与官方评价（B22）。

## 完成时回报

按 `howto-content.md` §9。另写：每人字数、来源数与声部；复制原卡时发现的错误与修正；没能写到标准的人与原因。
