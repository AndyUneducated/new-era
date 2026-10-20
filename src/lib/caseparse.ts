// What the build reads out of a person's fall records: the kind of each step, the charges, the sentence,
// the sum, and how it ended. A content/falls record overrides what it states.
import type { CaseRecord, Discipline, Outcome, Plea, Term } from '../data/schema.ts'

export const STEPS = {
  probe: '审查调查',
  removed: '罢免免职',
  disciplined: '党纪处分',
  expelled: '开除',
  charged: '起诉',
  tried: '开庭',
  sentenced: '判决',
  died: '死亡',
  released: '获释',
  other: '其他',
} as const
export type Step = keyof typeof STEPS

// first match wins: a sentence quotes the charges, an expulsion mentions the prosecutors
const STEP_RE: [Step, RegExp][] = [
  ['sentenced', /判处|宣判|被判|判决|改判|判囚|决定执行(死刑|无期|有期)/],
  ['died', /自缢|自杀|坠楼|死亡|去世|逝世|病逝/],
  ['released', /刑满|获释|释放|假释|保外就医/],
  ['expelled', /开除党籍|开除公职|开除军籍|双开|行政开除/],
  ['charged', /提起公诉/],
  ['tried', /开庭/],
  ['disciplined', /留党察看|撤职|降为|降级|撤销党内职务|警告处分|记过|严重警告/],
  ['probe', /立案|审查|调查|带走|侦查|核查|留置|失去人身自由|接受组织|被捕|拘留|双规|落马/],
  ['removed', /罢免|免去|撤销.{0,20}资格|终止.{0,12}代表|免职|辞去/],
]
export const stepOf = (text: string): Step => STEP_RE.find(([, re]) => re.test(text))?.[0] ?? 'other'

// the charges named in the records, longest names first so that 利用影响力受贿 is not also counted as 受贿
const CHARGES = [
  '利用影响力受贿',
  '单位受贿',
  '对有影响力的人行贿',
  '单位行贿',
  '受贿',
  '行贿',
  '贪污',
  '挪用公款',
  '私分国有资产',
  '国有公司人员滥用职权',
  '国有公司、企业人员滥用职权',
  '滥用职权',
  '玩忽职守',
  '巨额财产来源不明',
  '隐瞒境外存款',
  '故意泄露国家秘密',
  '非法获取国家秘密',
  '内幕交易',
  '泄露内幕信息',
  '操纵证券市场',
  '违法发放贷款',
  '非法经营同类营业',
  '为亲友非法牟利',
  '徇私枉法',
  '破坏选举',
  '包庇、纵容黑社会性质组织',
  '组织、领导黑社会性质组织',
  '非法持有枪支',
  '洗钱',
  '职务侵占',
  '非法吸收公众存款',
  '帮助毁灭证据',
  '妨害作证',
  '故意杀人',
  '强奸',
  '颠覆国家政权',
  '煽动颠覆国家政权',
  '分裂国家',
  '煽动分裂国家',
  '寻衅滋事',
  '非法经营',
]
export function chargesIn(text: string): string[] {
  const out = new Set<string>()
  let t = text
  const take = (c: string) => {
    if (!t.includes(`${c}罪`)) return
    out.add(c)
    t = t.split(`${c}罪`).join('□')
  }
  // names with a 、 of their own first, then a list closed by one 罪 (以受贿、滥用职权罪) is spelled out
  CHARGES.filter((c) => c.includes('、')).forEach(take)
  t = t.replace(/((?:[^\s，。；：、□]{2,14}、)+[^\s，。；：、□]{2,14})罪/g, (_, list: string) => list.split('、').map((x) => `${x}罪`).join('、'))
  CHARGES.filter((c) => !c.includes('、')).forEach(take)
  return [...out]
}

