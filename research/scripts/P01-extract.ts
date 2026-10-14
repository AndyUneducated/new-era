// P01 one-off: pull the career paragraphs about provincial posts out of the peeked biographies,
// print them for reading (.probe/P01-extract.txt) and propose `keep` strings (.probe/P01-keeps.json).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { BIOS } from './P01-bio-list.ts'

const PROVS = ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东']
const POST = /省长|市长|主席|书记|主持/
const ids = process.argv.slice(2).length ? process.argv.slice(2) : BIOS.map(([id]) => id)
const out: string[] = []
const keeps: Record<string, string[]> = {}
for (const id of ids) {
  const f = `.probe/peek-p01-wiki-${id}.txt`
  if (!existsSync(f)) {
    out.push(`##### ${id}: NO PEEK`)
    continue
  }
  const paras = readFileSync(f, 'utf8').split(/\n+/).map((p) => p.trim())
  const hits = paras.filter((p) => p.length > 12 && /(19|20)\d\d年/.test(p) && POST.test(p) && PROVS.some((v) => p.includes(v)) && !p.startsWith('^') && !/^本页面最后修订/.test(p))
  out.push(`##### ${id}`, ...hits.map((p) => `* ${p}`))
  keeps[id] = [...new Set(hits.map((p) => p.slice(0, 18)))]
}
writeFileSync('.probe/P01-extract.txt', out.join('\n') + '\n')
writeFileSync('.probe/P01-keeps.json', JSON.stringify(keeps, null, 1))
