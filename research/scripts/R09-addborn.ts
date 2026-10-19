// Add Wikidata birth dates / places to R09 cards that lack them, and cite the Wikidata record.
import { readFileSync, writeFileSync } from 'node:fs'

const add: Record<string, { born?: string; birthplace?: string }> = {
  'zhu-junyi': { born: '1951-02' },
  'qin-yu': { born: '1964-06' },
  'guo-weiguo': { born: '1967' },
  'xie-yalong': { born: '1955-12-01', birthplace: '重庆' },
  'nan-yong': { born: '1962-06-16' },
  'yang-yimin': { born: '1956-11-23' },
  'wang-dengfeng': { born: '1965' },
  'hu-guochu': { born: '1953' },
  'su-hao': { born: '1959' },
  'wang-maoshe': { born: '1957-08', birthplace: '山西安泽' },
  'deng-quanzhong': { born: '1962-03', birthplace: '四川绵阳' },
  'cheng-danfeng': { born: '1970' },
  'wen-qingliang': { born: '1959' },
  'he-huazhang': { birthplace: '四川成都' },
}

const path = 'content/people/R09.yaml'
const blocks = readFileSync(path, 'utf8').split(/\r?\n(?=- id: )/)
const out = blocks.map((b) => {
  const id = b.match(/^- id: (\S+)/)?.[1]
  if (!id || !add[id]) return b
  const q = b.match(/wikidata: (Q\d+)/)?.[1]
  if (!q) return b
  let lines = b.split(/\r?\n/)
  const gi = lines.findIndex((l) => /^  (gender|name): /.test(l) && !/^  name: /.test(lines[lines.indexOf(l) + 1] ?? ''))
  const at = lines.findIndex((l) => l.startsWith('  gender: ')) >= 0 ? lines.findIndex((l) => l.startsWith('  gender: ')) : lines.findIndex((l) => l.startsWith('  name: '))
  void gi
  const ins: string[] = []
  if (add[id].born && !lines.some((l) => l.startsWith('  born: '))) ins.push(`  born: ${add[id].born}`)
  if (add[id].birthplace && !lines.some((l) => l.startsWith('  birthplace: '))) ins.push(`  birthplace: ${add[id].birthplace}`)
  if (add[id].birthplace && lines.some((l) => l.startsWith('  born: '))) {
    const bi = lines.findIndex((l) => l.startsWith('  born: '))
    lines.splice(bi + 1, 0, ...ins)
  } else lines.splice(at + 1, 0, ...ins)
  lines = lines.map((l) => (l.startsWith('  cites: [') && !l.includes(`wd-${q}`) ? l.replace(/\]\s*$/, `, wd-${q}]`) : l))
  return lines.join('\n')
})
writeFileSync(path, out.join('\n'), 'utf8')
console.log('ok')
