import { readFileSync, writeFileSync } from 'node:fs';

const y = readFileSync('content/cases/CS8.yaml', 'utf8');
const lens = [...y.matchAll(/^ +(?:- )?(?:summary|text): (.*?)\r?$/gm)].map((m) => m[1].length);
const people = (y.match(/^  people: \[(.*)\]/m)?.[1] ?? '').split(',').length;
writeFileSync('.probe/cs8-count.txt', `${lens.join(',')}\ntotal ${lens.reduce((a, b) => a + b, 0)}\npeople ${people}\n`);