const CN: Record<string, number> = { 〇: 0, 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
export function cnNumber(s: string): number {
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s)
  if (s.includes('十')) {
    const [a, b] = s.split('十')
    return (a ? CN[a] : 1) * 10 + (b ? CN[b] : 0)
  }
  return [...s].reduce((n, c) => n * 10 + (CN[c] ?? 0), 0)
}

const NUM = '[0-9０-９.]+|[〇零一二两三四五六七八九十]+'
// mainland 有期徒刑, Hong Kong 判囚 and 监禁, foreign courts' years of prison
const YEARS = new RegExp(`(?:有期徒刑|判囚|监禁)\\s*(${NUM})\\s*年(?:\\s*(${NUM})\\s*个月)?`, 'g')

// the sentence in a step's text; with several charges the one to be served (决定执行) when stated, else the heaviest
export function sentenceIn(text: string): { term: Term; years?: number } | undefined {
  const exec = /(?:决定执行|合并执行|数罪并罚[^，。；]*?)([^。；]*)/.exec(text)?.[1]
  const t = exec && /死刑|无期|有期/.test(exec) ? exec : text
  if (/终身监禁/.test(t)) return { term: 'death-life' }
  if (/死刑[，,]?\s*缓期|死缓/.test(t)) return { term: 'death-suspended' }
  if (/死刑/.test(t)) return { term: 'death' }
  if (/无期徒刑/.test(t)) return { term: 'life' }
  const ys = [...t.matchAll(YEARS)].map((m) => cnNumber(m[1]) + (m[2] ? cnNumber(m[2]) / 12 : 0))
  if (ys.length) return { term: /缓刑/.test(t) ? 'probation' : 'years', years: Math.round(Math.max(...ys) * 10) / 10 }
  if (/免予刑事处罚/.test(t)) return { term: 'exempt' }
}

// a sum in yuan: "受贿 1.39 亿余元", "共计折合人民币7968万余元"; "受贿人民币四千余万元" is not read, nor fines
const SUM = /(?:受贿|贪污|收受|索取|涉案|非法所得|财物)[^。；]{0,24}?(?:折合|共计|计)?(?:人民币)?\s*([0-9.]+)\s*(亿|万)余?元/g
// the largest sum named as taken; fines, confiscations and a part (其中……本人) do not count
export function amountIn(text: string): number | undefined {
  const sums = [...text.matchAll(SUM)]
    .filter((m) => !/罚金|罚款|没收|罚没|损失/.test(m[0]) && !/其中|本人/.test(text.slice(Math.max(0, m.index - 8), m.index) + m[0]))
    .map((m) => Number(m[1]) * (m[2] === '亿' ? 1e8 : 1e4))
  return sums.length ? Math.max(...sums) : undefined
}

// mitigating circumstances in a verdict: "有自首情节，如实供述……认罪悔罪，积极退缴全部赃款"; a clause that
// denies one (不构成自首、拒不认罪) does not count. With a name, only sentences naming them are read, since
// one report often covers several defendants.
const PLEA_RE: [Plea, RegExp][] = [
  ['surrender', /自首/],
  ['merit', /立功表现|构成(?:重大)?立功|揭发他人犯罪/],
  ['refund', /退赃|退缴|退赔|退还(?:全部)?赃款/],
  ['plea', /认罪认罚|认罪悔罪|认罪、悔罪|当庭认罪|自愿认罪|认罪服法/],
]
const DENIED = /不(?:构成|认定|成立|具有|属于|予认定|能认定)|未能|没有|并非|否认|拒不|翻供/
// a court ordering the money back (责令退赔、继续追缴) is not the defendant returning it
const ORDERED = /责令|追缴|没收/
export function pleasIn(text: string, name?: string): Plea[] {
  const out = new Set<Plea>()
  for (const s of text.split(/[。\n]/)) {
    if (name && !s.includes(name)) continue
    for (const c of s.split(/[，,；;：:]/)) {
      if (DENIED.test(c)) continue
      for (const [k, re] of PLEA_RE) if (re.test(c) && !(k === 'refund' && ORDERED.test(c))) out.add(k)
    }
  }
  return PLEA_RE.map(([k]) => k).filter((k) => out.has(k))
}

