// Merge sources registered more than once for the same page: node tools/dedupe-sources.ts [--dry]
// The kept id is the one with the most text; the stored texts are merged paragraph by paragraph, so every
// quote checked against any of the copies still matches. Cites in content/ are rewritten to the kept id.
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isMap, isSeq, parseDocument, type Document, type YAMLMap } from 'yaml'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const dry = process.argv.includes('--dry')
const manifestDir = join(ROOT, 'research', 'manifests')
const textOf = (id: string) => join(ROOT, 'sources', 'text', `${id}.txt`)
const readText = (id: string) => (existsSync(textOf(id)) ? readFileSync(textOf(id), 'utf8') : '')

interface Entry { id: string; url: string; file: string; node: YAMLMap; excerpt: boolean }
const docs = new Map<string, Document>()
const entries: Entry[] = []
for (const f of readdirSync(manifestDir).filter((f) => f.endsWith('.yaml'))) {
  const doc = parseDocument(readFileSync(join(manifestDir, f), 'utf8'))
  docs.set(f, doc)
  const web = doc.get('web')
  if (!isSeq(web)) continue
  for (const node of web.items)
    if (isMap(node)) entries.push({ id: String(node.get('id')), url: String(node.get('url')), file: f, node, excerpt: node.get('excerpt') === true })
}

const groups = new Map<string, Entry[]>()
for (const e of entries) groups.set(e.url, [...(groups.get(e.url) ?? []), e])

const rename = new Map<string, string>()
const touched = new Set<string>()
for (const list of groups.values()) {
  if (list.length < 2) continue
  // a full text beats an excerpt; then the longer text
  const [keep, ...drop] = [...list].sort((a, b) => Number(a.excerpt) - Number(b.excerpt) || readText(b.id).length - readText(a.id).length)
  const paras = readText(keep.id).split(/\n{2,}/).filter((p) => p.trim())
  const has = new Set(paras.map((p) => p.trim()))
  for (const d of drop)
    for (const p of readText(d.id).split(/\n{2,}/))
      if (p.trim() && !has.has(p.trim()) && !paras.some((q) => q.includes(p.trim()))) {
        paras.push(p)
        has.add(p.trim())
      }
  // a re-fetch of the kept excerpt should still keep every merged paragraph
  if (keep.excerpt) {
    const kept = new Set<string>()
    for (const e of [keep, ...drop]) {
      const k = e.node.get('keep')
      if (isSeq(k)) for (const x of k.items) kept.add(String((x as { value?: unknown }).value ?? x))
    }
    if (kept.size) keep.node.set('keep', [...kept])
  }
  if (!dry) writeFileSync(textOf(keep.id), `${paras.join('\n\n').trimEnd()}\n`)
  for (const d of drop) {
    rename.set(d.id, keep.id)
    const web = docs.get(d.file)!.get('web')
    if (isSeq(web)) web.items.splice(web.items.indexOf(d.node), 1)
    touched.add(d.file)
    if (!dry && existsSync(textOf(d.id))) rmSync(textOf(d.id))
  }
  touched.add(keep.file)
}

if (!dry) for (const f of touched) writeFileSync(join(manifestDir, f), docs.get(f)!.toString({ lineWidth: 0 }))

// rewrite cites everywhere under content/
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const pattern = rename.size ? new RegExp(`(?<![A-Za-z0-9-])(${[...rename.keys()].map(esc).join('|')})(?![A-Za-z0-9-])`, 'g') : undefined
let rewrites = 0
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.yaml') ? [join(dir, d.name)] : []))
if (pattern)
  for (const f of walk(join(ROOT, 'content'))) {
    const s = readFileSync(f, 'utf8')
    const t = s.replace(pattern, (m) => {
      rewrites++
      return rename.get(m)!
    })
    if (t !== s && !dry) writeFileSync(f, t)
  }
console.log(`${rename.size} duplicate ids merged into ${new Set(rename.values()).size} sources, ${rewrites} cites rewritten${dry ? ' (dry run)' : ''}`)
