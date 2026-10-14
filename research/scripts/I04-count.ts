// I04: yearly 人民日报 article counts for the press terms, written to content/press/I04.yaml.
// Corpus: the Hugging Face dataset Papersnake/people_daily_news (CialloCorpus, CC0), one file per year, downloaded to
// .probe/i04-rmrb/<year>.jsonl.gz for 2000–2025; 2026 (1 January to 13 October) from I04-scrape-2026.ts, read from
// .probe/i04-rmrb/2026/*.jsonl. Each record is one article as the paper lays it out ({ date, title, page, text, url }).
// An article counts once for a term when its title or text, with all whitespace removed, contains one of the term's
// strings at least once outside the term's `except` strings (the same rule as the build's corpus tally). A record whose
// date and first 200 characters of text repeat an earlier record is a duplicate and is skipped.
//   node research/scripts/I04-count.ts
// Also writes .probe/i04-count-report.txt: articles per year and per month (to spot gaps), occurrences per term and
// year, and counts over the window 2025-10-14..2026-10-13 for comparison with 人民日报图文数据库's “最近一年”.
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { createGunzip } from 'node:zlib'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const DATA = join(ROOT, '.probe', 'i04-rmrb')
const CITE = 'i04-ciallo-rmrb-corpus'

type Term = { id: string; name: string; terms: string[]; except?: string[]; concept?: string; ism?: string; group: string }
const TERMS: Term[] = [
  // 指导思想与口号
  { group: '指导思想与口号', id: 'deng-theory', name: '邓小平理论', terms: ['邓小平理论'], concept: 'deng-theory' },
  { group: '指导思想与口号', id: 'three-represents', name: '三个代表', terms: ['三个代表'], except: ['三个代表团', '三个代表队', '三个代表处', '三个代表性', '三个代表作'], concept: 'three-represents' },
  { group: '指导思想与口号', id: 'scientific-development', name: '科学发展观', terms: ['科学发展观'], concept: 'scientific-development' },
  { group: '指导思想与口号', id: 'harmonious-society', name: '和谐社会', terms: ['和谐社会'], concept: 'harmonious-society' },
  { group: '指导思想与口号', id: 'honor-disgrace', name: '八荣八耻', terms: ['八荣八耻', '社会主义荣辱观'], concept: 'honor-disgrace' },
  { group: '指导思想与口号', id: 'yushi-jujin', name: '与时俱进', terms: ['与时俱进'] },
  { group: '指导思想与口号', id: 'xiaokang', name: '小康社会', terms: ['小康社会'], concept: 'xiaokang' },
  { group: '指导思想与口号', id: 'chinese-dream', name: '中国梦', terms: ['中国梦'], concept: 'chinese-dream' },
  { group: '指导思想与口号', id: 'rejuvenation', name: '中华民族伟大复兴', terms: ['中华民族伟大复兴'] },
  { group: '指导思想与口号', id: 'new-era', name: '新时代', terms: ['新时代'], concept: 'new-era' },
  { group: '指导思想与口号', id: 'xi-thought', name: '习近平新时代中国特色社会主义思想', terms: ['习近平新时代中国特色社会主义思想'], concept: 'xi-thought' },
  { group: '指导思想与口号', id: 'four-comprehensives', name: '四个全面', terms: ['四个全面'], concept: 'four-comprehensives' },
  { group: '指导思想与口号', id: 'new-development-philosophy', name: '新发展理念', terms: ['新发展理念'], concept: 'new-development-philosophy' },
  { group: '指导思想与口号', id: 'core', name: '以习近平同志为核心', terms: ['以习近平同志为核心'], concept: 'core' },
  { group: '指导思想与口号', id: 'two-establishes', name: '两个确立', terms: ['两个确立'], concept: 'two-establishes' },
  { group: '指导思想与口号', id: 'two-safeguards', name: '两个维护', terms: ['两个维护'], concept: 'two-safeguards' },
  { group: '指导思想与口号', id: 'great-changes', name: '百年未有之大变局', terms: ['百年未有之大变局', '百年变局'] },
  { group: '指导思想与口号', id: 'chinese-modernization', name: '中国式现代化', terms: ['中国式现代化'], concept: 'chinese-modernization' },
  { group: '指导思想与口号', id: 'new-quality-productive-forces', name: '新质生产力', terms: ['新质生产力'], concept: 'new-quality-productive-forces' },
  { group: '指导思想与口号', id: 'whole-process-democracy', name: '全过程人民民主', terms: ['全过程人民民主'], concept: 'whole-process-democracy' },
  // 路线词
  { group: '路线词', id: 'reform-opening', name: '改革开放', terms: ['改革开放'] },
  { group: '路线词', id: 'economic-center', name: '以经济建设为中心', terms: ['以经济建设为中心'] },
  { group: '路线词', id: 'market-economy', name: '市场经济', terms: ['市场经济'], concept: 'socialist-market-economy' },
  { group: '路线词', id: 'soe-stronger', name: '做强做优做大', terms: ['做强做优做大'] },
  { group: '路线词', id: 'private-economy', name: '民营经济', terms: ['民营经济'] },
  { group: '路线词', id: 'guojin-mintui', name: '国进民退', terms: ['国进民退'] },
  { group: '路线词', id: 'common-prosperity', name: '共同富裕', terms: ['共同富裕'], concept: 'common-prosperity' },
  { group: '路线词', id: 'new-normal', name: '新常态', terms: ['新常态'] },
  { group: '路线词', id: 'supply-side', name: '供给侧结构性改革', terms: ['供给侧结构性改革'], concept: 'supply-side' },
  { group: '路线词', id: 'high-quality-development', name: '高质量发展', terms: ['高质量发展'] },
  { group: '路线词', id: 'dual-circulation', name: '双循环／新发展格局', terms: ['新发展格局', '双循环'], concept: 'dual-circulation' },
  { group: '路线词', id: 'poverty-alleviation', name: '脱贫攻坚', terms: ['脱贫攻坚'] },
  { group: '路线词', id: 'ecological-civilization', name: '生态文明', terms: ['生态文明'], concept: 'ecological-civilization' },
  // 政治词
  { group: '政治词', id: 'rule-of-law', name: '依法治国', terms: ['依法治国'], concept: 'rule-of-law' },
  { group: '政治词', id: 'party-leadership', name: '党的领导', terms: ['党的领导'] },
  { group: '政治词', id: 'strict-party-governance', name: '从严治党', terms: ['从严治党'] },
  { group: '政治词', id: 'anti-corruption', name: '反腐败', terms: ['反腐败'] },
  { group: '政治词', id: 'tigers-and-flies', name: '打虎拍蝇', terms: ['打虎拍蝇', '拍蝇打虎', '老虎苍蝇一起打'] },
  { group: '政治词', id: 'eight-point-rules', name: '八项规定', terms: ['八项规定'], concept: 'eight-point-rules' },
  { group: '政治词', id: 'self-revolution', name: '自我革命', terms: ['自我革命'], concept: 'self-revolution' },
  { group: '政治词', id: 'ideology', name: '意识形态', terms: ['意识形态'] },
  { group: '政治词', id: 'struggle', name: '斗争', terms: ['斗争'] },
  { group: '政治词', id: 'security', name: '安全', terms: ['安全'] },
  { group: '政治词', id: 'national-security', name: '国家安全', terms: ['国家安全'] },
  { group: '政治词', id: 'holistic-security', name: '总体国家安全观', terms: ['总体国家安全观'], concept: 'holistic-security' },
  { group: '政治词', id: 'hostile-forces', name: '敌对势力', terms: ['敌对势力'] },
  { group: '政治词', id: 'historical-nihilism', name: '历史虚无主义', terms: ['历史虚无主义'] },
  { group: '政治词', id: 'color-revolution', name: '颜色革命', terms: ['颜色革命'] },
  { group: '政治词', id: 'universal-values', name: '普世价值', terms: ['普世价值'] },
  // 外交词
  { group: '外交词', id: 'taoguang-yanghui', name: '韬光养晦', terms: ['韬光养晦'], concept: 'taoguang-yanghui' },
  { group: '外交词', id: 'peaceful-rise', name: '和平崛起', terms: ['和平崛起'], concept: 'peaceful-rise' },
  { group: '外交词', id: 'harmonious-world', name: '和谐世界', terms: ['和谐世界'], concept: 'harmonious-world' },
  { group: '外交词', id: 'community-shared-future', name: '人类命运共同体', terms: ['人类命运共同体'], concept: 'community-shared-future' },
  { group: '外交词', id: 'belt-and-road', name: '一带一路', terms: ['一带一路'], concept: 'belt-and-road' },
  { group: '外交词', id: 'global-governance', name: '全球治理', terms: ['全球治理'] },
  { group: '外交词', id: 'hegemonism', name: '霸权主义', terms: ['霸权主义'] },
  // 社会词
  { group: '社会词', id: 'stability-maintenance', name: '维稳', terms: ['维稳'], concept: 'stability-maintenance' },
  { group: '社会词', id: 'dynamic-zero', name: '动态清零', terms: ['动态清零', '社会面清零'], concept: 'dynamic-zero' },
  { group: '社会词', id: 'tangping', name: '躺平', terms: ['躺平'] },
  { group: '社会词', id: 'neijuan', name: '内卷', terms: ['内卷'] },
]
// ids in content/isms/I03.yaml
const ISMS: Record<string, string> = { 'market-economy': 'socialist-market-economy' }
for (const id of ['deng-theory', 'three-represents', 'scientific-development', 'harmonious-society', 'xi-thought', 'chinese-modernization', 'whole-process-democracy', 'guojin-mintui', 'common-prosperity', 'supply-side', 'dual-circulation', 'new-quality-productive-forces', 'historical-nihilism', 'color-revolution', 'universal-values', 'taoguang-yanghui', 'peaceful-rise', 'dynamic-zero', 'tangping'])
  ISMS[id] = id
