# 第七轮批次（M8：上位之路；M7 余项）

共同规则见 `research/agent-brief.md`、`research/howto-content.md`（本轮看 §1、§2、§3、**§12 上位之路**、§13 案件专题）。用户要求见 `research/decisions.md` #48–#51：转折点要让普通人看得懂、有模仿价值，同时说清哪些来自运气、出身和关系。

页面已建好：人物页“上位之路”一节（`src/components/rise/Turns.tsx`）、上位之路页（`#/rise`）。样例 `content/turns/00-exemplar.yaml`（胡春华）已通过构建。

## T01–T06：完整传记人物的上位之路

每人写一条 `content/turns/<批次>.yaml` 记录（§12）。**先读这个人已有的传记**（`content/people/*.yaml` 里的 `life`、`positions`、`cites`），已有来源能写的先用已有来源；台阶年份以官方简历为准。每批挑 3–5 位写成 `deep: true`：转折点 3–4 个、`who` 写全、至少一个 `counter`。

| 批次 | 人物 |
|---|---|
| T01 | deng-xiaoping, chen-yun, hu-yaobang, song-ping, zhao-ziyang, jiang-zemin, li-peng, zhu-rongji, wei-jianxing, li-lanqing, li-ruihuan, luo-gan, wu-guanzheng, huang-ju, zeng-qinghong, jia-qinglin, wu-bangguo, xi-zhongxun |
| T02 | wen-jiabao, zhou-yongkang, hu-jintao, he-guoqiang, li-changchun, yu-zhengsheng, zhang-gaoli, zhang-dejiang, liu-yunshan, wang-qishan, li-zhanshu, xi-jinping, han-zheng, wang-yang, li-keqiang, wang-huning |
| T03 | cai-qi, li-xi, zhao-leji, li-qiang, ding-xuexiang, wu-yi, zeng-peiyan, wang-zhaoguo, liu-qi, hui-liangyu, wang-lequan, liu-yandong, li-jianguo, chen-liangyu, guo-jinlong, meng-jianzhu, bo-xilai, sun-chunlan |
| T04 | li-yuanchao, wang-chen, liu-he, liu-qibao, zhang-chunxian, chen-xi, wang-yi, yang-xiaodu, guo-shengkun, he-lifeng, chen-quanguo, li-hongzhong, shi-taifeng, huang-kunming, yang-jiechi, ma-xingrui, chen-wenqing, chen-miner |
| T05 | liu-guozhong, yin-li, yuan-jiajun, sun-zhengcai, li-shulei, chen-jining, zhang-guoqing, li-ganjie, you-quan, fu-zhenghua, liu-jinguo, wang-xiaohong, ling-jihua, lu-wei, lai-xiaomin, sun-lijun, su-rong, qin-gang |
| T06 | chi-haotian, cao-gangchuan, guo-boxiong, xu-caihou, fan-changlong, xu-qiliang, zhang-youxia, he-weidong, liang-guanglie, chen-bingde, wu-shengli, chang-wanquan, ma-xiaotian, fang-fenghui, zhang-yang, li-zuocheng, wei-fenghe, miao-hua, li-shangfu, zhang-shengmin, liu-zhenli, gu-junshan |

不写的：体制外人物（任正非、黎智英、任志强、刘晓波、艾未未、许家印、马云、郭文贵、许志永、李文亮）和彭丽媛、林郑月娥。

要点：

- **转折点是“事”，不是“职务”。** 不要把简历逐条改写成转折点。要找的是：被谁看中（做了谁的秘书、在谁视察时汇报出色）、在哪件事上露了脸（抗灾、处置群体事件、搞出全国推广的经验、写出被采用的文件）、哪次破格提拔、哪次调动让他进了梯队（第三梯队、团中央、中央办公厅）。每个转折点都要有来源说明“为什么是这件事”，没有就写成事实陈述，不要编因果。
- **`did` 写给普通人看。** 例：“县里没人愿意接的烂摊子他接了，两年做出能写进省委文件的样板。”避免“政治过硬”“敢于担当”这类空话。
- **落马者也写。** 他们怎么上去的同样有参照价值；`cannot` 里可以写这条路的风险。
- **反例**优先用站内已有的人（同届、同路线而落马或止步的）。
- 每做完 5–6 人跑一次 `node tools/build-data.ts --batch=<批次>`。

## 完成时回报

按 §9。另写：每人的主路线；`deep` 的是谁；路线分类里觉得缺的类别；找到的“关键的人”中站内没有条目、值得建卡的。
