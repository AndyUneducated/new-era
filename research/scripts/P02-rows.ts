// P02 one-off: print the post-2000 rows (name … tenure paragraphs) of every list-page peek. Output .probe/p02-rows.txt.
import { readFileSync, writeFileSync } from 'node:fs'

const provs = ['henan', 'hubei', 'hunan', 'guangdong', 'guangxi', 'hainan', 'chongqing', 'sichuan', 'guizhou', 'yunnan', 'xizang', 'shaanxi', 'gansu', 'qinghai', 'ningxia', 'xinjiang']
const tenure = /^(\d{4})年(\d{1,2}月)?(\d{1,2}日)?\s*[—–-]{1,2}\s*((\d{4})年(\d{1,2}月)?(\d{1,2}日)?)?\s*$/
const out: string[] = []
for (const p of provs)
  for (const post of ['sec', 'gov']) {
    const id = `p02-wiki-${p}-${post}`
    const paras = readFileSync(`.probe/peek-${id}.txt`, 'utf8').split(/\n+/).map((s) => s.trim()).filter(Boolean)
    out.push(`=== ${id}`)
    let prev = -1
    paras.forEach((s, i) => {
      const y = [...s.matchAll(/((?:19|20)\d{2})年/g)].map((m) => +m[1])
      if (s.length < 300 && y.some((v) => v >= 1998) && (/^[\u4e00-\u9fa5·・ ]{2,16}[（(]\s*(19|20)\d{2}/.test(s) || /^(书记|第一书记|主席|省长|市长)[：:]/.test(s) || /^第.{1,4}届/.test(s)))
        out.push(`  ${s}`)
      if (s.length > 60) return
      const years = [...s.matchAll(/((?:19|20)\d{2})年/g)].map((m) => +m[1])
      if (!years.length || !/^(19|20)\d{2}年/.test(s)) return
      if (Math.max(...years) >= 1998 || /[—–－-]\s*$/.test(s))
        out.push(`${paras.slice(Math.max(prev + 1, i - 3), i).join(' | ')} || ${s}`)
      prev = i
    })
  }
writeFileSync('.probe/p02-rows.txt', out.join('\n') + '\n')
console.log(out.length)
