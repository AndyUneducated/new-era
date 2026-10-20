// RL7: for uncovered list people, scan sources whose id ends with "-wiki-<id>" (their own wiki page) for sentences naming another card holder.
// usage: node research/scripts/RL7-self.ts  → .probe/RL7-self.txt
import fs from 'node:fs';
import { path } from '../../tools/build/io.ts';
import { loadAll } from '../../tools/build/load.ts';

const all: any = await loadAll();
const people: any[] = all.people;
const covered = new Set<string>();
for (const r of all.relations) { covered.add(r.a); covered.add(r.b); }
const list = fs.readFileSync(path('research/lists/R19-case-people-no-relation.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const names = people.filter(p => p.name && p.name.length >= 2).map(p => [p.name as string, p.id as string]);
const texts: Map<string, string> = all.texts;
const out: string[] = [];
for (const [id, name] of list) {
  if (covered.has(id)) continue;
  const srcs = [...texts.keys()].filter(s => s.endsWith('-wiki-' + id) || s.endsWith('-wiki-' + id.replace(/-[a-z]+$/, '')));
  const hits: string[] = [];
  for (const s of srcs) {
    const t = texts.get(s) ?? '';
    for (const sent of t.split(/(?<=[。；\n])/)) {
      if (!sent.includes(name) && !/[年月]/.test(sent)) continue;
      const who = names.filter(([n, pid]) => pid !== id && n !== name && sent.includes(n)).map(([n, pid]) => `${n}=${pid}`);
      if (who.length) hits.push(`  [${s}] {${[...new Set(who)].slice(0, 6).join(' ')}} ${sent.trim().slice(0, 160)}`);
    }
  }
  if (hits.length) out.push(`## ${id} ${name}`, ...hits.slice(0, 10));
}
fs.writeFileSync(path('.probe/RL7-self.txt'), out.join('\n') + '\n');
console.log('ok', out.length);
