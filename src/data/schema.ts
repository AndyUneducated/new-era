// Record shapes for everything under content/ and research/. Shared by the data build (plain Node)
// and the browser, so nothing here may depend on Vite or React.
import { z } from 'zod'

// YAML reads a bare year as a number; every date is kept as a string of 4, 7 or 10 characters
export const PartialDate = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine((s) => /^\d{4}(-\d{2}(-\d{2})?)?$/.test(s), 'expected YYYY, YYYY-MM or YYYY-MM-DD')

// a source id, optionally with an anchor after @ (a paragraph, page or date inside the source)
export const Cite = z.string().min(1)

export const VOICES = {
  doc: '官方文件',
  official: '官方报道',
  history: '后来官方',
  west: '西方媒体',
  japan: '日本媒体',
  zh: '中文媒体',
  scholar: '学者',
  witness: '当事人',
  wiki: '维基',
  site: '本站',
} as const
export type Voice = keyof typeof VOICES
const VoiceEnum = z.enum(Object.keys(VOICES) as [Voice, ...Voice[]])

// voices that may carry a faction label (decisions #6)
export const FACTION_VOICES: Voice[] = ['west', 'japan', 'zh', 'scholar', 'official']

export const SourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string().optional(),
  author: z.string().optional(),
  date: PartialDate.optional(),
  voice: VoiceEnum,
  url: z.string().url(),
  lang: z.enum(['zh', 'en', 'ja']).default('zh'),
  excerpt: z.boolean().optional(),
  // hearsay: partisan outlets, self-media, social posts, gossip; shown with a mark, never sets a status (decisions #27)
  rumor: z.boolean().optional(),
  hasText: z.boolean().default(false),
})
export type Source = z.infer<typeof SourceSchema>

const Dated = { from: PartialDate.optional(), to: PartialDate.optional() }

export const ROLES = {
  psc: '政治局常委',
  pb: '政治局委员',
  sec: '书记处书记',
  cmc: '军委委员',
  cc: '中央委员',
  acc: '候补中委',
  ccdi: '中纪委',
  prov: '省级主官',
  minister: '部长级',
  general: '将领',
  tiger: '落马',
  dissent: '体制外',
  biz: '企业家',
  hkmt: '港澳台',
  scholar: '学者',
  media: '媒体人',
  family: '家属',
} as const
export type Role = keyof typeof ROLES

export const STATUS = {
  active: '在任',
  retired: '退休',
  purged: '落马',
  detained: '在押',
  // released or never charged, but under watch, house arrest or travel bans
  watched: '受监控',
  exiled: '流亡',
  missing: '下落不明',
  dead: '去世',
} as const
export type Status = keyof typeof STATUS

export const SYSTEMS = { party: '党', gov: '政', army: '军', other: '其他' } as const
export type Sys = keyof typeof SYSTEMS

export const PositionSchema = z.object({
  title: z.string(),
  sys: z.enum(Object.keys(SYSTEMS) as [Sys, ...Sys[]]).default('party'),
  // province or municipality, for the career geography
  place: z.string().optional(),
  ...Dated,
  cite: Cite.optional(),
})

export const VoicedSchema = z.object({
  voice: VoiceEnum,
  text: z.string(),
  cite: Cite,
  // the text is verbatim from cite (checked); otherwise it is a paraphrase and is not checked
  quote: z.boolean().optional(),
  // a translation of a foreign-language quote, not checked
  zh: z.string().optional(),
})

// rings of a faction, from the patron outward (decisions #24)
export const RANKS = { elder: '元老', core: '核心', backbone: '骨干', periphery: '外围' } as const
export type Rank = keyof typeof RANKS

export const FactionTagSchema = z.object({
  f: z.string(),
  cite: Cite,
  // the sentence in the source that makes the label, checked verbatim (decisions #3 and #5)
  quote: z.string().optional(),
  zh: z.string().optional(),
  rank: z.enum(Object.keys(RANKS) as [Rank, ...Rank[]]).optional(),
  // a sentence in cite that places the person in that ring, checked verbatim; without it the rank is the editor's
  rankQuote: z.string().optional(),
  ...Dated,
})
export type FactionTag = z.infer<typeof FactionTagSchema>