for (const t of TERMS) t.ism = ISMS[t.id]
// a batch build skips the files of other batches still in flight, so an ism of I03 cannot be resolved until I03 is merged
const ismsPending = /inflight:.*\bI03\b/.test(readFileSync(join(ROOT, 'research', 'round.yaml'), 'utf8'))

const count = (hay: string, needle: string) => {
  let n = 0
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) n++
  return n
}
const hits = (text: string, t: Term) =>
  t.terms.reduce((a, s) => a + count(text, s), 0) - (t.except ?? []).reduce((a, e) => a + t.terms.filter((s) => e.includes(s)).length * count(text, e), 0)

async function* records(year: number): AsyncGenerator<{ date: string; title: string; text: string }> {
  const gz = join(DATA, `${year}.jsonl.gz`)
  if (existsSync(gz)) {
    for await (const line of createInterface({ input: createReadStream(gz).pipe(createGunzip()), crlfDelay: Infinity })) if (line.trim()) yield JSON.parse(line)
    return
  }
  const dir = join(DATA, String(year))
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir).sort())
    for (const line of readFileSync(join(dir, f), 'utf8').split('\n')) if (line.trim()) yield JSON.parse(line)
}

const YEARS = Array.from({ length: 27 }, (_, i) => 2000 + i)
const articles = new Map<number, number>()
const months = new Map<string, number>()
const docs = new Map<string, Map<number, number>>(TERMS.map((t) => [t.id, new Map()]))
const occ = new Map<string, Map<number, number>>(TERMS.map((t) => [t.id, new Map()]))
const window = new Map<string, number>(TERMS.map((t) => [t.id, 0]))
let windowArticles = 0
const dropped = new Map<number, number>()
for (const y of YEARS) {
  const seen = new Set<string>()
  for await (const r of records(y)) {
    const day = r.date.replace(/\./g, '-')
    // the dataset merges several crawls, so the same article can appear twice on a day (heavily in 2004-07/08 and 2007-01/03)
    const body = (r.text ?? '').replace(/\s/g, '')
    const key = `${day}|${body.length >= 50 ? body.slice(0, 200) : `${(r.title ?? '').replace(/\s/g, '')}|${body}`}`
    if (seen.has(key)) {
      dropped.set(y, (dropped.get(y) ?? 0) + 1)
      continue
    }
    seen.add(key)
    articles.set(y, (articles.get(y) ?? 0) + 1)
    months.set(day.slice(0, 7), (months.get(day.slice(0, 7)) ?? 0) + 1)
    const inWindow = day >= '2025-10-14' && day <= '2026-10-13'
    if (inWindow) windowArticles++
    const text = `${r.title ?? ''}\n${r.text ?? ''}`.replace(/\s/g, '')
    for (const t of TERMS) {
      const n = hits(text, t)
      if (n <= 0) continue
      docs.get(t.id)!.set(y, (docs.get(t.id)!.get(y) ?? 0) + 1)
      occ.get(t.id)!.set(y, (occ.get(t.id)!.get(y) ?? 0) + n)
      if (inWindow) window.set(t.id, window.get(t.id)! + 1)
    }
  }
  console.log(`${y} ${articles.get(y) ?? 0} articles, ${dropped.get(y) ?? 0} duplicates dropped`)
}

