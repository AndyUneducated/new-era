// Check that BD2 manifest URLs and ids are not already registered in other manifests.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "research/manifests";
const urlRe = /url:\s*["']?([^"'\s,}]+)/g;
const idRe = /id:\s*([\w-]+)/g;
const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/^(www|m)\./, "").replace(/\/$/, "");

const bd2 = readFileSync(join(dir, "BD2.yaml"), "utf8");
const mine = [...bd2.matchAll(urlRe)].map((m) => m[1]);
const myIds = [...bd2.matchAll(idRe)].map((m) => m[1]);
const out: string[] = [];
for (const f of readdirSync(dir)) {
  if (f === "BD2.yaml" || !f.endsWith(".yaml")) continue;
  const t = readFileSync(join(dir, f), "utf8");
  const urls = new Set([...t.matchAll(urlRe)].map((m) => norm(m[1])));
  const ids = new Set([...t.matchAll(idRe)].map((m) => m[1]));
  for (const u of mine) if (urls.has(norm(u))) out.push(`URL ${u} also in ${f}`);
  for (const i of myIds) if (ids.has(i)) out.push(`ID ${i} also in ${f}`);
}
out.push(`checked ${mine.length} urls, ${myIds.length} ids`);
writeFileSync(".probe/bd2-dupcheck.txt", out.join("\n") + "\n");