export const LifeSchema = z.object({
  h: z.string(),
  ...Dated,
  text: z.string(),
  cites: z.array(Cite).min(1),
})

export const FallStepSchema = z.object({ date: PartialDate, text: z.string(), cite: Cite })

export const PersonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  pinyin: z.string().optional(),
  aka: z.array(z.string()).default([]),
  gender: z.enum(['m', 'f']).optional(),
  ethnicity: z.string().optional(),
  born: PartialDate.optional(),
  died: PartialDate.optional(),
  birthplace: z.string().optional(),
  origin: z.string().optional(),
  education: z.array(z.object({ school: z.string(), degree: z.string().optional(), ...Dated })).default([]),
  joinedParty: PartialDate.optional(),
  joinedWork: PartialDate.optional(),
  roles: z.array(z.enum(Object.keys(ROLES) as [Role, ...Role[]])).min(1),
  status: z.enum(Object.keys(STATUS) as [Status, ...Status[]]),
  statusNote: z.string().optional(),
  // a fall from office: investigation, expulsion, sentence
  fall: z.array(FallStepSchema).default([]),
  // 1: full biography; 2: dossier card
  tier: z.union([z.literal(1), z.literal(2)]),
  headline: z.string(),
  bio: z.string(),
  positions: z.array(PositionSchema).default([]),
  life: z.array(LifeSchema).default([]),
  assess: z.array(VoicedSchema).default([]),
  family: z.array(z.object({ name: z.string(), rel: z.string(), text: z.string(), cites: z.array(Cite).min(1) })).default([]),
  factions: z.array(FactionTagSchema).default([]),
  ids: z.object({ wikidata: z.string().regex(/^Q\d+$/).optional() }).default({}),
  cites: z.array(Cite).min(1),
  verify: z.boolean().optional(),
  photo: z
    .object({ src: z.string(), url: z.string().optional(), author: z.string().optional(), license: z.string().optional(), date: z.string().optional(), focus: z.string().optional() })
    .optional(),
})
export type Person = z.infer<typeof PersonSchema>

export const QUOTE_KINDS = { public: '公开讲话', adlib: '即兴', interview: '采访', leaked: '转述', rumor: '流传，未经证实' } as const
export type QuoteKind = keyof typeof QUOTE_KINDS

export const QuoteSchema = z.object({
  text: z.string(),
  cite: Cite,
  kind: z.enum(Object.keys(QUOTE_KINDS) as [QuoteKind, ...QuoteKind[]]),
  date: PartialDate.optional(),
  occasion: z.string().optional(),
  zh: z.string().optional(),
  // shown on cards and the person's hero
  star: z.boolean().optional(),
})
export type Quote = z.infer<typeof QuoteSchema>

export const FRAMES = {
  classic: { name: '胡温时期经典框架', short: '经典' },
  binary: { name: '李成：精英联盟 / 民粹联盟', short: '两派' },
  xi: { name: '习时期履历网络', short: '习系' },
  purged: { name: '被清洗集团', short: '清洗' },
  army: { name: '军队派系', short: '军队' },
} as const
export type Frame = keyof typeof FRAMES

export const FactionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  en: z.string().optional(),
  aka: z.array(z.string()).default([]),
  frame: z.enum(Object.keys(FRAMES) as [Frame, ...Frame[]]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  ...Dated,
  // the figures the faction is named after or gathered around
  core: z.array(z.string()).default([]),
  // the one person at the centre of the faction's rings, when there is one
  patron: z.string().optional(),
  // what holds it together: 地缘、系统、出身、共事、秘书……
  basis: z.string(),
  summary: z.string(),
  voices: z.array(VoicedSchema).default([]),
  cites: z.array(Cite).min(1),
})
export type Faction = z.infer<typeof FactionSchema>