// the wording of the notices (decisions #41): stock phrases of the CCDI, counted in the full text of each notice
export const PHRASES: { id: string; label: string; terms: string[] }[] = [
  { id: 'faith', label: '理想信念丧失', terms: ['理想信念丧失', '丧失理想信念', '背弃理想信念'] },
  { id: 'disloyal', label: '对党不忠诚不老实', terms: ['对党不忠诚', '不忠诚不老实'] },
  { id: 'resist', label: '对抗组织审查', terms: ['对抗组织审查', '对抗审查'] },
  { id: 'twofaced', label: '两面人', terms: ['两面人', '两面派'] },
  { id: 'clique', label: '搞团团伙伙、拉帮结派', terms: ['团团伙伙', '拉帮结派', '小圈子', '结党营私', '山头主义'] },
  { id: 'gang', label: '政治团伙、政治野心', terms: ['政治团伙', '政治野心', '野心膨胀', '篡党夺权', '阴谋'] },
  { id: 'gossip', label: '妄议党中央', terms: ['妄议党中央', '妄议中央'] },
  { id: 'attach', label: '搞政治攀附', terms: ['政治攀附'] },
  { id: 'superstition', label: '搞迷信活动', terms: ['迷信活动', '封建迷信'] },
  { id: 'sex', label: '权色交易、通奸', terms: ['权色交易', '通奸', '不正当性关系', '生活腐化', '道德败坏'] },
  { id: 'family', label: '家族式腐败', terms: ['家族式腐败', '家风败坏', '纵容亲属', '纵容、默许亲属', '一家两制'] },
  { id: 'nostop', label: '十八大后不收敛不收手', terms: ['不收敛不收手', '不收敛、不收手'] },
  { id: 'trade', label: '权钱交易', terms: ['权钱交易'] },
  { id: 'hunted', label: '甘于被围猎', terms: ['被围猎', '被“围猎”'] },
  { id: 'soe', label: '靠企吃企', terms: ['靠企吃企'] },
  { id: 'umbrella', label: '充当保护伞', terms: ['保护伞'] },
  { id: 'posts', label: '卖官鬻爵、选人用人', terms: ['卖官鬻爵', '买官卖官', '选人用人', '在干部选拔任用'] },
  { id: 'gifts', label: '违规收受礼金', terms: ['收受礼金', '收受礼品'] },
  { id: 'feast', label: '公款吃喝、打高尔夫', terms: ['公款吃喝', '高尔夫', '接受宴请', '接受可能影响公正执行公务的宴请'] },
  { id: 'judiciary', label: '干预司法', terms: ['干预司法', '插手司法'] },
  { id: 'formalism', label: '形式主义、官僚主义', terms: ['形式主义', '官僚主义', '政绩观'] },
  { id: 'report', label: '不如实报告个人事项', terms: ['个人有关事项', '不如实说明', '组织函询时不如实'] },
]
export const phrasesIn = (text: string) => PHRASES.filter((x) => x.terms.some((t) => text.includes(t))).map((x) => x.id)

const DISC: Record<string, Discipline> = { 政治: 'political', 组织: 'organization', 廉洁: 'integrity', 群众: 'mass', 工作: 'work', 生活: 'life' }
// "严重违反党的政治纪律、组织纪律、廉洁纪律和生活纪律"; "违反中央八项规定精神"
export function disciplinesIn(text: string): Discipline[] {
  const out = new Set<Discipline>()
  for (const m of text.matchAll(/违反(?:了)?(?:党的)?((?:(?:政治|组织|廉洁|群众|工作|生活)纪律[、和及与，]*)+)/g))
    for (const k of m[1].matchAll(/(政治|组织|廉洁|群众|工作|生活)纪律/g)) out.add(DISC[k[1]])
  if (/八项规定/.test(text)) out.add('eight')
  return [...out]
}

