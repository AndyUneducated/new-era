// One-off text fixes in content/falls/A02.yaml once the qualification committee's reports gave exact congress dates.
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'content/falls/A02.yaml'
const raw = readFileSync(path, 'utf8')
const crlf = raw.includes('\r\n')
let s = raw.replace(/\r\n/g, '\n')

const all: [string, string][] = [
  [
    '    text: 官方只在人大常委会公报里写明涉嫌严重违纪违法，未说明线索来源\n    cite: a02-caixin-2024-02-04-nine-generals',
    '    text: 代表资格审查报告只写涉嫌严重违纪违法，未说明线索来源\n    cite: a02-wikisource-npc-qualification-reports',
  ],
]
const one: [string, string][] = [
  [
    '2023 年与火箭军现任领导同时出事、同日被罢免人大代表，属火箭军案的同一批。',
    '2023 年 7 月 7 日即被联合参谋部军人代表大会罢免，比火箭军两任司令员早两个半月，是火箭军案中最早被官方处置的一人。',
  ],
  [
    '  statusNote: 2023 年下半年被中央军委联合参谋部军人代表大会罢免全国人大代表，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '  statusNote: 2023 年 7 月 7 日中央军委联合参谋部军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '    - { id: li-yuchao, name: 李玉超, rel: colleague, text: 继任火箭军司令员，同日被罢免全国人大代表, cite: c03-xinhua-2023-12-29-npc-notice-2 }',
    '    - { id: li-yuchao, name: 李玉超, rel: colleague, text: 继任火箭军司令员，同日由火箭军军人代表大会罢免全国人大代表, cite: a02-wikisource-npc-qualification-reports }',
  ],
  [
    '    cites: [c03-xinhua-2023-12-29-npc-notice-2, a02-caixin-2024-02-04-nine-generals]\n  voices:\n    - { voice: zh, text: 联合早报指出，全国人大常委会罢免九名将领时未透露原因, cite: e04-zaobao-2023-12-30-npc-generals }\n  outcome: probe\n  fall:\n    - { date: 2023-09-26, text: 火箭军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表及人大常委会委员，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    cites: [a02-wikisource-npc-qualification-reports]\n  voices:\n    - { voice: zh, text: 联合早报指出，全国人大常委会罢免九名将领时未透露原因, cite: e04-zaobao-2023-12-30-npc-generals }\n  outcome: probe\n  fall:\n    - { date: 2023-09-26, text: 火箭军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 9 月 26 日火箭军军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，人大常委会委员、外事委员会副主任委员职务相应撤销，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '与火箭军两任司令员同日由火箭军军人代表大会罢免，属火箭军案的同一批。\n    cites: [c03-xinhua-2023-12-29-npc-notice-2, a02-caixin-2024-02-04-nine-generals]',
    '比两任司令员晚两个多月、于 2023 年 12 月 5 日由火箭军军人代表大会罢免，同一份资格审查报告公布，属火箭军案的同一批。\n    cites: [a02-wikisource-npc-qualification-reports]',
  ],
  [
    '    - { date: 2023-12-05, text: 火箭军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    - { date: 2023-12-05, text: 火箭军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月 5 日火箭军军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '他的下属、装备部副部长李同建早三个月已被罢免北京市人大代表。\n    cites: [c03-xinhua-2023-12-29-npc-notice-2, a02-bjrd-2023-li-tongjian]',
    '他的副手、装备部副部长李同建两天后也被罢免北京市人大代表。\n    cites: [a02-wikisource-npc-qualification-reports, a02-bjrd-2023-li-tongjian]',
  ],
  [
    '    - { date: 2023-09-26, text: 火箭军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    - { date: 2023-09-26, text: 火箭军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 9 月 26 日火箭军军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '    - { id: rao-wenmin, name: 饶文敏, rel: colleague, text: 装备发展部副部长，同日被罢免, cite: c03-xinhua-2023-12-29-npc-notice-2 }',
    '    - { id: rao-wenmin, name: 饶文敏, rel: colleague, text: 装备发展部副部长，同日被罢免, cite: a02-wikisource-npc-qualification-reports }',
  ],
  [
    '    - { id: zhang-yulin, name: 张育林, rel: colleague, text: 装备发展部副部长，同日被罢免, cite: c03-xinhua-2023-12-29-npc-notice-2 }',
    '    - { id: zhang-yulin, name: 张育林, rel: colleague, text: 装备发展部副部长，同日被罢免, cite: a02-wikisource-npc-qualification-reports }',
  ],
  [
    '    - { date: 2023-11-28, text: 中央军委装备发展部召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表及人大财经委委员，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    - { date: 2023-11-28, text: 中央军委装备发展部召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 11 月 28 日中央军委装备发展部军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，人大财经委委员职务相应撤销，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '    - { date: 2023-11-28, text: 中央军委装备发展部召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    - { date: 2023-11-28, text: 中央军委装备发展部召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 11 月 28 日中央军委装备发展部军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '与火箭军将领同日被罢免，但由海军军人代表大会决定',
    '与火箭军将领在同一份资格审查报告中公布，但由海军军人代表大会决定',
  ],
  [
    '    - { date: 2023-11-27, text: 海军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    - { date: 2023-11-27, text: 海军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 11 月 27 日海军军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
  [
    '空军原司令员，与火箭军将领同日被罢免，但由空军军人代表大会决定',
    '空军原司令员，与火箭军将领在同一份资格审查报告中公布，但由空军军人代表大会决定',
  ],
  [
    '    - { date: 2023-12-04, text: 空军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月被罢免全国人大代表及人大常委会委员，2024 年 2 月人大常委会公报披露原因是涉嫌严重违纪违法；未见立案或处分通报。',
    '    - { date: 2023-12-04, text: 空军召开军人代表大会，以其涉嫌严重违纪违法为由罢免其第十四届全国人大代表职务, cite: a02-wikisource-npc-qualification-reports }\n  statusNote: 2023 年 12 月 4 日空军军人代表大会以其涉嫌严重违纪违法为由罢免其全国人大代表职务，人大常委会委员、华侨委员会副主任委员职务相应撤销，12 月 29 日全国人大常委会公告；未见立案或处分通报。',
  ],
]
for (const [a, b] of all) {
  const n = s.split(a).length - 1
  console.log(`all x${n}`)
  s = s.split(a).join(b)
}
for (const [a, b] of one) {
  const n = s.split(a).length - 1
  if (n !== 1) console.log(`!! x${n}: ${a.slice(0, 40)}`)
  else s = s.replace(a, b)
}
writeFileSync(path, crlf ? s.replace(/\n/g, '\r\n') : s)
