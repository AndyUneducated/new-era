// Hand-written parts of the K06 cards: falls, deaths, unexplained exits, and bios that the table cannot give.
// Used by research/scripts/K06-cards.ts.

type Fall = { date: string; text: string; cite: string }
type Ov = {
  status?: 'active' | 'retired' | 'purged' | 'detained' | 'missing' | 'dead'
  statusNote?: string
  fall?: Fall[]
  died?: string
  born?: string
  birthplace?: string
  headline?: string
  bio?: string
  bioTail?: string
  roles?: string[]
  cites?: string[]
  positions?: { title: string; sys: 'party' | 'gov' | 'army' | 'other'; place?: string; from?: string; to?: string; cite: string }[]
}

const P3 = { when: '2024 年 7 月', plenum: '三中全会', cite: 'c03-gov-2024-07-18-third-plenum' }
const P4 = { when: '2025 年 10 月', plenum: '四中全会', cite: 'e04-gov-2025-10-23-4th-plenum' }
export const PROMOTED: Record<string, { when: string; plenum: string; cite: string }> = {
  丁向群: P3, 于立军: P3, 于吉红: P3,
  于会文: P4, 马汉成: P4, 王健: P4, 王永红: P4, 王庭凯: P4, 王新伟: P4, 韦韬: P4, 邓亦武: P4, 邓修明: P4, 卢红: P4,
}

const PLENUM4 = 'e04-gov-2025-10-23-4th-plenum'
const NPC16 = 'f09-xinhua-2026-02-26-npc-notice-16'
const NPC18 = 'c03-xinhua-2026-06-26-npc-notice-18'
const ZB_GENERALS = 'k06-zaobao-2026-08-03-fifth-plenum-generals'
const absent = (extra = ''): Ov => ({
  status: 'missing',
  statusNote: `联合早报 2026 年 8 月梳理的久未公开露面的将领之一${extra}；官方未通报其去向。`,
  cites: [ZB_GENERALS],
})

