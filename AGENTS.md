# AGENTS.md — Ritmo

PWA estática: HTML, CSS y módulos ES nativos. No hay bundler ni build de producción. Hay toolchain de desarrollo Node 22: `npm run check`, `npm run lint` y `npm test`.

## Run

- Desarrollo local: `python3 -m http.server 4173` → http://localhost:4173.
- Producción similar: `docker compose up --build` → http://localhost:8080.
- Para JS, ejecutar primero `npm run check`; usar `npm run lint` cuando la edición no sea trivial y `npm test` cuando cubra el módulo tocado.
- Abrir la PWA y comprobar consola y flujo afectado. Verificar offline y Docker solo para cambios de PWA, caché, arranque o antes de una entrega.

## Structure

- Entry: `index.html` → `js/app.js` (module, all event wiring + guide timer + SW registration).
- `js/constants.js` — `STORAGE_KEY`, `MUSCLE_TAGS`, guide defaults, day limits. Edit vocabulary here.
- `js/state.js` — único escritor de `localStorage` (`ritmo-data-v1`), `initialise()`, planes, backup/restore y `applyPreset()`.
- `js/render.js` — view renderers only (no state mutation).
- `js/utils.js` — `parseRoutine()`, `normaliseTags()`, `guideForExercise()`, HTML helpers.
- `rutina.json` — fuente seed preferente, generada y validada desde `rutina_entrenamiento_bandas.md`, que queda como fallback legible. `service-worker.js`, `manifest.webmanifest`, `icon.svg`, `styles.css`.
- `knowledge/` — OKF v0.2 bundle (agent memory + project/code docs). Spec: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md

## Gotchas

- `parseRoutine()` depends on exact markdown shape: `## DÍA N`, then `### N. Name (Muscle)`, `*summary*`, and `#### Ejecución paso a paso / Detalles técnicos (2-col table) / Hashtags / Errores comunes a evitar / Vídeos`. Keep headings exact; `#### Hashtags` (not `Hastags`).
- `MUSCLE_TAGS` is a closed vocabulary (9 tags). `normaliseTags()` strips `#`, is case/accent-insensitive, dedupes, drops unknowns. Store without `#`. UI displays with `#`.
- Seeds `seed-*` son inmutables y sincronizan por `id`; al personalizarlos se crea `user-*` con `parentSeedId`. Backup v3 incluye customs y restore acepta v2/v3.
- Días: `DÍA 1..N`, entre 3 y 7. `applyPreset()` reparte el catálogo disponible y devuelve resultado ES.
- PWA cache: bump `CACHE` (`ritmo-vNN`) in `service-worker.js` on every release, and add any new cacheable file to `ASSETS`. `rutina.json` y `rutina_*.md` son network-first (luego cacheados); el resto es cache-first. Update button forces `initialise({ forceRoutineSync: true })`.
- All user input is rendered via `escapeHtml` / `formatInline` (`**bold**` only). Keep using them for new fields. Videos only accept `http(s)://` lines (`videosForStorage`).
- UI language is Spanish; keep UI strings Spanish, code/comments English ok. Do not present exercise content as medical advice (see health warning in `README.md`).

## Agents (OpenCode orchestrated, `.opencode/agents/`)

- Primary (1): `orquestador` (`mode: primary`). Sole distributor. Orchestrates via Task, never codes directly. `permission.task` denies `*`, allows only the 6 subagents below. Never invoke built-ins `build` / `plan` / `general` / `explore`.
- Subagents (6): `planificador` (splits goal into atomics), `explorador` (read-only, returns `file:line` facts), `builder` (executes 1 atomic task in `js/*`, `index.html`, `styles.css`), `revisor` (blocking checklist: `parseRoutine()` contract, `MUSCLE_TAGS`, `escapeHtml`, backup v2, `CACHE`), `verificador` (runtime gate: `python3 -m http.server 4173`, 18 seeds, Train/Plan/History/Exercises, offline reload), `depurador` (escalation-only, root cause + minimal diff, never applies big fix).
- Atomic task = 1 file, 1 change, <50 lines, with `Hacer / No-hacer / Done-check / Depende-de`. `planificador` proposes, `orquestador` validates and re-splits if oversized.
- Escalation: after 2 failed attempts `builder` / `revisor` / `verificador` stop and return tried + log + `file:line`; `orquestador` assigns to `depurador`; `depurador` returns cause + minimal patch + re-verify criteria; `orquestador` re-assigns fix to `builder` as new task.
- Default scope `js/*`, `index.html`, `styles.css` y `knowledge/**` cuando documente un cambio significativo. `service-worker.js` (CACHE bump) y `rutina_*.md` requieren aprobación explícita del usuario. UI Spanish, no medical advice — agents must enforce it.

## Knowledge (OKF v0.2 in `knowledge/`)

- Session start: read `knowledge/index.md`, then open only the linked concepts needed (progressive disclosure). Session end (or on significant change): update/create the touched concept(s) + prepend entry to `knowledge/log.md` under `## YYYY-MM-DD` (newest first).
- Every concept (any `.md` except `index.md`/`log.md`) needs frontmatter with non-empty `type`. Minimal template:
  `---\ntype: Reference | Guide | Agent Memory\ntitle: ...\ndescription: ...\nstatus: draft | stable | deprecated\ngenerated: { by: agent/opencode, at: <ISO-8601-UTC> }\n---`
- Types used here: `Agent Memory` (`memory/` — decisions, pitfalls, pending work between sessions), `Reference` (`project/`, `code/` — durable repo truth). Links between concepts: absolute bundle-relative (`/project/arquitectura.md`) preferred. `sources[].resource` points to repo files (`../../js/state.js`) or URLs; per-claim cites use `[^id]` footnotes keyed to `sources[].id`.
- Trust/freshness: default unverified (no `verified` key). Agents never set `human:` — only a human adds `verified: { by: human:<id>, at: ... }` (→ human-reviewed). Set `stale_after: <ISO-8601-UTC>` when content expires; `status: deprecated` keeps history without deleting.
- Do not add `knowledge/` to `service-worker.js` `ASSETS` (agent docs, not app runtime).
