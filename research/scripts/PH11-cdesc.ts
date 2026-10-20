// Commons file descriptions (ImageDescription, Artist, LicenseShortName, DateTimeOriginal, categories) for checking
// who a picture shows before using it. Writes .probe/PH11-cdesc.txt.
//   node research/scripts/PH11-cdesc.ts "File:John Williamson (7787971698).jpg" …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const out = '.probe/PH11-cdesc.txt'
writeFileSync(out, '')
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
for (const t of process.argv.slice(2)) {
  const r = (await (
    await fetch(
      `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', action: 'query', titles: t, prop: 'imageinfo|categories', iiprop: 'url|size|extmetadata', iiurlwidth: '480' })}`,
      { headers: { 'User-Agent': UA } },
    )
  ).json()) as any
  for (const p of Object.values(r.query.pages) as any[]) {
    const m = p.imageinfo?.[0]?.extmetadata ?? {}
    appendFileSync(
      out,
      `== ${p.title}\n${p.imageinfo?.[0]?.width}x${p.imageinfo?.[0]?.height} ${p.imageinfo?.[0]?.thumburl}\ndesc: ${strip(m.ImageDescription?.value)}\nartist: ${strip(m.Artist?.value)}\nlicense: ${strip(m.LicenseShortName?.value)}\ndate: ${strip(m.DateTimeOriginal?.value)}\ncredit: ${strip(m.Credit?.value)}\ncats: ${(p.categories ?? []).map((c: any) => c.title).join(' | ')}\n\n`,
    )
  }
}
console.log('done')
