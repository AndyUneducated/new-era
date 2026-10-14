// One-off: sentenced, still-serving tigers get status detained (howto §4: detained = 在押服刑).
import fs from 'node:fs';

const file = 'research/scripts/K04-data.ts';
let src = fs.readFileSync(file, 'utf8');

const notes: Record<string, string> = {
  孙怀山: '在押服刑：2018 年一审被判有期徒刑十四年。',
  沈德咏: '在押服刑：2023 年一审被判有期徒刑十五年。',
  杨崇勇: '在押服刑：2018 年一审被判无期徒刑。',
  韩勇: '在押服刑：2025 年一审被判死刑缓期二年执行。',
  李士祥: '在押服刑：2019 年一审被判有期徒刑十年。',
  吕锡文: '在押服刑：2017 年一审被判有期徒刑十三年。',
  李云峰: '在押服刑：2018 年一审被判有期徒刑十二年。',
  王敏: '在押服刑：2016 年一审被判有期徒刑十二年。',
  曹广晶: '在押服刑：2024 年一审被判无期徒刑。',
  蒋超良: '在押服刑：2026 年一审被判死刑缓期二年执行、终身监禁。',
  潘逸阳: '在押服刑：2017 年一审被判有期徒刑二十年。',
  陈刚: '在押服刑：2021 年一审被判有期徒刑十五年。',
  胡怀邦: '在押服刑：2021 年一审被判无期徒刑；本站未找到其立案审查的官方通报。',
};

for (const [name, note] of Object.entries(notes)) {
  const start = src.indexOf(`\n  ${name}: {`);
  if (start < 0) throw new Error(`no block ${name}`);
  const end = src.indexOf('\n  },', start);
  const block = src.slice(start, end);
  if (!block.includes("s: 'purged',")) throw new Error(`no purged ${name}`);
  let next = block.replace("s: 'purged',", 'XX_STATUS');
  next = next.replace(/\n    sn: '[^']*',/, '');
  next = next.replace('XX_STATUS', `s: 'detained',\n    sn: '${note}',`);
  src = src.slice(0, start) + next + src.slice(end);
}
fs.writeFileSync(file, src, 'utf8');
console.log('updated', Object.keys(notes).length);
