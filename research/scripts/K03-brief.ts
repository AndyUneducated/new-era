// A short block per K03 person for writing the cards: id, list note, Wikidata dates, the zhwiki lead and the
// career sentences from 1995 on (the posts a tier-2 card keeps).
//   node research/scripts/K03-brief.ts [chunk size]   -> .probe/K03-brief-<n>.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const roster = parse(read('research/roster/K03.yaml')) as { id: string; name: string }[]
const facts = JSON.parse(read('.probe/K03-facts.json')) as Record<string, { q: string; list: string; gender: string; ethnicity?: string; born?: string; died?: string; birthplace?: string }>

const POST = /书记|省长|主席|部长|主任|司令员|政治委员|政委|院长|局长|署长|总经理|董事长|检察长|秘书长|参谋长|行长|会长|总裁/
const size = Number(process.argv[2] ?? 45)
const blocks: string[] = []
for (const { id, name } of roster) {
  const f = facts[name]
  const file = join(ROOT, '.probe/K03-wiki', `${name}-${f.q}.txt`)
  const text = existsSync(file) ? read(`.probe/K03-wiki/${name}-${f.q}.txt`) : ''
  const cut = text.indexOf('\n==')
  const lead = (cut > 0 ? text.slice(0, cut) : text).replace(/\s+/g, '').replace(/（[^）]*?[ᠠ-ᡷ][^）]*）/g, '').slice(0, 240)
  const body = (cut > 0 ? text.slice(cut) : '').replace(/==[^=\n]+==/g, '').replace(/\s+/g, '')
  const career = body
    .split(/(?<=[。；])/)
    .filter((s) => POST.test(s) && /(199[5-9]|20\d\d)年/.test(s))
    .join('')
    .slice(0, 320)
  blocks.push(`## ${name} ${id} ${f.q} ${f.list}${f.gender === 'f' ? ' 女' : ''}${f.ethnicity ? ` ${f.ethnicity}` : ''} | ${f.born ?? '?'}–${f.died ?? ''} | ${f.birthplace ?? '?'}\n${lead}\n> ${career}`)
}
for (let i = 0; i * size < blocks.length; i++) writeFileSync(join(ROOT, `.probe/K03-brief-${i + 1}.txt`), blocks.slice(i * size, (i + 1) * size).join('\n') + '\n')
console.log(`${blocks.length} people in ${Math.ceil(blocks.length / size)} briefs`)
