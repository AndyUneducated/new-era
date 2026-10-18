// Compact per-person digest of the stored source texts, to write cards and case records from:
// the expulsion notice without its fixed opening and legal boilerplate, the verdict's first paragraph and the
// sentence naming posts and sums, and the opening of the probe notice.
//   node research/scripts/R05-dump.ts old|new   -> .probe/R05-dump-<old|new>.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './R05-sources.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const text = (id: string) => {
  const p = join(ROOT, 'sources', 'text', `${id}.txt`)
  return existsSync(p) ? readFileSync(p, 'utf8').replace(/\n+/g, ' ') : `[no text ${id}]`
}
const OLD: Record<string, [string, string, string]> = {
  'xie-changjun': ['r05-ccdi-2021-02-08-xie-changjun-probe', 't02-ccdi-2021-08-17-xie-changjun-expel', 't02-thepaper-2022-06-08-xie-changjun-verdict'],
  'wang-fuyu': ['t02-ccdi-2021-02-21-wang-fuyu-probe', 't02-ccdi-2021-08-16-wang-fuyu-expel', 't02-bjnews-2022-01-17-wang-fuyu-verdict'],
  'liu-xinyun': ['r05-ccdi-2021-04-09-liu-xinyun-probe', 'r05-cctv-2021-08-16-liu-xinyun-expel', 'r05-xinhua-2022-09-21-liu-xinyun-verdict'],
  'gan-rongkun': ['r05-ccdi-2021-06-01-gan-rongkun-probe', 't02-ccdi-2021-12-02-gan-rongkun-expel', 't02-xinhua-2023-12-27-gan-rongkun-verdict'],
  'cai-esheng': ['t02-ccdi-2021-07-30-cai-esheng-probe', 't02-ccdi-2022-01-24-cai-esheng-expel', 't02-thepaper-2023-12-cai-esheng-verdict'],
  'zhou-jiangyong': ['c03-ccdi-2021-08-21-zhou-jiangyong-probe', 'c03-ccdi-2022-01-26-zhou-jiangyong-expel', 'c03-xinhua-2023-07-25-zhou-jiangyong-verdict'],
  'fu-zhenghua': ['c03-ccdi-2021-10-02-fu-zhenghua-probe', 'c03-ccdi-2022-03-31-fu-zhenghua-expel', 'c03-xinhua-2022-09-22-fu-zhenghua-verdict'],
  'zhang-jinghua': ['k05-chinanews-2021-12-01-zhang-jinghua', 'k05-xinhua-2022-05-31-zhang-jinghua', 'k05-xinhua-2023-11-21-zhang-jinghua'],
  'wang-bin-chinalife': ['t02-chinanews-2022-01-08-wang-bin-probe', 't02-ccdi-2022-09-01-wang-bin-expel', 't02-xinhua-2023-09-12-wang-bin-verdict'],
  'li-guohua-unicom': ['t02-ccdi-2022-02-18-li-guohua-probe', 't02-ccdi-2022-09-30-li-guohua-expel', 't02-xinhua-2024-05-07-li-guohua-verdict'],
  'cao-guangjing': ['k04-xinhua-2022-02-24-cao-guangjing-probe', 'k04-ccdi-2022-09-29-cao-guangjing-expel', 'k04-court-2024-05-24-cao-guangjing-verdict'],
  'wang-dawei-liaoning': ['t02-ccdi-2022-03-01-wang-dawei-probe', 't02-ccdi-2022-09-29-wang-dawei-expel', 't02-people-2024-10-14-wang-dawei-verdict'],
  'liu-yanping': ['c03-ccdi-2022-03-12-liu-yanping-probe', 'c03-people-2022-09-01-liu-yanping-expel', 'c03-xinhua-2023-01-10-liu-yanping-verdict'],
  'shen-deyong': ['k04-ccdi-2022-03-21-shen-deyong-probe', 'k04-ccdi-2022-09-07-shen-deyong-expel', 'k04-xinhua-2023-08-04-shen-deyong-verdict'],
  'sheng-guangzu': ['k04-ccdi-2022-03-25-sheng-guangzu-probe', 'k04-ccdi-2022-09-19-sheng-guangzu-expel', 'k04-court-2023-12-12-sheng-guangzu-verdict'],
  'zhang-wufeng': ['t02-ccdi-2022-06-15-zhang-wufeng-probe', 'r05-ccdi-2022-12-30-zhang-wufeng-expel', 't02-xinhua-2023-12-05-zhang-wufeng-verdict'],
  'xiao-yaqing': ['k04-ccdi-2022-07-28-xiao-yaqing-probe', 'k04-chinanews-2022-12-19-xiao-yaqing-expel', ''],
  'li-jia': ['', 'k04-ccdi-2022-08-26-li-jia-punished', ''],
  'fan-yifei': ['t02-ccdi-2022-11-05-fan-yifei-probe', 'r05-ccdi-2023-06-09-fan-yifei-expel', 't02-xinhua-2024-10-10-fan-yifei-verdict'],
  'he-zehua': ['t02-ccdi-2023-01-06-he-zehua-probe', 't02-ccdi-2023-07-06-he-zehua-expel', 't02-chinanews-2024-05-29-he-zehua-verdict'],
  'jiang-zhigang': ['k05-chinanews-2023-03-17-jiang-zhigang', 'k05-rmrb-2023-08-31-jiang-zhigang', 'k05-xinhua-2024-10-23-jiang-zhigang'],
  'cui-maohu': ['t02-ccdi-2023-03-18-cui-maohu-probe', 't02-ccdi-2023-08-30-cui-maohu-expel', 't02-people-2024-07-23-cui-maohu-verdict'],
  'liu-liange': ['t02-ccdi-2023-03-31-liu-liange-probe', 't02-ccdi-2023-10-07-liu-liange-expel', 't02-xinhua-2024-11-26-liu-liange-verdict'],
  'du-zhaocai': ['t02-cctv-2023-04-01-du-zhaocai-probe', 't02-ccdi-2023-10-07-du-zhaocai-expel', 't02-xinhua-2024-12-13-du-zhaocai-verdict'],
  'li-xiaopeng-everbright': ['t02-ccdi-2023-04-05-li-xiaopeng-probe', 't02-xinhua-2023-10-09-li-xiaopeng-expel', 't02-xinhua-2025-03-18-li-xiaopeng-verdict'],
  'dong-yunhu': ['t02-ccdi-2023-07-12-dong-yunhu-probe', 'r05-ccdi-2023-12-12-dong-yunhu-expel', 't02-xinhua-2024-08-28-dong-yunhu-verdict'],
  'tang-shuangning': ['r05-ccdi-2023-07-15-tang-shuangning-probe', 't02-xinhua-2024-01-06-tang-shuangning-expel', 't02-xinhua-2024-12-10-tang-shuangning-verdict'],
  'sun-zhigang': ['r05-ccdi-2023-08-28-sun-zhigang-probe', 'r05-ccdi-2024-02-05-sun-zhigang-expel', 'k05-chinanews-2024-10-29-sun-zhigang'],
  'shang-liguang': ['r05-ccdi-2023-09-05-shang-liguang-probe', 'r05-ccdi-2024-02-29-shang-liguang-expel', 't02-chinacourt-2024-12-shang-liguang-verdict'],
  'liu-lixian': ['r05-xinhua-2023-09-15-liu-lixian-probe', 't02-ccdi-2024-01-19-liu-lixian-expel', 't02-court-2024-12-24-liu-lixian-verdict'],
  'han-yong': ['k04-12371-2023-10-19-han-yong-probe', 'k04-ccdi-2024-04-22-han-yong-expel', 'k04-chinanews-2025-05-19-han-yong-verdict'],
  'ling-chengxing': ['t02-ccdi-2023-10-23-ling-chengxing-probe', 't02-ccdi-2024-04-22-ling-chengxing-expel', 't02-cctv-2025-05-21-ling-chengxing-verdict'],
  'zhang-hongli': ['t02-ccdi-2023-11-04-zhang-hongli-probe', 't02-ccdi-2024-05-09-zhang-hongli-expel', 't02-court-2025-zhang-hongli-verdict'],
  'wang-yixin': ['r05-ccdi-2023-12-08-wang-yixin-probe', 't02-ccdi-2024-06-17-wang-yixin-expel', 't02-chinanews-2025-05-16-wang-yixin-verdict'],
  'li-pengxin': ['r05-ccdi-2023-12-11-li-pengxin-probe', 't02-ccdi-2024-06-17-li-pengxin-expel', 't02-cctv-2025-04-22-li-pengxin-verdict'],
}

