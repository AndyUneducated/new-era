// For the people of a list file (rank TAB id TAB name …), finds their Wikidata id in content/people/*.yaml and writes
// the image (P18) and Commons category (P373) Wikidata gives, with the Commons file's size, licence and description.
// Only leads: a Wikidata image is someone's claim, so the description and source page are checked before use.
//   node research/scripts/PH12-wd.ts research/lists/R16-photo-next2.txt   → .probe/PH12-wd.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'new-era-research/1.0 (photo sourcing)'
const ids = readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => /^rank/.test(l)).map((l) => l.split('\t')[1])
const qid = new Map<string, string>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const t = readFileSync(`content/people/${f}`, 'utf8').replace(/\r\n/g, '\n')
  for (const m of t.matchAll(/^- id: ([\w-]+)\n([\s\S]*?)(?=^- id: |(?![\s\S]))/gm)) {
    const q = m[2].match(/wikidata: (Q\d+)/)?.[1]
    if (q) qid.set(m[1], q)
  }
}
let out = ''
for (const id of ids) {
  const q = qid.get(id)
  if (!q) {
    out += `${id}\t-\n`
    continue
  }
  try {
    const j = (await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`, { headers: { 'User-Agent': UA } })).json()) as any
    const e = Object.values(j.entities)[0] as any
    const p18 = (e.claims?.P18 ?? []).map((c: any) => c.mainsnak.datavalue?.value)
    const p373 = (e.claims?.P373 ?? []).map((c: any) => c.mainsnak.datavalue?.value)
    out += `${id}\t${q}\t${e.labels?.zh?.value ?? e.labels?.en?.value ?? ''}\t${e.descriptions?.zh?.value ?? e.descriptions?.en?.value ?? ''}\tP18=${p18.join('|')}\tP373=${p373.join('|')}\n`
    for (const f of p18) {
      const r = (await (
        await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(f)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json`, { headers: { 'User-Agent': UA } })
      ).json()) as any
      const ii = (Object.values(r.query.pages)[0] as any).imageinfo?.[0]
      const md = ii?.extmetadata ?? {}
      const v = (k: string) => String(md[k]?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 200)
      out += `\t${ii?.width}x${ii?.height}\t${v('LicenseShortName')}\t${v('Artist')}\t${v('DateTimeOriginal')}\t${v('ImageDescription')}\t${v('Credit')}\t${ii?.url}\n`
    }
  } catch (err) {
    out += `${id}\t${q}\tERR ${(err as Error).message}\n`
  }
  await new Promise((r) => setTimeout(r, 300))
}
writeFileSync('.probe/PH12-wd.txt', out)
console.log('done')