const counted = YEARS.filter((y) => (articles.get(y) ?? 0) > 0)
const flow = (xs: string[]) => `[${xs.join(', ')}]`
const out: string[] = [
  '# I04: 人民日报 yearly article counts. Generated by research/scripts/I04-count.ts; edit the script, not this file.',
  '# n = number of articles (as laid out in the paper) whose title or text contains one of the terms at least once, outside `except`.',
  '# Records repeating an earlier one (same date, same first 200 characters) are skipped.',
  `# Corpus: Papersnake/people_daily_news (CialloCorpus) 2000–2025; 2026 = 1 January to 13 October only, from paper.people.com.cn.`,
  `# Articles per year: ${counted.map((y) => `${y} ${articles.get(y)}`).join(', ')}.`,
  ...(ismsPending ? ['# `# ism:` names an id of content/isms/I03.yaml; uncomment it (or rerun the script) once I03 is merged.'] : []),
]
let group = ''
for (const t of TERMS) {
  if (t.group !== group) out.push(`# ${(group = t.group)}`)
  out.push(`- id: ${t.id}`, `  name: ${t.name}`, `  terms: ${flow(t.terms)}`)
  if (t.except?.length) out.push(`  except: ${flow(t.except)}`)
  if (t.concept) out.push(`  concept: ${t.concept}`)
  if (t.ism) out.push(`  ${ismsPending ? '# ' : ''}ism: ${t.ism}`)
  out.push('  hits:')
  for (const y of counted) out.push(`    - { year: ${y}, n: ${docs.get(t.id)!.get(y) ?? 0} }`)
  out.push(`  cite: ${CITE}`)
}
mkdirSync(join(ROOT, 'content', 'press'), { recursive: true })
writeFileSync(join(ROOT, 'content', 'press', 'I04.yaml'), out.join('\n') + '\n')

const rep: string[] = ['articles per year (duplicates dropped)', ...counted.map((y) => `${y}\t${articles.get(y)}\t${dropped.get(y) ?? 0}`), '', 'articles per month']
rep.push([...months].sort().map(([m, n]) => `${m}\t${n}`).join('\n'), '', `window 2025-10-14..2026-10-13: ${windowArticles} articles`)
for (const t of TERMS) rep.push(`${t.id}\twindow ${window.get(t.id)}`)
rep.push('', 'term\tyear\tarticles\toccurrences')
for (const t of TERMS) for (const y of counted) rep.push(`${t.id}\t${y}\t${docs.get(t.id)!.get(y) ?? 0}\t${occ.get(t.id)!.get(y) ?? 0}`)
writeFileSync(join(ROOT, '.probe', 'i04-count-report.txt'), rep.join('\n') + '\n')
