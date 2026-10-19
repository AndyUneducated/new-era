// R10 manifest generator from research/scripts/R10-src.txt.
//   node research/scripts/R10-src.ts gen    -> research/manifests/R10.yaml (+ .probe/R10-gen.txt: duplicates, new ids)
//   node research/scripts/R10-src.ts mark   -> start/end/keep from .probe/peek-<id>.txt into research/scripts/R10-markers.json
//                                              (+ .probe/R10-mark.txt: head and tail of each cut, for checking)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'

type Row = { who: string; kind: string; date: string; url: string; title: string; keep?: string[]; start?: string; end?: string }
type M = { start?: string; end?: string; keep?: string[] }
const MARK = 'research/scripts/R10-markers.json'
const marks: Record<string, M> = existsSync(MARK) ? JSON.parse(readFileSync(MARK, 'utf8')) : {}

const rows: Row[] = readFileSync('research/scripts/R10-src.txt', 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [who, kind, date, url, title, keep] = l.split('|').map((s) => s.trim())
    // an official row may carry hand-set markers as "start>>end" instead of keep strings
    if (keep?.includes('>>')) {
      const [start, end] = keep.split('>>')
      return { who, kind, date, url, title, start, end }
    }
    return { who, kind, date, url, title, keep: keep ? keep.split(';').map((s) => s.trim()) : undefined }
  })