// a tie between two people; a is the senior side: a promoted b, b was a's secretary
export const RELATIONS = { patron: '提携', secretary: '秘书', colleague: '共事', kin: '姻亲', rival: '对立' } as const
export type RelKind = keyof typeof RELATIONS

export const RelationSchema = z.object({
  a: z.string(),
  b: z.string(),
  kind: z.enum(Object.keys(RELATIONS) as [RelKind, ...RelKind[]]),
  text: z.string(),
  ...Dated,
  cite: Cite,
  quote: z.string().optional(),
})
export type Relation = z.infer<typeof RelationSchema>

export const LANES = {
  prelude: '前史',
  power: '人事与会议',
  purge: '反腐与清洗',
  army: '军队',
  ideo: '意识形态',
  econ: '经济与改革',
  society: '社会与维稳',
  ethnic: '民族与宗教',
  hkmt: '港澳台',
  foreign: '外交',
  folk: '民间话语',
} as const
export type Lane = keyof typeof LANES

export const EventSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  date: PartialDate,
  end: PartialDate.optional(),
  title: z.string(),
  lane: z.enum(Object.keys(LANES) as [Lane, ...Lane[]]),
  // drawn larger and labelled at every zoom
  major: z.boolean().optional(),
  summary: z.string(),
  people: z.array(z.string()).default([]),
  factions: z.array(z.string()).default([]),
  concepts: z.array(z.string()).default([]),
  voices: z.array(VoicedSchema).default([]),
  cites: z.array(Cite).min(1),
  verify: z.boolean().optional(),
})
export type Event = z.infer<typeof EventSchema>

export const CONCEPT_KINDS = {
  guiding: '指导思想',
  component: '思想组成',
  formula: '提法',
  document: '意识形态文件',
  trend: '民间思潮',
  debate: '论争',
} as const
export type ConceptKind = keyof typeof CONCEPT_KINDS

export const ConceptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  en: z.string().optional(),
  kind: z.enum(Object.keys(CONCEPT_KINDS) as [ConceptKind, ...ConceptKind[]]),
  parent: z.string().optional(),
  by: z.array(z.string()).default([]),
  // the first appearance found in the library
  first: z.object({ date: PartialDate, text: z.string(), cite: Cite, quote: z.string().optional() }).optional(),
  // written into the party charter, the constitution, a resolution or a plenum communique
  codified: z.array(z.object({ date: PartialDate, where: z.string(), cite: Cite, quote: z.string().optional() })).default([]),
  summary: z.string(),
  quote: z.object({ text: z.string(), cite: Cite }).optional(),
  // strings counted in the corpus for the frequency view; the name is used when empty
  terms: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  voices: z.array(VoicedSchema).default([]),
  // the long entry: origin, content, how it changed, how it was received (decisions #52)
  sections: z.array(LifeSchema).default([]),
  // numbered official lists (十个明确, 十四个坚持 …); every item verbatim in cite
  lists: z.array(z.object({ title: z.string(), cite: Cite, items: z.array(z.string()).min(1) })).default([]),
  // a debate: the positions, who held them and where they said it
  sides: z.array(z.object({ label: z.string(), text: z.string(), who: z.array(z.string()).default([]), cites: z.array(Cite).min(1) })).default([]),
  // idea → policy → event: what the idea was turned into
  policies: z.array(z.object({ date: PartialDate, name: z.string(), text: z.string(), events: z.array(z.string()).default([]), cite: Cite })).default([]),
  cites: z.array(Cite).min(1),
})
// content/concept-more/*.yaml maps concept id → fields a later batch appends to a concept it does not own
export const ConceptMoreSchema = ConceptSchema.pick({ by: true, codified: true, terms: true, related: true, voices: true, sections: true, lists: true, sides: true, policies: true })
  .partial()
  .extend({ cites: z.array(Cite).default([]) })
export type ConceptMore = z.infer<typeof ConceptMoreSchema>
export type Concept = z.infer<typeof ConceptSchema>

