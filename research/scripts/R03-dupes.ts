// R03 one-off: list R03 manifest URLs (by ccdi path / host path) that other manifests already register.
import { readFileSync, readdirSync } from 'node:fs'

const dir = 'research/manifests'
const key = (u: string) => u.replace(/^.*?id_\//, '').replace(/^https?:\/\/(www\.|m\.)?/, '').replace(/[?#].*$/, '')
const own = readFileSync(`${dir}/R03.yaml`, 'utf8')
const mine = [...own.matchAll(/id: (r03-[\w-]+)[\s\S]*?url: "?([^",\s}]+)/g)].map((m) => [m[1], key(m[2])])
const others: [string, string][] = []
for (const f of readdirSync(dir)) {
  if (f === 'R03.yaml' || !f.endsWith('.yaml')) continue
  const t = readFileSync(`${dir}/${f}`, 'utf8')
  for (const m of t.matchAll(/id: ([\w-]+)[\s\S]*?url: "?([^",\s}]+)/g)) others.push([m[1], key(m[2])])
}
for (const [id, k] of mine) {
  const hit = others.filter(([, ok]) => ok === k || ok.endsWith(k.split('/').slice(-1)[0]) && k.split('/').slice(-1)[0].length > 12)
  if (hit.length) console.log(id, '=>', hit.map((h) => h[0]).join(', '))
}
console.log('checked', mine.length)
