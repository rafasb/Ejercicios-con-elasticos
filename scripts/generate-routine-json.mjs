import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRoutine } from "../js/utils.js";
import { MUSCLE_TAGS } from "../js/constants.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(root, "rutina_entrenamiento_bandas.md"), "utf8");
const exercises = parseRoutine(md);

if (exercises.length !== 18) throw new Error(`Se esperaban 18 ejercicios y hay ${exercises.length}: revisa ## DÍA 1-3.`);
const days = [...new Set(exercises.map((e) => e.day))].sort();
if (days.join(",") !== "DÍA 1,DÍA 2,DÍA 3") throw new Error(`Faltan días (${days.join(", ") || "ninguno"}): añade ## DÍA 1, ## DÍA 2 y ## DÍA 3.`);
const bad = exercises.filter((e) => !e.tags?.length || e.tags.some((t) => !MUSCLE_TAGS.includes(t)));
if (bad.length) throw new Error(`Etiquetas no válidas en: ${bad.map((e) => e.name).join(", ")}.`);

writeFileSync(join(root, "rutina.json"), `${JSON.stringify(exercises, null, 2)}\n`);
console.log(`rutina.json generado con ${exercises.length} ejercicios.`);
