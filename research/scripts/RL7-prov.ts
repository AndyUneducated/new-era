// RL7: for uncovered list people, show 80-char windows around their names in provincial list sources (ids matching argv regex, default ^p0).
// usage: node research/scripts/RL7-prov.ts [regex]  → .probe/RL7-prov.txt
import fs from 'node:fs';
import { path } from '../../tools/build/io.ts';
import { loadAll } from '../../tools/build/load.ts';

const re = new RegExp(process.argv[2] ?? '^p0');
const all: any = await loadAll();
const rels: any[] = all.relations;
const covered = new Set<string>();
for (const r of rels) { covered.add(r.a); covered.add(r.b); }
const list = fs.readFileSync(path('research/lists/R19-case-people-no-relation.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const texts: Map<string, string> = all.texts;
const out: string[] = [];
for (const [id, name] of list) {
  if (covered.has(id) || !name || name.length < 2) continue;
  const hits: string[] = [];
  for (const [sid, t] of texts) {
    if (!re.test(sid) || typeof t !== 'string') continue;
    let i = t.indexOf(name);
    let n = 0;
    while (i >= 0 && n < 3) {
      hits.push(`  [${sid}] ${t.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ')}`);
      i = t.indexOf(name, i + 1); n++;
    }
  }
  if (hits.length) out.push(`## ${id} ${name}`, ...hits.slice(0, 8));
}
fs.writeFileSync(path('.probe/RL7-prov.txt'), out.join('\n') + '\n');
console.log('ok', out.length);
