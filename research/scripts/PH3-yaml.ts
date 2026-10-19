// Adds Baidu Baike entries from .probe/PH3-cards.tsv to content/photos/PH3.yaml for the ids given
// (checked by hand against the role on research/photo-PH3.md). Existing entries are kept.
//   node research/scripts/PH3-yaml.ts id1 id2 …
//   node research/scripts/PH3-yaml.ts id=<pic>@<lemmaId> …   a picture from a non-default entry (via PH3-wap.ts)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'

const PATH = 'content/photos/PH3.yaml'
const photos: Record<string, Record<string, string>> = existsSync(PATH) ? (parse(readFileSync(PATH, 'utf8')) ?? {}) : {}
const cards = new Map(
  readFileSync('.probe/PH3-cards.tsv', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
    .map((c) => [c[1], c] as const),
)
const names = new Map(
  readFileSync('research/photo-PH3.md', 'utf8')
    .split('\n')
    .map((l) => l.match(/^- ([a-z0-9-]+) (\S+?)（/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => [m[1], m[2]] as const),
)
for (const arg of process.argv.slice(2)) {
  const alt = arg.match(/^([a-z0-9-]+)=(\w+)@(\d+)$/)
  if (alt) {
    const [, id, pic, lemma] = alt
    photos[id] = {
      file: `https://bkimg.cdn.bcebos.com/pic/${pic}?x-bce-process=image/resize,m_lfit,w_480`,
      url: `https://baike.baidu.com/item/${encodeURIComponent(names.get(id)!)}/${lemma}`,
      author: '百度百科',
      license: '版权归原发布机构',
      ...(photos[id]?.focus ? { focus: photos[id].focus } : {}),
    }
    continue
  }
  const id = arg
  const c = cards.get(id)
  if (!c) throw new Error(`no card for ${id}`)
  const [, , name, lemma, , , image, , url] = c
  const pic = image.match(/\/pic\/(\w+)/)?.[1]
  if (!pic) throw new Error(`no image for ${id}`)
  let page = url.replace(/^http:/, 'https:')
  if (/\/item\/[^/]+$/.test(page)) page += `/${lemma}`
  photos[id] = {
    file: `https://bkimg.cdn.bcebos.com/pic/${pic}?x-bce-process=image/resize,m_lfit,w_480`,
    url: page,
    author: '百度百科',
    license: '版权归原发布机构',
    ...(photos[id]?.focus ? { focus: photos[id].focus } : {}),
  }
  void name
}
const sorted = Object.fromEntries(Object.entries(photos).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(PATH, `# Portrait attribution, one entry per person id. Written by tools/fetch-photos.ts; hand edits are kept.\n${stringify(sorted, { lineWidth: 0 })}`)
console.log(`${Object.keys(sorted).length} entries`)
