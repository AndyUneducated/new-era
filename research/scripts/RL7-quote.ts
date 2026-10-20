// RL7: check every RL7 relation quote appears verbatim in its cited source text.
// usage: node research/scripts/RL7-quote.ts  → .probe/RL7-quote.txt
import fs from 'node:fs';
import { path } from '../../tools/build/io.ts';
import { loadAll } from '../../tools/build/load.ts';

const all: any = await loadAll();
const texts: Map<string, string> = all.texts;
const rels: any[] = all.relations.filter((r: any) => (r._file ?? r.file ?? '').includes('RL7') || r.batch === 'RL7');
const raw = fs.readFileSync(path('content/relations/RL7.yaml'), 'utf8');
const out: string[] = [];
let n = 0;
for (const blk of raw.split(/\n- a: /).slice(1)) {
  const a = blk.split('\n')[0].trim();
  const b = blk.match(/\n  b: (.+)/)?.[1].trim();
  const cite = blk.match(/\n  cite: (.+)/)?.[1].trim() ?? '';
  const quote = blk.match(/\n  quote: (.+)/)?.[1].trim() ?? '';
  const t = texts.get(cite);
  n++;
  if (!t) out.push(`NO TEXT ${a}/${b} ${cite}`);
  else if (!t.includes(quote)) out.push(`MISSING ${a}/${b} ${cite}: ${quote}`);
}
out.push(`checked ${n} (loader rels tagged ${rels.length})`);
fs.writeFileSync(path('.probe/RL7-quote.txt'), out.join('\n') + '\n');
console.log('ok', out.length);
