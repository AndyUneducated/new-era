// E15: list every registered source dated 2026, and every 2026 event, so the new events reuse what is already there.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const out: string[] = []
const dir = join('research', 'manifests')
for (const f of readdirSync(dir).filter((x) => x.endsWith('.yaml'))) {
  const m = parse(readFileSync(join(dir, f), 'utf8')) ?? {}
  for (const s of (m.web ?? []) as { id: string; title: string; date?: string; publisher?: string; voice?: string }[])
    if (String(s.date ?? '').startsWith('2026') || /-2026-/.test(s.id)) out.push(`${s.id}\t${s.date}\t${s.voice}\t${s.publisher}\t${s.title}`)
}
out.sort((a, b) => a.split('\t')[1].localeCompare(b.split('\t')[1]))
writeFileSync(join('.probe', 'e15-sources-2026.txt'), out.join('\n'), 'utf8')
