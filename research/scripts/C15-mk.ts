// 2026 SPP indictment notices for people whose card lacks the charge step: peeks the 12309 mirror pages
// (node research/scripts/R06-peek.ts c15s-<id>=<url> ...) and drafts manifest entries + fall-step texts.
//   node research/scripts/C15-mk.ts urls  -> prints peek args (one per line) to .probe/C15-mk-args.txt
//   node research/scripts/C15-mk.ts       -> .probe/C15-mk.txt (manifest yaml + step lines)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const HOST = 'https://login.12309.gov.cn:8443'
export const LIST: [string, string, string, string][] = [
  ['bi-baowen', '毕宝文', '2026-10-16', '/spp/qwfb/202610/t20261016_738747.shtml'],
  ['wang-fengchao', '王凤朝', '2026-10-15', '/spp/qwfb/202610/t20261015_738683.shtml'],
  ['zhang-yaoxue', '张尧学', '2026-10-13', '/spp/qwfb/202610/t20261013_738470.shtml'],
  ['pan-liang', '潘良', '2026-10-12', '/spp/qwfb/202610/t20261012_738373.shtml'],
  ['chen-weijun', '陈伟俊', '2026-10-09', '/spp/qwfb/202610/t20261009_738150.shtml'],
  ['yu-ze', '于泽', '2026-09-15', '/spp/qwfb/202609/t20260915_736693.shtml'],
  ['li-baian', '李百安', '2026-09-08', '/spp/qwfb/202609/t20260908_736307.shtml'],
  ['jin-zhizhen', '金之镇', '2026-08-24', '/spp/qwfb/202608/t20260824_735405.shtml'],
  ['jiang-duntao', '江敦涛', '2026-08-21', '/spp/qwfb/202608/t20260821_735327.shtml'],
  ['hou-weidong', '侯维栋', '2026-08-20', '/spp/qwfb/202608/t20260820_735260.shtml'],
  ['han-zhanwu', '韩占武', '2026-07-14', '/spp/qwfb/202607/t20260714_731884.shtml'],
  ['tang-dezhi', '唐德智', '2026-07-10', '/spp/qwfb/202607/t20260710_731709.shtml'],
  ['jiang-deguo', '姜德果', '2026-06-30', '/spp/qwfb/202606/t20260630_730805.shtml'],
  ['han-song-xa', '韩松', '2026-06-09', '/spp/qwfb/202606/t20260609_729371.shtml'],
  ['gao-xingfu', '高兴夫', '2026-06-04', '/spp/qwfb/202606/t20260604_729070.shtml'],
  ['gao-yichen', '高以忱', '2026-05-15', '/spp/qwfb/202605/t20260515_727453.shtml'],
  ['lin-jingzhen', '林景臻', '2026-05-13', '/spp/qwfb/202605/t20260513_727227.shtml'],
  ['liu-shaoyong', '刘绍勇', '2026-05-08', '/spp/qwfb/202605/t20260508_726991.shtml'],
  ['wang-huimin', '王会民', '2026-04-23', '/spp/qwfb/202604/t20260423_726265.shtml'],
  ['yang-xiaowei', '杨小伟', '2026-04-02', '/spp/qwfb/202604/t20260402_725242.shtml'],
  ['li-wenrong', '李文荣', '2026-01-07', '/spp/qwfb/202601/t20260107_715433.shtml'],
  ['xu-chuanzhi', '许传智', '2026-05-11', '/spp/qwfb/202605/t20260511_727113.shtml'],
  ['liu-kuanren', '刘宽忍', '2026-04-01', '/spp/qwfb/202604/t20260401_725198.shtml'],
  ['li-chunliang', '李春良', '2026-03-16', '/spp/qwfb/202603/t20260316_724038.shtml'],
  ['zhang-jianhua-gfkg', '张建华', '2026-02-10', '/spp/qwfb/202602/t20260210_719077.shtml'],
]

if (process.argv[2] === 'urls') {
  writeFileSync('.probe/C15-mk-args.txt', LIST.map(([id, , , p]) => `c15s-${id}=${HOST}${p}`).join('\n') + '\n', 'utf8')
} else {
  const out: string[] = []
  const steps: string[] = []
  for (const [id, name, date, p] of LIST) {
    const f = `.probe/R06-peek-c15s-${id}.txt`
    if (!existsSync(f)) {
      out.push(`# MISSING ${id}`)
      continue
    }
    const lines = readFileSync(f, 'utf8').split('\n').map((l) => l.replace(/^\s*\d+\|/, '').trim())
    const title = lines.find((l) => l.includes(`对${name}涉嫌`) && l.endsWith('提起公诉')) ?? ''
    const first = lines.find((l) => l.includes(`${name}涉嫌`) && l.includes('一案')) ?? ''
    const endOk = lines.some((l) => l.includes('追究其刑事责任。'))
    const charges = title.match(/涉嫌(.+?)案提起公诉/)?.[1] ?? '?'
    const m = first.match(/近日，(.+?)已向(.+?)提起公诉/)
    const sid = `c15-spp-${date}-${id}-charge`
    out.push(
      `  - id: ${sid}`,
      `    title: ${title || '?'}`,
      `    publisher: 最高人民检察院`,
      `    date: ${date}`,
      `    voice: official`,
      `    url: "${HOST}${p}"`,
      `    start: "${first.slice(0, 14)}"`,
      `    end: "追究其刑事责任。"${endOk ? '' : '  # END NOT FOUND'}`,
    )
    steps.push(`${id}\t${date}\t${m ? `${m[1]}以涉嫌${charges}罪向${m[2]}提起公诉` : `? ${first.slice(0, 60)}`}\t${sid}`)
  }
  writeFileSync('.probe/C15-mk.txt', out.join('\n') + '\n\n' + steps.join('\n') + '\n', 'utf8')
  console.log(out.length, steps.length)
}
