import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsDir = join(root, "js");
const args = process.argv.slice(2);
const files = (args.length ? args : readdirSync(jsDir).filter((name) => name.endsWith(".js")).map((name) => join(jsDir, name))).sort();

let failed = 0;
for (const file of files) {
  const { status } = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (status !== 0) failed += 1;
}

if (failed) {
  console.error(`Sintaxis no válida en ${failed} de ${files.length} archivos.`);
  process.exit(1);
}
console.log(`Sintaxis válida en ${files.length} archivos.`);
