// RL7: check that person ids exist and list existing relations touching them.
// usage: node research/scripts/RL7-ids.ts id1 id2 ...  → .probe/RL7-ids.txt
import fs from 'node:fs';
import { path } from '../../tools/build/io.ts';
import { loadAll } from '../../tools/build/load.ts';

const ids = process.argv.slice(2);
const all = await loadAll();
const people: any[] = (all as any).people;
const relations: any[] = (all as any).relations;
const byId = new Map(people.map((p: any) => [p.id, p]));
const out: string[] = [];
for (const id of ids) {
  const p: any = byId.get(id);
  if (!p) { out.push(`MISSING ${id}`); continue; }
  const rels = relations.filter((r: any) => r.a === id || r.b === id).map((r: any) => `${r.a}/${r.b}:${r.kind}`);
  out.push(`${id}\t${p.name}\t${rels.join(' ; ')}`);
}
fs.writeFileSync(path('.probe/RL7-ids.txt'), out.join('\n') + '\n');
console.log('ok', out.length);
