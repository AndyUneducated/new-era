import fs from 'node:fs';
import path from 'node:path';

const ids = process.argv.slice(2);
const dir = 'content/people';
const out = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.yaml')) continue;
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/);
  let cur = null;
  for (const l of lines) {
    const m = l.match(/^- id: (\S+)/);
    if (m) cur = m[1];
    const h = l.match(/^  headline: (.*)/);
    if (h && ids.includes(cur)) out.push(`${cur}\t${f}\t${h[1]}`);
  }
}
fs.writeFileSync('.probe/cs5-heads.txt', out.join('\n'), 'utf8');