export const OV: Record<string, Ov> = {
  // --- officially fallen ---
  'li-shisong': {
    status: 'detained',
    statusNote: '2025 年 11 月一审以受贿罪被判处有期徒刑十五年。',
    headline: '云南省委原常委、省政府原副省长',
    bio:
      '白族，云南云龙人，长期在云南工作，历任云南省工业和信息化厅厅长、曲靖市市长和市委书记，2024 年 1 月起任云南省委常委、副省长。' +
      '同年 6 月任上被查，12 月被开除党籍和公职；2025 年 11 月贵阳市中级人民法院以受贿 1.0025 亿余元判处其有期徒刑十五年。',
    fall: [
      { date: '2024-06-25', text: '中央纪委国家监委通报其涉嫌严重违纪违法，接受纪律审查和监察调查', cite: 'k06-xinhua-2024-06-25-li-shisong-probe' },
      { date: '2024-12-17', text: '被开除党籍和公职，终止党的二十大代表资格，涉嫌受贿犯罪问题移送检察机关审查起诉', cite: 'k06-xinhua-2024-12-17-li-shisong-expelled' },
      { date: '2025-10-23', text: '二十届四中全会确认中央政治局此前给予其开除党籍的处分', cite: PLENUM4 },
      { date: '2025-11-18', text: '贵阳市中级人民法院一审以受贿罪判处其有期徒刑十五年，并处罚金五百万元', cite: 'k06-xinhua-2025-11-18-li-shisong-verdict' },
    ],
  },
  'yang-fasen': {
    status: 'detained',
    statusNote: '2025 年 10 月一审以受贿罪被判处无期徒刑。',
    headline: '青海省委原常委、政法委原书记',
    bio:
      '甘肃古浪人，长期在新疆任职，历任库车县委书记、和田地委书记、新疆维吾尔自治区政府副主席和乌鲁木齐市委书记，2023 年 5 月调任青海省委常委、政法委书记。' +
      '2024 年 10 月主动投案，2025 年 3 月被开除党籍和公职，同年 10 月汉中市中级人民法院以受贿 1.47 亿余元判处其无期徒刑。',
    fall: [
      { date: '2024-10-14', text: '中央纪委国家监委通报其涉嫌严重违纪违法，主动投案，接受纪律审查和监察调查', cite: 'k06-xinhua-2024-10-14-yang-fasen-probe' },
      { date: '2025-03-03', text: '被开除党籍和公职，终止党的二十大代表资格，涉嫌受贿犯罪问题移送检察机关审查起诉', cite: 'k06-xinhua-2025-03-03-yang-fasen-expelled' },
      { date: '2025-10-23', text: '二十届四中全会确认中央政治局此前给予其开除党籍的处分', cite: PLENUM4 },
      { date: '2025-10-29', text: '汉中市中级人民法院一审以受贿罪判处其无期徒刑，剥夺政治权利终身，并处没收个人全部财产', cite: 'k06-court-2025-10-29-yang-fasen-verdict' },
    ],
  },
  'fei-dongbin': {
    status: 'purged',
    statusNote: '2026 年 4 月被提起公诉；本批次未查到宣判报道。',
    headline: '交通运输部原党组成员，国家铁路局原局长',
    bio:
      '辽宁锦州人，铁路系统出身，历任呼和浩特铁路局局长、乌兰察布市市长和市委书记、河南省副省长，2022 年回任交通运输部党组成员、国家铁路局局长。' +
      '2025 年 6 月被查，12 月被开除党籍和公职，2026 年 4 月被以涉嫌受贿罪提起公诉。',
    fall: [
      { date: '2025-06-12', text: '中央纪委国家监委通报其涉嫌严重违纪违法，接受纪律审查和监察调查', cite: 'k06-chinanews-2025-06-12-fei-dongbin-probe' },
      { date: '2025-12-05', text: '被开除党籍和公职，终止党的二十大代表资格，涉嫌受贿犯罪问题移送检察机关审查起诉', cite: 'k06-xinhua-2025-12-05-fei-dongbin-expelled' },
      { date: '2026-04-27', text: '长春市人民检察院以涉嫌受贿罪向长春市中级人民法院提起公诉', cite: 'k06-xinhua-2026-04-27-fei-dongbin-charged' },
    ],
  },
  'fang-hongwei': {
    status: 'purged',
    statusNote: '2026 年 7 月被开除党籍和公职，涉嫌犯罪问题移送审查起诉；本批次未查到起诉或宣判报道。',
    headline: '陕西省委原常委、西安市委原书记',
    bio:
      '陕西富平人，清华大学汽车工程系毕业，曾任陕汽集团董事长，后历任汉中市市长、市委书记和陕西省委秘书长，2021 年 11 月起任陕西省委常委、西安市委书记。' +
      '2025 年 11 月任上被查，2026 年 7 月被开除党籍和公职。',
    fall: [
      { date: '2025-11-07', text: '中央纪委国家监委通报其涉嫌严重违纪违法，接受纪律审查和监察调查', cite: 'k06-xinhua-2025-11-07-fang-hongwei-probe' },
      { date: '2026-07-07', text: '被开除党籍和公职，终止党的二十大代表资格，涉嫌受贿犯罪问题移送检察机关审查起诉', cite: 'k06-xinhua-2026-07-07-fang-hongwei-expelled' },
    ],
  },
  'fei-gaoyun': {
    status: 'purged',
    statusNote: '2026 年 5 月起接受审查调查，尚未公布处分结果。',
    headline: '安徽省委常委、合肥市委书记（2026 年 5 月被查）',
    bio:
      '江苏淮安人，历任江苏省副省长、省委常委兼政法委书记和常务副省长，2022 年 12 月调任安徽省委常委、常务副省长，2025 年 4 月起任合肥市委书记。' +
      '2026 年 5 月任上被查，6 月被安徽省人大常委会罢免全国人大代表职务。',
    fall: [
      { date: '2026-05-06', text: '中央纪委国家监委通报其涉嫌严重违纪违法，接受纪律审查和监察调查', cite: 'k06-xinhua-2026-05-06-fei-gaoyun-probe' },
      { date: '2026-06-26', text: '全国人大常委会公告：安徽省人大常委会决定罢免其第十四届全国人大代表职务', cite: NPC18 },
    ],
  },
  // --- removed as NPC deputies, no investigation notice ---
  'li-yunze': {
    status: 'missing',
    statusNote: '2026 年 4 月底卸任国家金融监督管理总局局长，官方未发布任免消息；四川省人大常委会 5 月 27 日以其严重违纪违法为由罢免其全国人大代表（据联合早报转述该省人大常委会公报）。未见中央纪委立案通报。',
    headline: '国家金融监督管理总局原党委书记、局长',
    bio:
      '山东烟台人，长期在中国建设银行工作，后任工商银行副行长、四川省委常委和常务副省长，2023 年 5 月出任新组建的国家金融监督管理总局党委书记、局长。' +
      '2026 年 4 月底该局官网撤下其局长信息，5 月由丁向群接任党委书记；同月四川省人大常委会以其严重违纪违法为由罢免其全国人大代表。',
    fall: [{ date: '2026-06-26', text: '全国人大常委会公告：四川省人大常委会决定罢免其第十四届全国人大代表职务', cite: NPC18 }],
    cites: ['k06-zaobao-2026-08-07-li-yunze'],
  },
  'li-wei-pla': {
    status: 'missing',
    statusNote: '2026 年 2 月被罢免全国人大代表；官方未公布立案审查或处分。',
    bioTail: '2026 年 2 月被信息支援部队军人代表大会罢免全国人大代表职务，官方未说明原因。',
    fall: [{ date: '2026-02-26', text: '全国人大常委会公告：信息支援部队军人代表大会决定罢免其第十四届全国人大代表职务', cite: NPC16 }],
  },
  // --- unexplained exits ---
  'liu-jianchao': {
    status: 'missing',
    statusNote: '据《华尔街日报》报道（联合早报、德国之声转述），2025 年 7 月底出访回京后被带走问话；9 月 30 日中联部官网改由刘海星任部长。官方未证实调查。',
    headline: '中共中央对外联络部原部长',
    bio:
      '吉林德惠人，职业外交官，2002 年至 2008 年任外交部新闻发言人，后任驻菲律宾、驻印度尼西亚大使，2015 年起任中纪委国际合作局局长、浙江省纪委书记，2022 年 6 月任中联部部长。' +
      '据《华尔街日报》报道，他 2025 年 7 月底出访回京后被带走问话；同年 9 月中联部官网改由刘海星任部长，官方未作说明。',
    cites: ['k06-zaobao-2025-08-10-liu-jianchao', 'k06-dw-2025-10-liu-jianchao-replaced'],
  },
  'han-jun': {
    statusNote: '2026 年 4 月 28 日被免去农业农村部党组书记，30 日被全国人大常委会免去部长职务，去向未公布。',
    bioTail: '2026 年 4 月 30 日被全国人大常委会免去农业农村部部长职务，去向未公布。',
    cites: ['k06-gov-2026-04-30-npcsc-appointments'],
  },
  'yuan-jie': {
    status: 'missing',
    statusNote: '2024 年 4 月航天科工改由陈锡明任董事长，官方未说明其去向；维基百科称其疑涉火箭军腐败案、下落不明。',
    bioTail: '2024 年 4 月被免去航天科工董事长职务，官方未公布去向。',
    cites: ['k06-rfa-2024-04-15-yuan-jie'],
  },
  'zhang-zhongyang': { statusNote: '2025 年 4 月卸任航天科技集团总经理，官方未公布新职。' },
  'wen-gang': { statusNote: '2024 年 12 月卸任中国船舶集团董事长，官方未公布新职。' },
  'yu-jianfeng': { statusNote: '2025 年 5 月卸任中国核工业集团董事长，官方未公布新职。' },
  'fu-aiguo': { statusNote: '2024 年 9 月卸任国防科技大学政委，此后未见新职报道。' },
  'li-xiang': { statusNote: '2025 年卸任国防科技大学校长，此后未见新职报道。' },
  'yu-qingjiang': { statusNote: '2025 年卸任空军副司令员，此后未见新职报道。' },
  'yang-zhiliang': { statusNote: '2025 年卸任南部战区副政委兼战区海军政委，此后未见新职报道。' },
  'wang-qingxian': { statusNote: '2026 年 9 月 23 日因工作变动辞去安徽省省长职务，新职未见公布。' },
  'ren-zhenhe': { statusNote: '2026 年 9 月 2 日因工作变动辞去甘肃省省长职务，新职未见公布。' },
  'liang-yanshun': { statusNote: '2026 年 9 月不再担任安徽省委书记，新职未见公布。' },
  'an-wei': { statusNote: '2026 年 9 月不再担任郑州市委书记，新职未见公布。' },
  'zhang-chaochao': { statusNote: '2026 年 10 月不再担任石家庄市委书记，新职未见公布。' },
  'li-xiaoxin': {
    bio:
      '湖南岳阳人，二十届中央委员；早年在湖南汨罗县和湖南省委组织部工作，2000 年起在中央组织部历任处长、组织二局局长、组织一局局长，2017 年 2 月任部务委员（副部长级）。' +
      '2020 年 8 月已任中央组织部副部长，2022 年 4 月起任中央机构编制委员会办公室主任。',
    cites: ['k06-sina-2022-04-30-li-xiaoxin'],
  },
  // --- long-absent generals (联合早报 2026-08-03) ---
  'liu-qingsong': absent(),
  'wu-yanan': absent(),
  'wang-wenquan': absent(),
  'wang-haijiang': absent(),
  'huang-ming': absent(),
  'xu-deqing': absent(),
  'hu-zhongming': { ...absent(), headline: '海军原司令员，海军上将' },
  'xu-xisheng': absent(),
  'xu-qiling': absent(),
  'wang-qiang-pla': { ...absent(), bioTail: '2025 年 12 月中部战区司令员已由韩胜延接任。' },
  'wang-kai-pla': absent(),
  'yang-cheng-pla': absent(),
  'zhao-xiaozhe': {
    ...absent('；同月被中国工程院从院士名单中除名'),
    bioTail: '2026 年 8 月被中国工程院从院士名单中除名。',
    cites: [ZB_GENERALS, 'k06-zaobao-2026-08-18-zhao-xiaozhe'],
  },
  // --- dead ---
  'yu-jianhua': {
    status: 'dead',
    died: '2024-12-10',
    headline: '海关总署原署长，2024 年在任上去世',
    bio:
      '江苏盐城人，长期在商务部工作，曾任商务部党组副书记、国际贸易谈判代表（正部长级）兼副部长，2022 年任海关总署党委书记、署长。' +
      '2024 年 12 月 10 日因突发疾病经抢救无效去世，终年 63 岁。',
    cites: ['k06-zaobao-2024-12-12-yu-jianhua-death'],
  },
}
