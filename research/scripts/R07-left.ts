// Lists rows still undone on the R03/R05/R06 falls lists after R07, flagging names that already have a card somewhere.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const read = (p: string) => readFileSync(p, "utf8");
const rows = (p: string) =>
  read(p)
    .split(/\r?\n/)
    .filter((l) => l.startsWith("- {"))
    .map((l) => ({
      name: /name: ([^,]+),/.exec(l)?.[1].trim() ?? "",
      date: /date: ([^,]+),/.exec(l)?.[1].trim() ?? "",
      post: /post: "?([^",]+(?:、[^",]+)*)"?,/.exec(l)?.[1].trim() ?? "",
      done: /done: true/.test(l),
      from: /from: (\w+)/.exec(l)?.[1] ?? "",
    }));

const r07 = rows("research/falls-list/R07.yaml");
const cardNames = new Map<string, string[]>();
for (const f of readdirSync("content/people")) {
  for (const m of read(`content/people/${f}`).matchAll(/^  name: (\S+)/gm)) {
    const list = cardNames.get(m[1]) ?? [];
    list.push(f.replace(".yaml", ""));
    cardNames.set(m[1], list);
  }
}
const out: string[] = [];
for (const list of ["R03", "R05", "R06"]) {
  const doneHere = new Set(r07.filter((r) => r.from === list || (list === "R06" && r.name === "李建波")).map((r) => r.name));
  const left = rows(`research/falls-list/${list}.yaml`).filter((r) => !r.done && !doneHere.has(r.name));
  out.push(`## ${list}: ${left.length} undone`);
  for (const r of left) {
    const cards = cardNames.get(r.name);
    out.push(`${r.date}\t${r.name}\t${r.post}\t${cards ? "CARD:" + cards.join("/") : ""}`);
  }
}
writeFileSync(".probe/R07-left.txt", out.join("\n") + "\n", "utf8");
console.log(out.filter((l) => l.startsWith("##")).join("\n"));
