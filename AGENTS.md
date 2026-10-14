# 给接手的智能体 / 协作者

## 先读这四个文件

1. [`research/progress.md`](research/progress.md)：当前里程碑、阶段表、下一步。**每次开始工作先读它。**
2. [`research/milestones.md`](research/milestones.md)：要求覆盖表、各里程碑内容与验收标准。
3. [`research/decisions.md`](research/decisions.md)：立项时与用户确认的 21 项选择。与它冲突的做法须先问用户。
4. [`research/methods.md`](research/methods.md)：来源白名单、声部、引文核对、版权与在世人物规则。

当天的检索过程和遇到的问题写在 `research/log/<日期>-<里程碑>.md`。

## 工作规则

- **分阶段提交并推送。** 每完成 progress.md 表里的一行就更新 progress.md、写日志、提交、推送。
- **提交身份只能用：**
  `git -c user.name=andyuneducated -c user.email=andyuneducated@users.noreply.github.com commit ...`
  不要用本机全局 git 身份，不要写入任何公司邮箱。
- **提交前必须通过：** `npm run data:build`（schema、id 引用、引文逐字核对）和 `npx tsc -b`。
- **界面只用简体中文。** 外文引文保留原文，`zh` 字段附译文（译文不参与核对）。
- **每条事实有出处，每句引文逐字核对。** 引文出处必须是 `research/manifests/` 里登记过、`sources/text/` 里有文本的来源。
- **版权：** 官方文件全文入库；媒体、学者、维基百科只存摘录（`excerpt: true` + `keep:`）。

## Windows / PowerShell 注意

- 控制台和 `>` 重定向会把中文弄成乱码。需要中文输出时让 node 脚本直接写 UTF-8 文件（`.probe/` 下）。
- `.probe/` 是本地探针目录（已 gitignore）。