// a central committee term: who sat where, from the Xinhua lists (decisions: congress backbone)
export const CongressSchema = z.object({
  n: z.number().int().min(13).max(25),
  opened: PartialDate,
  closed: PartialDate.optional(),
  gs: z.string(),
  // standing committee in announced rank order
  psc: z.array(z.string()),
  // other full members in the announced (stroke) order
  pb: z.array(z.string()),
  alt: z.array(z.string()).default([]),
  sec: z.array(z.string()).default([]),
  cmc: z.array(z.object({ id: z.string(), title: z.string() })).default([]),
  // central committee full and alternate members by name, in the announced order; names with an entry link to it
  cc: z.array(z.string()).default([]),
  cca: z.array(z.string()).default([]),
  // list name → person id, for names that several entries share
  names: z.record(z.string(), z.string()).default({}),
  changes: z.array(z.object({ date: PartialDate, person: z.string(), kind: z.enum(['out', 'in', 'died']), text: z.string(), cite: Cite })).default([]),
  cites: z.array(Cite).min(1),
})
export type Congress = z.infer<typeof CongressSchema>

// texts in the corpus for the frequency view; the id is a source id with full text.
// editorial: the sample of 人民日报 editorials and commentator articles (decisions #25); qiushi: 求是 lead articles
export const CorpusDocSchema = z.object({
  id: z.string(),
  short: z.string(),
  kind: z.enum(['congress', 'gov', 'plenum', 'resolution', 'charter', 'constitution', 'editorial', 'qiushi']),
  date: PartialDate,
})
export type CorpusDoc = z.infer<typeof CorpusDocSchema>

// 主义: a doctrine, line, trend or label and where it stood at given moments on three axes (decisions #23, #26).
// Positions are the editor's judgment of relative stance, not measurements; a label is placed where its
// accusers put the accused.
export const ISM_KINDS = {
  core: '官方正统',
  line: '党内路线',
  trend: '民间思潮',
  foreign: '外来 · 对立面',
  label: '罪名 · 标签',
} as const
export type IsmKind = keyof typeof ISM_KINDS
export const AXES = {
  x: { name: '经济', ends: ['国家主导 · 公有', '市场 · 民营'] },
  y: { name: '政治', ends: ['集中 · 管控', '宽松 · 制度化 · 多元'] },
  z: { name: '对外', ends: ['韬光养晦 · 融入', '强硬 · 自主 · 对抗'] },
} as const
export type Axis = keyof typeof AXES
const AxisValue = z.number().min(-1).max(1)
export const SpotSchema = z.object({ at: PartialDate, x: AxisValue, y: AxisValue, z: AxisValue, note: z.string().optional() })
export const IsmSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  short: z.string().optional(),
  en: z.string().optional(),
  kind: z.enum(Object.keys(ISM_KINDS) as [IsmKind, ...IsmKind[]]),
  from: PartialDate,
  to: PartialDate.optional(),
  // where it came from, and what it was raised against (ism ids)
  parents: z.array(z.string()).default([]),
  against: z.array(z.string()).default([]),
  // strings counted in the corpus; occurrences inside the `except` strings are not counted
  terms: z.array(z.string()).default([]),
  except: z.array(z.string()).default([]),
  // person ids of its advocates
  carriers: z.array(z.string()).default([]),
  concept: z.string().optional(),
  summary: z.string(),
  pos: z.array(SpotSchema).default([]),
  voices: z.array(VoicedSchema).default([]),
  cites: z.array(Cite).min(1),
})
export type Ism = z.infer<typeof IsmSchema>
// the turns of the central line on the same three axes
export const LinePointSchema = SpotSchema.extend({ label: z.string(), cite: Cite })
export type LinePoint = z.infer<typeof LinePointSchema>

// a slogan or keyword followed through 人民日报: yearly article counts from a searchable archive (`hits`,
// `cite` names the archive and how it was searched), and its rate in the editorial sample, counted at build time
export const PressTermSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  terms: z.array(z.string()).min(1),
  except: z.array(z.string()).default([]),
  concept: z.string().optional(),
  ism: z.string().optional(),
  hits: z.array(z.object({ year: z.number().int().min(1946).max(2100), n: z.number().int().min(0) })).default([]),
  cite: Cite.optional(),
})
export type PressTerm = z.infer<typeof PressTermSchema>

