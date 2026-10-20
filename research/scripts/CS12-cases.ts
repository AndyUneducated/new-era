// CS12: list the case studies the build loads in batch mode, and the length of fugitives-skynet
process.argv.push('--batch=CS12')
const { loadAll } = await import('../../tools/build/load.ts')
const db = loadAll()
console.log(db.cases.length, db.cases.map((c) => c.id).join(' '))
const c = db.cases.find((x) => x.id === 'fugitives-skynet')
if (c) {
  const han = (s: string) => (s.match(/[\u4e00-\u9fff]/g) ?? []).length
  const body = [c.summary, ...c.sections.map((s) => s.text), ...c.editor.map((e) => e.text)]
  console.log('chars', body.reduce((n, s) => n + s.length, 0), 'han', body.reduce((n, s) => n + han(s), 0), 'people', c.people.length, 'sections', c.sections.length, 'events', c.events.length, 'voices', c.voices.length)
}
