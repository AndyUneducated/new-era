import fs from 'node:fs';
const p = 'C:/Users/yuxiz/.cursor/projects/c-Users-yuxiz-AaaProjects/agent-transcripts/7da23ef3-7a1b-43e2-97f4-d60276077aad/subagents/7012082a-3888-4a21-bda1-c40333c56291.jsonl';
const s = fs.readFileSync(p, 'utf8');
const re = /https?:\/\/[A-Za-z0-9./_\-?=&%]+/g;
const set = new Set<string>();
for (const m of s.matchAll(re)) if (/zaobao|rfa\.org|bbc\.com|voachinese|cna\.com\.tw|nytimes|reuters/.test(m[0])) set.add(m[0]);
fs.writeFileSync('.probe/b16-urls.txt', [...set].sort().join('\n'));