// the 31 provincial-level units in the short form of the map, grouped by region (the 诸侯图 rows)
export const REGIONS = {
  华北: ['北京', '天津', '河北', '山西', '内蒙古'],
  东北: ['辽宁', '吉林', '黑龙江'],
  华东: ['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'],
  中南: ['河南', '湖北', '湖南', '广东', '广西', '海南'],
  西南: ['重庆', '四川', '贵州', '云南', '西藏'],
  西北: ['陕西', '甘肃', '青海', '宁夏', '新疆'],
} as const
export type Province = (typeof REGIONS)[keyof typeof REGIONS][number]
export const PROVINCES = Object.values(REGIONS).flat() as Province[]
export const POSTS = { sec: '党委书记', gov: '省长 / 主席 / 市长' } as const
// one tenure of a provincial party secretary or governor (acting periods included, marked `acting`);
// `person` links an entry of the site, `name` is always written
export const ChiefSchema = z.object({
  prov: z.enum(PROVINCES as [Province, ...Province[]]),
  post: z.enum(Object.keys(POSTS) as [keyof typeof POSTS, ...(keyof typeof POSTS)[]]),
  name: z.string(),
  person: z.string().optional(),
  from: PartialDate,
  to: PartialDate.optional(),
  acting: z.boolean().optional(),
  note: z.string().optional(),
  cite: Cite,
})
export type Chief = z.infer<typeof ChiefSchema>

// the home page's scroll story: chapters of short editorial narration; each step names the events and
// people it is about and the picture the sticky stage shows while it is read
const Ids = z.array(z.string()).default([])
export const StageSchema = z.discriminatedUnion('kind', [
  // a Politburo hemicycle, the `focus` seats lit and the rest dimmed
  z.object({ kind: z.literal('seats'), n: z.number().int(), frame: z.enum(Object.keys(FRAMES) as [Frame, ...Frame[]]), focus: Ids }),
  // every fallen person in the data as a dot in the year of the first step against them
  z.object({ kind: z.literal('falls'), from: z.number().int(), to: z.number().int(), focus: Ids }),
  // a passage of an official text, `strike` crossed out; `text` is checked against the source
  z.object({ kind: z.literal('doc'), head: z.string(), text: z.string(), strike: z.string().optional(), cite: Cite }),
  // the military commissions of the listed congresses, a seal on everyone who has fallen by `at`
  z.object({ kind: z.literal('cmc'), n: z.array(z.number().int()).min(1), at: PartialDate }),
])
export type Stage = z.infer<typeof StageSchema>
export const ChapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  years: z.union([z.string(), z.number()]).transform(String),
  steps: z
    .array(z.object({ text: z.string(), events: Ids, people: Ids, stage: StageSchema }))
    .min(1),
})
export type Chapter = z.infer<typeof ChapterSchema>