const expel = (t: string) =>
  t
    .replace(/^.*?(进行了立案审查调查。|立案审查调查。)\s*/, '')
    .replace(/依据《中国共产党纪律处分条例》.*?(研究并报中共中央批准|研究并报.*?批准)，/, '…')
    .replace(/(按规定取消其享受的待遇；)?收缴其违纪违法所得；将其涉嫌犯罪问题移送检察机关依法审查起诉，所涉财物一并移送。.*$/, '…移送')
const verdict = (t: string) => {
  const s = t.split(/(?<=。)/)
  const head = s.find((x) => /判处|宣判/.test(x)) ?? ''
  const posts = s.filter((x) => /利用.{0,6}担任|共计|折合|万余元|亿余元|自首|投案|立功/.test(x) && x !== head)
  return [head.slice(0, 260), ...posts.map((x) => x.slice(0, 420))].join(' ¶ ')
}
const probe = (t: string) => t.slice(0, 260)

const mode = process.argv[2] ?? 'old'
const out: string[] = []
if (mode === 'old') {
  for (const [id, [p, e, v]] of Object.entries(OLD)) {
    out.push(`######## ${id}`)
    if (p) out.push(`P ${p}: ${probe(text(p))}`)
    if (e) out.push(`E ${e}: ${expel(text(e))}`)
    if (v) out.push(`V ${v}: ${verdict(text(v))}`)
  }
} else {
  const seen = new Set(Object.keys(OLD))
  const by = new Map<string, typeof SOURCES>()
  for (const s of SOURCES) {
    const slug = s.id.replace(/^r05-[a-z]+-[\d-]+?-(?=[a-z])/, '').replace(/-(probe|expel|verdict|arrest|punished)$/, '')
    if (seen.has(slug)) continue
    by.set(slug, [...(by.get(slug) ?? []), s])
  }
  for (const [slug, ss] of by) {
    out.push(`######## ${slug}`)
    for (const s of ss) {
      const t = text(s.id)
      const kind = s.id.match(/-(probe|expel|verdict|arrest|punished)$/)?.[1]
      const body = kind === 'verdict' ? verdict(t) : kind === 'expel' || kind === 'punished' ? expel(t) : t.slice(0, kind === 'probe' ? 1500 : 300)
      out.push(`${kind?.[0].toUpperCase()} ${s.id}: ${body}`)
    }
  }
}
writeFileSync(join(ROOT, '.probe', `R05-dump-${mode}.txt`), out.join('\n') + '\n')
console.log(out.length, 'lines')
