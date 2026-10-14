// One-off: report which needles appear in which source texts (with a little context).
import { readFileSync, writeFileSync } from 'node:fs';

const checks: Record<string, string[]> = JSON.parse(readFileSync('.probe/b22-needles.json', 'utf8'));
const out: string[] = [];
for (const [id, needles] of Object.entries(checks)) {
  const text = readFileSync(`sources/text/${id}.txt`, 'utf8');
  out.push(`## ${id}`);
  for (const n of needles) {
    const i = text.indexOf(n);
    out.push(i < 0 ? `  MISS ${n}` : `  ok   ${n}  …${text.slice(Math.max(0, i - 30), i + n.length + 50).replace(/\s+/g, ' ')}…`);
  }
}
writeFileSync('.probe/b22-check.txt', out.join('\n'));