const host = (u: string) => new URL(u.replace(/^https?:\/\/web\.archive\.org\/web\/\w+\//, '')).hostname
const PUB: [RegExp, string, string, string][] = [
  [/ccdi\.gov\.cn/, 'ccdi', '中央纪委国家监委网站', 'official'],
  [/news\.cn|xinhuanet\.com/, 'xinhua', '新华网', 'official'],
  [/court\.gov\.cn|chinacourt/, 'court', '人民法院', 'official'],
  [/spp\.gov\.cn/, 'spp', '最高人民检察院', 'official'],
  [/people\.com\.cn|peopleapp\.com|people\.cn/, 'people', '人民网', 'official'],
  [/cctv\.com|cctv\.cn/, 'cctv', '央视网', 'official'],
  [/youth\.cn/, 'youth', '中国青年网', 'official'],
  [/hebcdi\.gov\.cn/, 'hebcdi', '河北省纪委监委网站', 'official'],
  [/[a-z]+jw\.gov\.cn|jjjc\.gov\.cn|sjw\.gov\.cn/, 'jw', '地方纪委监委网站', 'official'],
  [/cri\.cn/, 'cri', '国际在线', 'official'],
  [/legaldaily/, 'legaldaily', '法制网', 'official'],
  [/chinadaily/, 'chinadaily', '中国日报网', 'official'],
  [/(^|\.)ce\.cn/, 'ce', '中国经济网', 'official'],
  [/gmw\.cn/, 'gmw', '光明网', 'official'],
  [/china\.com\.cn/, 'chinacom', '中国网', 'official'],
  [/12371\.cn/, '12371', '共产党员网', 'official'],
  [/csrc\.gov\.cn/, 'csrc', '中国证监会', 'official'],
  [/bjsupervision\.gov\.cn/, 'bjjw', '北京市纪委监委网站', 'official'],
  [/qzcdi\.gov\.cn/, 'qzjw', '泉州市纪委监委网站', 'official'],
  [/scjc\.gov\.cn/, 'scjw', '四川省纪委监委网站', 'official'],
  [/jcy\.gov\.cn/, 'jcy', '检察院', 'official'],
  [/gov\.cn/, 'gov', '政府网站', 'official'],
  [/sse\.com\.cn/, 'sse', '上海证券交易所', 'official'],
  [/stcn\.com/, 'stcn', '证券时报网', 'zh'],
  [/mycaijing/, 'caijing', '财经', 'zh'],
  [/guancha/, 'guancha', '观察者网', 'zh'],
  [/chnfund/, 'chnfund', '中国基金报', 'zh'],
  [/163\.com/, '163', '网易', 'zh'],
  [/dahecube/, 'dahe', '大河财立方', 'zh'],
  [/qq\.com/, 'qq', '腾讯新闻', 'zh'],
  [/cnstock/, 'cnstock', '上海证券报', 'zh'],
  [/cs\.com\.cn/, 'cs', '中国证券报', 'zh'],
  [/eeo\.com\.cn/, 'eeo', '经济观察网', 'zh'],
  [/bjd\.com\.cn/, 'bjd', '北京日报', 'zh'],
  [/jwview/, 'jwview', '中新经纬', 'zh'],
  [/chinanews/, 'chinanews', '中国新闻网', 'zh'],
  [/thepaper/, 'thepaper', '澎湃新闻', 'zh'],
  [/caixin/, 'caixin', '财新网', 'zh'],
  [/cyol\.com/, 'cyol', '中国青年报', 'zh'],
  [/bjnews/, 'bjnews', '新京报', 'zh'],
  [/wikipedia/, 'wiki', '维基百科', 'wiki'],
  [/jiemian/, 'jiemian', '界面新闻', 'zh'],
  [/bbc\.com/, 'bbc', 'BBC中文', 'zh'],
  [/nytimes/, 'nyt', '纽约时报中文网', 'zh'],
  [/zaobao/, 'zaobao', '联合早报', 'zh'],
  [/rfi\.fr/, 'rfi', '法广', 'zh'],
  [/voachinese/, 'voa', '美国之音', 'zh'],
  [/rfa\.org/, 'rfa', '自由亚洲电台', 'zh'],
  [/21jingji/, '21jingji', '21世纪经济报道', 'zh'],
  [/sina/, 'sina', '新浪', 'zh'],
  [/ifeng/, 'ifeng', '凤凰网', 'zh'],
  [/huxiu/, 'huxiu', '虎嗅网', 'zh'],
  [/yicai/, 'yicai', '第一财经', 'zh'],
  [/kunming\.cn/, 'kunming', '昆明信息港', 'zh'],
  [/infzm/, 'infzm', '南方周末', 'zh'],
  [/news\.china\.com$/, 'chinacomnews', '中华网', 'zh'],
  [/nbd\.com\.cn/, 'nbd', '每日经济新闻', 'zh'],
  [/sport\.gov\.cn/, 'sport', '国家体育总局', 'official'],
]
const pub = (u: string) => PUB.find(([re]) => re.test(host(u))) ?? [/./, 'web', host(u), 'zh']
const idOf = (r: Row) => (r.kind === 'wiki' ? `r10-wiki-${r.who}` : `r10-${pub(r.url)[1]}-${r.date ? r.date + '-' : ''}${r.who}-${r.kind}`)
const norm = (u: string) =>
  decodeURI(u)
    .replace(/^https?:\/\/web\.archive\.org\/web\/\w+\//, '')
    .replace(/^https?:\/\//, '')
    .replace(/^(www|m)\./, '')
    .replace(/\/$/, '')

const mode = process.argv[2]
if (mode === 'gen') {
  const known = new Map<string, string>()
  for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml') && f !== 'R10.yaml'))
    try {
      for (const e of (parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) as { id: string; url: string }[])
        known.set(norm(e.url), e.id)
    } catch {}
  const out: string[] = []
  const web: Record<string, unknown>[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    const id = idOf(r)
    const dup = known.get(norm(r.url))
    if (dup) {
      out.push(`DUP ${id} = ${dup}`)
      continue
    }
    if (seen.has(id)) {
      out.push(`SAME ID ${id}`)
      continue
    }
    seen.add(id)
    const [, , publisher, voice] = pub(r.url)
    const m = r.start ? { start: r.start, end: r.end } : (marks[id] ?? {})
    const e: Record<string, unknown> = { id, title: r.title, publisher, ...(r.date ? { date: r.date } : {}), voice, url: r.url }
    if (voice === 'official') Object.assign(e, m.start ? { start: m.start } : {}, m.end ? { end: m.end } : {})
    else Object.assign(e, { excerpt: true, keep: r.keep ?? m.keep ?? ['__NOKEEP__'] })
    web.push(e)
    out.push(`${m.start || m.keep || r.keep ? 'OK ' : 'NEW'} ${id}`)
  }
  writeFileSync('research/manifests/R10.yaml', '# R10 sources; generated by research/scripts/R10-src.ts from R10-src.txt\n' + stringify({ web }, { lineWidth: 0 }))
  writeFileSync('.probe/R10-gen.txt', out.join('\n') + '\n', 'utf8')
  // ids still to peek (no markers yet) and ids not yet fetched, for: node tools/fetch-web.ts (Get-Content ...)
  writeFileSync('.probe/R10-topeek.txt', web.filter((e) => !marks[e.id as string] && !(e.keep as string[] | undefined)?.every((k) => k !== '__NOKEEP__')).map((e) => e.id).join('\n') + '\n')
  writeFileSync('.probe/R10-tofetch.txt', web.filter((e) => !existsSync(`sources/text/${e.id}.txt`)).map((e) => e.id).join('\n') + '\n')
  console.log(web.length, out.filter((l) => l.startsWith('DUP')).length)
}

const LEAD = ['中央纪委国家监委网站讯', '新华社北京', '本报北京', '新华社']
function firstUnique(all: string, para: string, pos: number, from: number): string {
  for (let n = 8; n <= para.length - from; n++) {
    const s = para.slice(from, from + n)
    if (all.indexOf(s) === pos) return s
  }
  return para.slice(from)
}
function lastUnique(all: string, para: string, pos: number, startPos: number): string {
  for (let n = 6; n <= para.length; n++) {
    const s = para.slice(para.length - n)
    if (all.indexOf(s, startPos) === pos + para.length - n) return s
  }
  return para
}
if (mode === 'mark') {
  const out: string[] = []
  for (const r of rows) {
    const id = idOf(r)
    const f = `.probe/peek-${id}.txt`
    if (process.argv.includes('--redo-wiki') && r.kind === 'wiki') delete marks[id]
    if (marks[id] || r.start || r.keep || !existsSync(f)) continue
    const all = readFileSync(f, 'utf8')
    const paras = all.split('\n\n')
    const posOf = (i: number) => all.indexOf(paras[i] + (i < paras.length - 1 ? '\n\n' : ''), i ? all.indexOf(paras[i - 1]) : 0)
    const voice = pub(r.url)[3]
    if (voice === 'wiki') {
      const name = r.title.replace(/[（ (].*$/, '')
      const pick: number[] = []
      const lead = paras.findIndex((p) => p.startsWith(name + '（') || p.startsWith(name + '('))
      if (lead >= 0) pick.push(lead)
      paras.forEach((p, i) => {
        if (p.length < 30 || i === lead || p.startsWith('^') || p.startsWith('本模') || p.startsWith('据《')) return
        if (pick.length < 8 && (p.startsWith(name) || /\d{4}年/.test(p)) && /任|调|当选|出生|审查|开除|判处|宣判|历任|曾在/.test(p)) pick.push(i)
      })
      const keep = pick.map((i) => paras[i].slice(0, 16))
      marks[id] = { keep }
      out.push(`## ${id} WIKI keep ${keep.length}\n` + pick.map((i) => '   ' + paras[i].slice(0, 120)).join('\n'))
      continue
    }
    if (voice !== 'official') continue
    let s = -1
    let e = -1
    const isCourt = r.kind === 'verdict' || r.kind === 'trial' || r.kind === 'end'
    for (let i = 0; i < paras.length; i++) {
      const p = paras[i]
      if (s < 0) {
        if (isCourt ? /^(新华社\S*电\s*)?\d{4}年\d{1,2}月\d{1,2}日[，,]|^新华社\S+电/.test(p) && /法院/.test(p) : /涉嫌严重(违纪违法|职务违法)|经中共中央批准|立案审查调查/.test(p)) s = i
        continue
      }
    }
    if (s >= 0)
      for (let i = s; i < paras.length; i++) {
        const p = paras[i]
        if (r.kind === 'probe' ? /调查。$/.test(p) : isCourt ? /上述判决。|做出判决。|择期宣判。|终止审理。|旁听/.test(p) : /一并移送。|予以追认。|移送。$/.test(p)) e = i
        if (e >= 0 && r.kind === 'probe') break
      }
    if (s < 0 || e < 0) {
      out.push(`## ${id} FAIL s=${s} e=${e}\n   ${paras.slice(0, 40).map((p) => p.slice(0, 60)).join(' | ')}`)
      continue
    }
    const sp = posOf(s)
    const lead = LEAD.map((l) => paras[s].indexOf(l)).filter((x) => x >= 0).sort((a, b) => a - b)[0] ?? 0
    const start = firstUnique(all, paras[s], sp + lead, lead)
    const end = lastUnique(all, paras[e], posOf(e), sp)
    marks[id] = { start, end }
    const cut = all.slice(all.indexOf(start), all.indexOf(end, all.indexOf(start)) + end.length)
    out.push(`## ${id} ${cut.length}\n   S «${start}» E «${end}»\n   ${cut.slice(0, 80).replace(/\n+/g, ' ')} … ${cut.slice(-60).replace(/\n+/g, ' ')}`)
  }
  writeFileSync(MARK, JSON.stringify(marks, null, 1))
  writeFileSync('.probe/R10-mark.txt', out.join('\n') + '\n', 'utf8')
  console.log(out.length)
}
