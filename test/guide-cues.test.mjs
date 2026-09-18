import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { GUIDE_CUE_FALLBACK_HZ, GUIDE_CUE_FILES, GUIDE_CUE_PREPARATION } from "../js/constants.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("guide cue files cover the five phase cues", () => {
  assert.deepEqual(Object.keys(GUIDE_CUE_FILES).sort(), ["Descanso", "Distension", "Pausa", "Preparacion", "Tension"]);
});

test("every guide cue file exists on disk", () => {
  for (const [cue, relativePath] of Object.entries(GUIDE_CUE_FILES)) {
    assert.ok(existsSync(join(repoRoot, relativePath)), `missing cue file for ${cue}: ${relativePath}`);
  }
});

test("guide fallback frequencies keep the original oscillator values", () => {
  assert.deepEqual(GUIDE_CUE_FALLBACK_HZ, { Tension: 660, Pausa: 523, Distension: 392, Descanso: 294, Preparacion: 523 });
});

test("preparation cue resolves in both files and fallback maps", () => {
  assert.ok(GUIDE_CUE_PREPARATION in GUIDE_CUE_FILES, "GUIDE_CUE_PREPARATION missing from GUIDE_CUE_FILES");
  assert.ok(GUIDE_CUE_PREPARATION in GUIDE_CUE_FALLBACK_HZ, "GUIDE_CUE_PREPARATION missing from GUIDE_CUE_FALLBACK_HZ");
});
