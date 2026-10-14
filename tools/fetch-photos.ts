// Portraits into public/photos/<person id>.<ext>, with attribution in content/photos.yaml (decisions #10).
//   node tools/fetch-photos.ts            add a Commons entry for every person whose Wikidata record has an image,
//                                         then download every entry that has no file yet
//   node tools/fetch-photos.ts --force    download again
//   node tools/fetch-photos.ts id …       only these people
// An entry's file is either "File:<Commons name>" or a direct image URL (an official portrait, licence
// "版权归原发布机构" unless stated). Entries written by hand are never overwritten.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const OUT = join(ROOT, 'public', 'photos')
const YAML_PATH = join(ROOT, 'content', 'photos.yaml')
const WIDTH = 480
mkdirSync(OUT, { recursive: true })

interface Entry { file?: string; url?: string; author?: string; license?: string; date?: string; focus?: string; why?: string }

const args = process.argv.slice(2)
const force = args.includes('--force')
const only = new Set(args.filter((a) => !a.startsWith('--')))

const photos: Record<string, Entry> = existsSync(YAML_PATH) ? (parse(readFileSync(YAML_PATH, 'utf8')) ?? {}) : {}

// people with a Wikidata image and no entry yet
const peopleDir = join(ROOT, 'content', 'people')
for (const f of readdirSync(peopleDir).filter((f) => f.endsWith('.yaml'))) {
  let list: { id: string; ids?: { wikidata?: string } }[] = []
  try {
    list = parse(readFileSync(join(peopleDir, f), 'utf8')) ?? []
  } catch {
    console.log(`skip ${f}: does not parse`)
    continue
  }
  for (const p of list) {
    const q = p.ids?.wikidata
    if (!q || photos[p.id]) continue
    const rec = join(ROOT, 'research', 'wikidata', `${q}.json`)
    if (!existsSync(rec)) continue
    const image = JSON.parse(readFileSync(rec, 'utf8')).image as string | undefined
    if (image) photos[p.id] = { file: `File:${image}` }
  }
}

const strip = (html?: string) =>
  html
    ?.replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    // Commons' {{Unknown|author}} template renders its label twice, or after "Anonymous"
    .replace(/^(.+)\1$/, '$1')
    .replace(/^(Anonymous)Unknown author$/, '$1')

async function commons(file: string) {
  const u = new URL('https://commons.wikimedia.org/w/api.php')
  const q = { action: 'query', format: 'json', titles: file, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: String(WIDTH) }
  for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v)
  const r = (await (await fetch(u, { headers: { 'User-Agent': UA } })).json()) as {
    query: { pages: Record<string, { imageinfo?: { thumburl: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }> }
  }
  const info = Object.values(r.query.pages)[0]?.imageinfo?.[0]
  if (!info) throw new Error(`no imageinfo for ${file}`)
  const m = info.extmetadata
  return {
    img: info.thumburl,
    url: info.descriptionurl,
    author: strip(m.Artist?.value),
    license: strip(m.LicenseShortName?.value),
    date: strip(m.DateTimeOriginal?.value)?.slice(0, 10),
  }
}

let ok = 0
let failed = 0
for (const [id, e] of Object.entries(photos).sort()) {
  if (only.size && !only.has(id)) continue
  const have = ['jpg', 'png', 'webp'].some((x) => existsSync(join(OUT, `${id}.${x}`)))
  if (!e.file || (have && !force)) continue
  try {
    let img = e.file
    if (e.file.startsWith('File:')) {
      const c = await commons(e.file)
      img = c.img
      e.url ??= c.url
      e.author ??= c.author
      e.license ??= c.license
      e.date ??= c.date
    } else e.license ??= '版权归原发布机构'
    // some official sites only serve images with a Referer from their own pages
    const headers: Record<string, string> = { 'User-Agent': UA }
    if (!e.file.startsWith('File:') && e.url) headers.Referer = e.url
    const res = await fetch(img, { headers })
    if (!res.ok) throw new Error(`${res.status} ${img}`)
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/') && !type.includes('octet-stream')) throw new Error(`not an image (${type}) ${img}`)
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
    let buf = Buffer.from(await res.arrayBuffer())
    // some servers append stray bytes after IEND, which strict PNG decoders reject
    const iend = ext === 'png' ? buf.lastIndexOf('IEND') : -1
    if (iend > 0) buf = buf.subarray(0, iend + 8)
    writeFileSync(join(OUT, `${id}.${ext}`), buf)
    ok++
    console.log(`ok ${id}`)
  } catch (err) {
    failed++
    console.log(`FAIL ${id}: ${(err as Error).message}`)
  }
  await new Promise((r) => setTimeout(r, 400))
}

const sorted = Object.fromEntries(Object.entries(photos).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(YAML_PATH, `# Portrait attribution, one entry per person id. Written by tools/fetch-photos.ts; hand edits are kept.\n${stringify(sorted, { lineWidth: 0 })}`)
console.log(`${ok} downloaded, ${failed} failed, ${Object.keys(photos).length} entries`)
