// What the build reads out of a person's fall records: the kind of each step, the charges, the sentence,
// the sum, and how it ended. A content/falls record overrides what it states.
import type { CaseRecord, Outcome, Term } from '../data/schema.ts'

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
  ['sentenced', /判处|宣判|被判|判决|改判|判囚/],
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

// a sum in yuan: "受贿 1.39 亿余元", "受贿折合 7910 万余元", "受贿人民币四千余万元" is not read
const SUM = /(?:受贿|贪污|收受|索取|涉案|非法所得|财物)[^。；]{0,24}?(?:折合|共计|计)?(?:人民币)?\s*([0-9.]+)\s*(亿|万)余?元/
export function amountIn(text: string): number | undefined {
  const m = SUM.exec(text)
  if (!m) return undefined
  return Number(m[1]) * (m[2] === '亿' ? 1e8 : 1e4)
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
}

export function parseFall(fall: FallStep[], status: string, rec?: Omit<CaseRecord, 'file'>): Parsed {
  const steps = [...fall].sort((a, b) => a.date.localeCompare(b.date)).map((f) => ({ date: f.date, kind: stepOf(f.text), text: f.text }))
  const charges = [...new Set(steps.flatMap((s) => (s.kind === 'sentenced' || s.kind === 'charged' || s.kind === 'expelled' ? chargesIn(s.text) : [])))]
  const sentencedStep = steps.find((s) => s.kind === 'sentenced' && sentenceIn(s.text))
  const parsedSentence = steps
    .filter((s) => s.kind === 'sentenced')
    .map((s) => sentenceIn(s.text))
    .filter(Boolean)
    .at(-1)
  const sentence = rec?.sentence ? { term: rec.sentence.term, years: rec.sentence.years } : parsedSentence
  const yuan = rec?.amount?.yuan ?? steps.map((s) => amountIn(s.text)).find((x) => x !== undefined)
  const has = (k: Step) => steps.some((s) => s.kind === k)
  const all = steps.map((s) => s.text).join(' ')
  const outcome: Outcome =
    rec?.outcome ??
    (status === 'missing'
      ? 'missing'
      : /自缢|自杀|坠楼身亡/.test(all)
        ? 'suicide'
        : has('died') || (status === 'dead' && steps.length)
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
  }
}
