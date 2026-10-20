// U10: dump every existing turn record with keyword hits for the ten new routes, to .probe/U10-dump.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const root = new URL('../../', import.meta.url)
const people = new Map<string, any>()
for (const f of readdirSync(new URL('content/people/', root))) {
  if (!f.endsWith('.yaml')) continue
  const list = parse(readFileSync(new URL('content/people/' + f, root), 'utf8')) ?? []
  for (const p of list) if (p?.id) people.set(p.id, p)
}

const keys: Record<string, RegExp> = {
  org: /组织部|组织员|组织局|人事|干部局|人社/g,
  office: /秘书长|办公厅|办公室主任|办公室副主任/g,
  think: /研究中心|研究室|研究院|政研室|智库|社科院|社会科学院|研究所|发展研究/g,
  soe: /集团|公司|总经理|董事长|央企|国企|总公司/g,
  aid: /援藏|援疆|援青|对口支援|挂职|西藏|新疆/g,
  united: /统战|民族|民委|宗教|侨|壮族|藏族|回族|维吾尔|蒙古族|彝族|满族|苗族|土家族|白族|朝鲜族|哈萨克/g,
  parties: /民盟|民进|九三|致公|农工|民建|民革|台盟|民主党派|党外|无党派|非中共/g,
  open: /公开选拔|公选|考取|公开招|竞争上岗|招考|笔试/g,
  campus: /校长|大学党委书记|学院院长/g,
}

const out: string[] = []
const only = process.argv.slice(2)
for (const f of readdirSync(new URL('content/turns/', root))) {
  if (!f.endsWith('.yaml') || f.startsWith('00')) continue
  const doc = parse(readFileSync(new URL('content/turns/' + f, root), 'utf8')) ?? {}
  for (const [id, r] of Object.entries<any>(doc)) {
    if (only.length && !only.includes(id)) continue
    const p = people.get(id)
    const text = (r.turns ?? []).map((t: any) => `${t.text} ${t.did}`).join(' ')
    const pos = (p?.positions ?? []).map((x: any) => `${x.title}${x.place ? '@' + x.place : ''}(${x.from ?? ''}–${x.to ?? ''})`)
    const all = text + ' ' + pos.join(' ') + ' ' + (p?.bio ?? '') + ' ' + (p?.ethnicity ?? '')
    out.push(`## ${id} ${p?.name ?? '?'} [${f}] routes=${(r.routes ?? []).join(',')}  eth=${p?.ethnicity ?? ''}`)
    out.push('  turns: ' + (r.turns ?? []).map((t: any) => `${t.date} ${t.h}`).join(' | '))
    const places = [...new Set((p?.positions ?? []).map((x: any) => x.place).filter(Boolean))]
    out.push('  places: ' + places.join(','))
    for (const [k, re] of Object.entries(keys)) {
      const hits: string[] = []
      for (const m of all.matchAll(re)) {
        const s = Math.max(0, m.index! - 25), e = Math.min(all.length, m.index! + m[0].length + 25)
        hits.push(all.slice(s, e).replace(/\s+/g, ' '))
        if (hits.length >= 4) break
      }
      if (hits.length) out.push(`  ${k}: ` + hits.join(' ‖ '))
    }
    out.push('  pos: ' + pos.join('; '))
  }
}
writeFileSync(new URL('.probe/U10-dump.txt', root), out.join('\n'))
