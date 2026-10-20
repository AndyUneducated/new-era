// Downloads candidate pictures into .probe/PH11-view/<name>.<ext> for looking at them before making an entry.
//   node research/scripts/PH11-get.ts <name> <image url> <referer, or -> [<name> <url> <referer>] …
//   node research/scripts/PH11-get.ts --file=<name TAB url TAB referer per line>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const DIR = '.probe/PH11-view'
mkdirSync(DIR, { recursive: true })
const args = process.argv.slice(2)
const file = args.find((a) => a.startsWith('--file='))?.slice(7)
const jobs: string[][] = []
if (file) for (const l of readFileSync(file, 'utf8').split('\n').filter((l) => l.includes('\t'))) jobs.push(l.trim().split('\t'))
else {
  const rest = args.filter((a) => !a.startsWith('--'))
  for (let i = 0; i < rest.length; i += 3) jobs.push(rest.slice(i, i + 3))
}
for (const [name, url, ref] of jobs) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': url.includes('wikimedia.org') ? 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)' : UA, ...(ref && ref !== '-' ? { Referer: ref } : {}) },
      signal: AbortSignal.timeout(30000),
    })
    const type = res.headers.get('content-type') ?? ''
    const buf = Buffer.from(await res.arrayBuffer())
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg'
    if (!res.ok || !(type.startsWith('image') || type.includes('octet-stream') || type === '') || buf.length < 1000) {
      console.log(`FAIL ${name} ${res.status} ${type} ${buf.length}`)
      continue
    }
    writeFileSync(`${DIR}/${name}.${ext}`, buf)
    console.log(`ok ${name}.${ext} ${buf.length}`)
  } catch (e) {
    console.log(`ERR ${name} ${(e as Error).message}`)
  }
}