// ───────── falls (decisions #41–#46) ─────────
// content/falls/*.yaml maps person id → what the fall records do not say: the system, the rank, the wording
// of the notice, the money, what set it off, who went down with them, and how it bears on the struggle
// for power. Steps, charges, sentence and outcome are also read from the fall records at build time.
export const CASE_SYS = {
  local: '地方党政',
  central: '中央和国家机关',
  law: '政法公安',
  army: '军队武警',
  finance: '金融',
  soe: '国有企业',
  edu: '高校科研',
  culture: '宣传文化体育',
  health: '医疗卫生',
  other: '其他',
} as const
export type CaseSys = keyof typeof CASE_SYS
// the rank held when the first step against them was taken
export const GRADES = {
  state: '副国级以上',
  minister: '正部级',
  vice: '副部级',
  bureau: '厅局级',
  county: '县处级及以下',
  general: '上将',
  lieutenant: '中将',
  major: '少将',
  exec: '国企金融高管',
  none: '无职级',
} as const
export type Grade = keyof typeof GRADES
// how the case came to light, as reported
export const TRIGGERS = {
  inspect: '巡视巡察',
  report: '实名举报',
  media: '媒体或网络曝光',
  chain: '他案牵出',
  audit: '审计',
  surrender: '主动投案',
  incident: '事故或事件追责',
  unknown: '未公开',
} as const
export type Trigger = keyof typeof TRIGGERS
// the six disciplines a notice says were broken (the 2015 regulations), and the eight-point rules
export const DISCIPLINES = {
  political: '政治纪律',
  organization: '组织纪律',
  integrity: '廉洁纪律',
  mass: '群众纪律',
  work: '工作纪律',
  life: '生活纪律',
  eight: '八项规定精神',
} as const
export type Discipline = keyof typeof DISCIPLINES
export const TERMS = {
  death: '死刑',
  'death-life': '死缓，终身监禁',
  'death-suspended': '死缓',
  life: '无期徒刑',
  years: '有期徒刑',
  probation: '缓刑',
  exempt: '免予刑事处罚',
} as const
export type Term = keyof typeof TERMS
// an executed official counts as sentenced; died is for deaths under investigation or in prison
export const OUTCOMES = {
  probe: '审查调查中',
  expelled: '已开除，待审判',
  sentenced: '已判刑',
  disciplined: '党纪政务处分',
  suicide: '自杀',
  died: '审查期间或服刑中去世',
  fled: '外逃',
  released: '刑满或获释',
  missing: '下落不明',
  back: '复出',
} as const
export type Outcome = keyof typeof OUTCOMES
// who fell with them, from their side: the patron above, the protégé below, the secretary, family, businessmen
export const CHAIN_RELS = { patron: '靠山', protege: '提拔的下属', secretary: '秘书', kin: '家属', business: '商人', colleague: '同僚', briber: '行贿者' } as const
export type ChainRel = keyof typeof CHAIN_RELS
// the editor's reading of how far a case belongs to the struggle for power (decisions #43)
export const POLITICS = { core: '权力斗争核心案', linked: '与派系或靠山清洗相关', none: '未见政治关联' } as const
export type Politics = keyof typeof POLITICS

// the editor's own analysis, always shown apart from sourced facts, with what it rests on (decisions #43)
export const EditorSchema = z.object({ text: z.string(), cites: z.array(Cite).min(1) })

export const CaseRecordSchema = z.object({
  sys: z.enum(Object.keys(CASE_SYS) as [CaseSys, ...CaseSys[]]),
  grade: z.enum(Object.keys(GRADES) as [Grade, ...Grade[]]),
  // the notice that expelled or punished them; every phrase is checked verbatim against cite
  notice: z.object({ date: PartialDate, cite: Cite, quotes: z.array(z.string()).min(1) }).optional(),
  discipline: z.array(z.enum(Object.keys(DISCIPLINES) as [Discipline, ...Discipline[]])).default([]),
  // bribes or other sums as found by the court or the notice, in yuan
  amount: z.object({ yuan: z.number().positive(), text: z.string(), cite: Cite }).optional(),
  // only where the fall records do not state it in words the build can read
  sentence: z.object({ date: PartialDate, term: z.enum(Object.keys(TERMS) as [Term, ...Term[]]), years: z.number().optional(), cite: Cite }).optional(),
  trigger: z.object({ kind: z.enum(Object.keys(TRIGGERS) as [Trigger, ...Trigger[]]), text: z.string(), cite: Cite }).optional(),
  with: z
    .array(z.object({ id: z.string().optional(), name: z.string(), rel: z.enum(Object.keys(CHAIN_RELS) as [ChainRel, ...ChainRel[]]), text: z.string(), cite: Cite }))
    .default([]),
  politics: z.object({ level: z.enum(Object.keys(POLITICS) as [Politics, ...Politics[]]), why: z.string(), cites: z.array(Cite).min(1) }).optional(),
  // what outlets and scholars say about the case, rumor sources included and marked
  voices: z.array(VoicedSchema).default([]),
  outcome: z.enum(Object.keys(OUTCOMES) as [Outcome, ...Outcome[]]).optional(),
  // left the last post before the first step against them
  retired: PartialDate.optional(),
  // steps the card in another batch's file does not have yet (an expulsion, a sentence), added to its fall,
  // and the status they lead to; both from reliable sources only
  fall: z.array(FallStepSchema).default([]),
  status: z.enum(Object.keys(STATUS) as [Status, ...Status[]]).optional(),
  statusNote: z.string().optional(),
})
export type CaseRecord = z.infer<typeof CaseRecordSchema>