export interface FallStep { date: string; text: string; cite: string }
export interface Parsed {
  steps: { date: string; kind: Step }[]
  charges: string[]
  term?: Term
  years?: number
  yuan?: number
  outcome: Outcome
  // the first step, the expulsion and the first sentence
  on?: string
  expelled?: string
  sentenced?: string
  // stock phrases found in the full text of the notice, and the disciplines it names
  phrases: string[]
  disc: Discipline[]
  // mitigating circumstances found by the court, from the verdict and the record
  pleas: Plea[]
}

// `text` gives the full text of a cited source, for the notice and the verdict behind the steps; `name`
// picks their sentences out of a verdict report that covers several defendants
export function parseFall(
  fall: FallStep[],
  status: string,
  rec?: Omit<CaseRecord, 'file'>,
  text: (cite: string) => string | undefined = () => undefined,
  name?: string,
): Parsed {
  const steps = [...fall].sort((a, b) => a.date.localeCompare(b.date)).map((f) => ({ date: f.date, kind: stepOf(f.text), text: f.text, cite: f.cite }))
  // the notice: the one named in the record, else the expulsion's or the punishment's source
  const noticeCite = rec?.notice?.cite ?? steps.find((s) => s.kind === 'expelled')?.cite ?? steps.find((s) => s.kind === 'disciplined')?.cite
  const notice = (noticeCite && text(noticeCite)) || ''
  const verdict = steps
    .filter((s) => s.kind === 'sentenced')
    .map((s) => text(s.cite) ?? '')
    .join('\n')
  const charges = [...new Set(steps.flatMap((s) => (s.kind === 'sentenced' || s.kind === 'charged' || s.kind === 'expelled' ? chargesIn(s.text) : [])))]
  const sentencedStep = steps.find((s) => s.kind === 'sentenced' && sentenceIn(s.text))
  const parsedSentence = steps
    .filter((s) => s.kind === 'sentenced')
    .map((s) => sentenceIn(s.text))
    .filter(Boolean)
    .at(-1)
  const sentence = rec?.sentence ? { term: rec.sentence.term, years: rec.sentence.years } : parsedSentence
  const yuan = rec?.amount?.yuan ?? steps.map((s) => amountIn(s.text)).find((x) => x !== undefined) ?? amountIn(verdict)
  const has = (k: Step) => steps.some((s) => s.kind === k)
  const all = steps.map((s) => s.text).join(' ')
  const outcome: Outcome =
    rec?.outcome ??
    (status === 'missing'
      ? 'missing'
      : /自缢|自杀|坠楼身亡/.test(all)
        ? 'suicide'
        : sentence?.term !== 'death' && (has('died') || (status === 'dead' && steps.length && !sentence))
          ? 'died'
          : /外逃|出逃|潜逃|滞留境外/.test(all)
            ? 'fled'
            : has('released')
              ? 'released'
              : sentence
                ? 'sentenced'
                : has('expelled')
                  ? 'expelled'
                  : has('disciplined')
                    ? 'disciplined'
                    : 'probe')
  return {
    steps: steps.map(({ date, kind }) => ({ date, kind })),
    charges,
    term: sentence?.term,
    years: sentence?.years,
    yuan,
    outcome,
    on: steps[0]?.date,
    expelled: steps.find((s) => s.kind === 'expelled')?.date,
    sentenced: rec?.sentence?.date ?? sentencedStep?.date,
    phrases: phrasesIn([notice, ...(rec?.notice?.quotes ?? [])].join('\n')),
    disc: rec?.discipline?.length ? rec.discipline : disciplinesIn(notice),
    pleas: [
      ...new Set([
        ...(rec?.plea ?? []).map((x) => x.kind),
        ...pleasIn(steps.filter((s) => s.kind === 'sentenced').map((s) => s.text).join('。')),
        ...(name ? pleasIn(verdict, name) : []),
      ]),
    ],
  }
}
