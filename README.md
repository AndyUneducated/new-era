# 新时代 · New Era

2000 年以来的中国大陆政治专题，重心在习近平时期。四个栏目：

- **人物**：常委、政治局、军委、落马官员、异见者、企业家、港澳台人物。完整传记、履历、名言、照片。
- **派系**：五套框架并列（胡温时期经典分法、李成的精英/民粹两派、习时期履历网络、被清洗集团、军中派系）。每个标签都注明是哪家媒体或学者说的，并附原句。
- **时间线**：十一条泳道，1989–1999 前史加 2000 年至今。
- **思想**：指导思想谱系、提法的首次出现与写入党章、历次党代会报告与政府工作报告的词频。

网站：<https://andyuneducated.github.io/new-era/>

## 体例

- 每句加引号的话在构建时与入库原文逐字比对，对不上不能发布。
- 官方文件全文入库；媒体与学者文章只存相关段落并记录网页哈希。
- 不收录大纪元、看中国、新唐人、博讯、多维。
- 照片优先用维基共享资源的自由授权图片，其次为官方标准像，均注明出处。

详见 [`research/methods.md`](research/methods.md) 与 [`research/decisions.md`](research/decisions.md)。

## 开发

```sh
npm install
npm run dev          # 构建数据并启动 Vite
npm run data:build   # 只构建并校验数据（报告见 .probe/build-report.txt）
npm run data:fetch -- --report=X id1 id2   # 抓取登记过的来源
npm run data:photos  # 下载照片（Commons 优先）
npm test             # 单元测试
npm run build && npm run test:smoke        # 冒烟测试
```

内容在 `content/`（YAML），来源登记在 `research/manifests/`，入库原文在 `sources/text/`。写内容前先读 [`research/howto-content.md`](research/howto-content.md)。

MIT License.
