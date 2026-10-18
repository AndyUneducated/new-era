// R03 one-off: list Wayback snapshots of a URL pattern, to find archived CCDI column pages.
//   node research/scripts/R03-cdx.ts <url-pattern> [from] [to]   prints timestamp + original url
const [pat, from = '2017', to = '2019'] = process.argv.slice(2)
const u = `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(pat)}&from=${from}&to=${to}&output=json&limit=200&filter=statuscode:200`
const r = await fetch(u, { headers: { 'User-Agent': 'new-era-research/0.1' } })
const rows = (await r.json()) as string[][]
for (const row of rows.slice(1)) console.log(row[1], row[2])
