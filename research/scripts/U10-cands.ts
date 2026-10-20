// U10: people with a card but no turn record, grouped by keyword hits for the ten new routes; plus name lookups
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'

const root = new URL('../../', import.meta.url)
const people = new Map<string, any>()
for (const f of readdirSync(new URL('content/people/', root))) {
  if (!f.endsWith('.yaml')) continue
  const list = parse(readFileSync(new URL('content/people/' + f, root), 'utf8')) ?? []
  for (const p of list) if (p?.id) people.set(p.id, { ...p, file: f })
}
const turned = new Set<string>()
for (const f of readdirSync(new URL('content/turns/', root))) {
  if (!f.endsWith('.yaml')) continue
  for (const id of Object.keys(parse(readFileSync(new URL('content/turns/' + f, root), 'utf8')) ?? {})) turned.add(id)
}
const roster: string[] = []
for (const f of readdirSync(new URL('research/roster/', root))) roster.push(readFileSync(new URL('research/roster/' + f, root), 'utf8'))
const rosterAll = roster.join('\n') + readFileSync(new URL('research/roster.yaml', root), 'utf8')

const keys: Record<string, RegExp> = {
  org: /组织部(副)?部长|中组部|组织部常务|人事部|公务员局/,
  office: /秘书长|办公厅主任/,
  think: /发展研究中心|社会科学院|国务院研究室|政策研究室|宏观经济研究院/,
  soe: /集团.*(总经理|董事长)|总公司.*(总经理|董事长)/,
  aid: /援藏|援疆|对口支援/,
  united: /统战部|民族事务委员会|宗教事务局|侨务/,
  parties: /民盟|民进|九三学社|致公党|农工党|民建|民革|台盟|无党派/,
  open: /公开选拔|公选/,
  campus: /大学校长|大学党委书记|学院院长/,
}
const out: string[] = []
const names = process.argv.slice(2)
if (names.length) {
  for (const n of names) {
    const hits = [...people.values()].filter((p) => p.name === n || p.id === n)
    out.push(`${n}: ` + (hits.map((p) => `${p.id} tier${p.tier} ${p.status} [${p.file}] turns=${turned.has(p.id)}`).join(' | ') || (rosterAll.includes(n) ? 'IN ROSTER ONLY' : 'none')))
  }
} else {
  for (const [k, re] of Object.entries(keys)) {
    out.push(`## ${k}`)
    for (const p of people.values()) {
      if (turned.has(p.id)) continue
      const pos = (p.positions ?? []).map((x: any) => x.title).join('；')
      const blob = pos + ' ' + (p.bio ?? '') + ' ' + (p.headline ?? '')
      if (re.test(blob)) out.push(`  ${p.id} ${p.name} t${p.tier} ${p.status} | ${p.headline ?? ''} | ${pos.slice(0, 160)}`)
    }
  }
}
writeFileSync(new URL('.probe/U10-cands.txt', root), out.join('\n'))
