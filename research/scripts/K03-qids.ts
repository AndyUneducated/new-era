// The K03 name -> QID map: the K03-pick guesses plus the picks made by hand from .probe/K03-pick.txt.
//   node research/scripts/K03-qids.ts   -> .probe/K03-qid.json, and prints the QIDs for tools/fetch-wikidata.ts
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const guess = JSON.parse(readFileSync(join(ROOT, '.probe/K03-guess.json'), 'utf8')) as Record<string, string | null>

export const byHand: Record<string, string> = {
  王旭东: 'Q702752', // 1946, 河北省委书记、信息产业部部长 (Q63035008 is the 1967 Palace Museum director, 19th/20th lists)
  石云生: 'Q3380928',
  刘书田: 'Q8296000',
  刘振华: 'Q9110973',
  刘镇武: 'Q8299330',
  杨怀庆: 'Q8296050',
  肖扬: 'Q519871',
  吴双战: 'Q7928525',
  沈滨义: 'Q8319275',
  宋照肃: 'Q9128818',
  宋德福: 'Q3373917', // 1946–2007, 人事部部长、福建省委书记 (Q97347919 is a Hubei namesake)
  张云川: 'Q702467',
  张中伟: 'Q8296186',
  张文台: 'Q8299814',
  季允石: 'Q3372410',
  赵可铭: 'Q8299760',
  钱树根: 'Q8291427',
  温宗仁: 'Q8299543',
  白春礼: 'Q4843133',
  翟虎渠: 'Q8291698',
  胡永柱: 'Q8317063',
  林树森: 'Q709170',
  岳福洪: 'Q8291723',
  温熙森: 'Q8291742',
  周生贤: 'Q500338',
  朱发忠: 'Q8292251',
  李长印: 'Q8291730',
  谢企华: 'Q8291617',
  息中朝: 'Q8291683',
  蒋文兰: 'Q18119111',
  闵维方: 'Q8291660',
  张黎: 'Q10943415',
  奚国华: 'Q16184865',
  朱文泉: 'Q8299837',
  陶建幸: 'Q9371082',
  石大华: 'Q8291747',
  苏新添: 'Q18119065',
  邓朴方: 'Q137538',
  李志坚: 'Q8291442', // 1940–2016 (Q110405386, born 1962, is too young for the 2002 list)
  李安东: 'Q8291885', // 上将 (the search guess Q772722 is an Italian pilot)
  李克: 'Q8291440', // 1956, 壮族 — the zhwiki list links 李克 (1956年); Q30940910 (1955) is a judge
  王谦: 'Q8316952', // zhwiki 王謙 (1946年), linked from the 16th alternate list; not the 1917 Shanxi leader
  张孝忠: 'Q8315774', // zhwiki 张孝忠 (中将), 第二炮兵政治部主任
}

const qid: Record<string, string | null> = { ...guess }
for (const [name, q] of Object.entries(byHand)) qid[name] = q
writeFileSync(join(ROOT, '.probe/K03-qid.json'), JSON.stringify(qid, null, 1))
const missing = Object.entries(qid).filter(([, q]) => !q).map(([n]) => n)
console.log(`${Object.values(qid).filter(Boolean).length} QIDs; unresolved: ${missing.join(' ')}`)

// --fetch: write the records with tools/fetch-wikidata.ts (research/wikidata/<QID>.json), skipping ones already there
if (process.argv.includes('--fetch')) {
  const want = [...new Set(Object.values(qid).filter((q): q is string => !!q))].filter((q) => !existsSync(join(ROOT, 'research/wikidata', `${q}.json`)))
  for (let i = 0; i < want.length; i += 50) {
    const r = spawnSync(process.execPath, ['tools/fetch-wikidata.ts', ...want.slice(i, i + 50)], { cwd: ROOT, stdio: 'inherit' })
    if (r.status) process.exit(r.status)
  }
}
