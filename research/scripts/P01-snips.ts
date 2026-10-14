// P01 one-off: compact view of the biography sentences about provincial posts, with the
// paragraph's first characters (usable as a `keep` string). Writes .probe/P01-snips.txt.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { BIOS } from './P01-bio-list.ts'

const PROVS = ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东']
const POST = /(?<!副)(省长|市长|自治区主席|政府主席)|(省|市|自治区党)委书记|代理/
const ids = process.argv.slice(2).length ? process.argv.slice(2) : BIOS.map(([id]) => id)
const out: string[] = []
for (const id of ids) {
  const f = `.probe/peek-p01-wiki-${id}.txt`
  if (!existsSync(f)) {
    out.push(`## ${id}: NO PEEK`)
    continue
  }
  const paras = readFileSync(f, 'utf8').split(/\n+/).map((p) => p.trim())
  out.push(`## ${id}`)
  for (const p of paras) {
    if (p.length < 12 || !/(19|20)\d\d年/.test(p) || p.startsWith('^') || /^本页面最后修订/.test(p)) continue
    const sents = p.split(/(?<=[。；])/).filter((s) => /(19|20)\d\d年|月/.test(s) && POST.test(s) && PROVS.some((v) => s.includes(v)))
    if (!sents.length) continue
    out.push(`  [${p.slice(0, 20)}]`)
    for (const s of sents) out.push(`    - ${s.length > 110 ? s.slice(0, 110) + '…' : s}`)
  }
}
writeFileSync('.probe/P01-snips.txt', out.join('\n') + '\n')
