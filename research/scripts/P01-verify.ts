// P01 one-off: confirms the build loads and checks content/chiefs/P01.yaml (run with --batch=P01).
// Report: .probe/P01-verify.txt
import { writeFileSync } from 'node:fs'
import { check } from '../../tools/build/check.ts'
import { errors, warnings } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const data = loadAll()
check(data)
const mine = data.chiefs.filter((c) => c.cite.startsWith('p01-') || ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'].includes(c.prov))
const out = [
  `chiefs loaded ${data.chiefs.length}, P01 provinces ${mine.length}, with person ${mine.filter((c) => c.person).length}`,
  `errors ${errors.length}`,
  ...errors.filter((e) => /chief|p01|P01/.test(e)),
  `warnings mentioning chief/p01: ${warnings.filter((w) => /chief|p01-|P01/.test(w)).length}`,
  ...warnings.filter((w) => /chief|p01-|P01/.test(w)),
]
writeFileSync('.probe/P01-verify.txt', out.join('\n') + '\n')
