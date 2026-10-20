// U10: count people per new route across content/turns/*.yaml (old vs U10), to .probe/U10-routes.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const root = new URL('../../', import.meta.url)
const NEW = ['org', 'transfer', 'office', 'think', 'soe', 'aid', 'united', 'parties', 'open', 'campus']
const old = new Map<string, string[]>(NEW.map((k) => [k, []]))
const fresh = new Map<string, string[]>(NEW.map((k) => [k, []]))
let records = 0
for (const f of readdirSync(new URL('content/turns/', root))) {
  if (!f.endsWith('.yaml') || f.startsWith('00')) continue
  const doc = parse(readFileSync(new URL('content/turns/' + f, root), 'utf8')) ?? {}
  for (const [id, r] of Object.entries<any>(doc)) {
    records++
    for (const k of r.routes ?? []) if (NEW.includes(k)) (f === 'U10.yaml' ? fresh : old).get(k)!.push(id)
  }
}
const out = [`records ${records}`]
for (const k of NEW) {
  const o = old.get(k)!, n = fresh.get(k)!
  out.push(`${k}\told ${o.length}\tnew ${n.length}\ttotal ${o.length + n.length}\tnew: ${n.join(',')}\told: ${o.join(',')}`)
}
writeFileSync(new URL('.probe/U10-routes.txt', root), out.join('\n'))