// a long-form case study, a collapse in one province or a sweep through one system (content/cases/*.yaml)
export const CASE_KINDS = { case: '案件', cluster: '塌方', system: '系统' } as const
export type CaseKind = keyof typeof CASE_KINDS
export const CaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  kind: z.enum(Object.keys(CASE_KINDS) as [CaseKind, ...CaseKind[]]),
  years: z.union([z.string(), z.number()]).transform(String),
  lead: z.string().optional(),
  people: z.array(z.string()).min(1),
  summary: z.string(),
  sections: z.array(LifeSchema).min(1),
  voices: z.array(VoicedSchema).default([]),
  editor: z.array(EditorSchema).default([]),
  events: Ids,
  factions: Ids,
  cites: z.array(Cite).min(1),
})
export type Case = z.infer<typeof CaseSchema>

// ───────── turning points (decisions #48–#51) ─────────
// content/turns/*.yaml maps person id → the moments that lifted them, the route they rose by, the ages at
// each rung, and what an ordinary reader can and cannot take from it
export const ROUTES = {
  secretary: '秘书',
  youth: '共青团',
  local: '地方实干',
  technocrat: '技术官僚',
  industry: '军工航天与国企',
  princeling: '红二代',
  frontier: '边疆与艰苦地区',
  patron: '跟对领导',
  crisis: '危机处置',
  writer: '笔杆子',
  scholar: '学者从政',
  army: '军中',
  law: '政法',
  ccdi: '纪检',
  base: '基层与知青',
  veteran: '革命资历',
  echelon: '第三梯队与干部年轻化',
  worker: '工人与劳模',
  staff: '中办与政研幕僚',
  mass: '群团（工会、妇联）',
  comeback: '降级后复起',
  successor: '接手落马者的位置',
  diplomat: '外交系统',
  finance: '金融系统',
  media: '新闻宣传',
  combat: '实战与战功',
  political: '军中政工',
} as const
export type Route = keyof typeof ROUTES
export const RUNGS = { county: '县处级', bureau: '厅局级', vice: '副部级', minister: '正部级', pb: '政治局委员', psc: '政治局常委' } as const
export type Rung = keyof typeof RUNGS
export const TurnRecordSchema = z.object({
  // the editor's classification, most important first
  routes: z.array(z.enum(Object.keys(ROUTES) as [Route, ...Route[]])).min(1),
  rungs: z.array(z.object({ rung: z.enum(Object.keys(RUNGS) as [Rung, ...Rung[]]), date: PartialDate, post: z.string(), cite: Cite })).default([]),
  turns: z
    .array(
      z.object({
        date: PartialDate,
        h: z.string(),
        // what happened, what they did, and who mattered; prose is checked like a biography's
        text: z.string(),
        did: z.string(),
        who: Ids,
        cites: z.array(Cite).min(1),
      }),
    )
    .min(1),
  // what an ordinary person can use, and what came from luck, birth or connections
  can: EditorSchema,
  cannot: EditorSchema,
  // people on the same road who did not get through, or got through and then fell
  counter: z.array(z.object({ id: z.string().optional(), name: z.string(), text: z.string(), cite: Cite })).default([]),
  // a long case study, shown on the 上位之路 page
  deep: z.boolean().optional(),
})
export type TurnRecord = z.infer<typeof TurnRecordSchema>

export const PhotoSchema = z.object({
  file: z.string().optional(),
  url: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  date: z.string().optional(),
  focus: z.string().optional(),
  why: z.string().optional(),
})
