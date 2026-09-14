# AGENTS.md — Ritmo

Static PWA, no build / no bundler / no package.json / no tests / no linter. Vanilla HTML + CSS + ES modules.

## Run

- Local (preferred for dev): `python3 -m http.server 4173` → http://localhost:4173
- Docker (prod-like, nginx): `docker compose up --build` → http://localhost:8080 ; `docker compose down` to stop
- No test command exists. Verify manually: load app, check console, exercise catalog loads (18 seeds), switch Train/Plan/History/Exercises, test offline reload.

## Structure

- Entry: `index.html` → `js/app.js` (module, all event wiring + guide timer + SW registration).
- `js/constants.js` — `STORAGE_KEY`, `MUSCLE_TAGS`, guide defaults, day limits. Edit vocabulary here.
- `js/state.js` — `localStorage` (`ritmo-data-v1`), `initialise()`, plans, backup/restore, `applyPreset()`.
- `js/render.js` — view renderers only (no state mutation).
- `js/utils.js` — `parseRoutine()`, `normaliseTags()`, `guideForExercise()`, HTML helpers.
- `rutina_entrenamiento_bandas.md` — seed data source of truth, fetched + parsed at runtime. `service-worker.js`, `manifest.webmanifest`, `icon.svg`, `styles.css`.
- `knowledge/` — OKF v0.2 bundle (agent memory + project/code docs). Spec: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md

## Gotchas

- `parseRoutine()` depends on exact markdown shape: `## DÍA N`, then `### N. Name (Muscle)`, `*summary*`, and `#### Ejecución paso a paso / Detalles técnicos (2-col table) / Hashtags / Errores comunes a evitar / Vídeos`. Keep headings exact; `#### Hashtags` (not `Hastags`).
- `MUSCLE_TAGS` is a closed vocabulary (9 tags). `normaliseTags()` strips `#`, is case/accent-insensitive, dedupes, drops unknowns. Store without `#`. UI displays with `#`.
- Seed exercises have `id: seed-N` and sync by `name` on every `initialise()` (custom edits to a seed name/description get overwritten by the md). Custom exercises use `crypto.randomUUID()` and are **excluded** from backup (`downloadBackup` saves only `days/plans/history/guide`, version 2).
- Days are strings `DÍA 1..N`, `MIN_DAYS=3`, `MAX_DAYS=7`. Reducing days deletes those plans but keeps history. `applyPreset()` only works with exactly 18 `DÍA 1-3` routine exercises; supports 3- and 6-day presets.
- PWA cache: bump `CACHE` (`ritmo-vNN`) in `service-worker.js` on every release, and add any new cacheable file to `ASSETS`. `rutina_*.md` is network-first (then cached); everything else is cache-first. Update button forces `initialise({ forceRoutineSync: true })`.
- All user input is rendered via `escapeHtml` / `formatInline` (`**bold**` only). Keep using them for new fields. Videos only accept `http(s)://` lines (`videosForStorage`).
- UI language is Spanish; keep UI strings Spanish, code/comments English ok. Do not present exercise content as medical advice (see health warning in `README.md`).

## Knowledge (OKF v0.2 in `knowledge/`)

- Session start: read `knowledge/index.md`, then open only the linked concepts needed (progressive disclosure). Session end (or on significant change): update/create the touched concept(s) + prepend entry to `knowledge/log.md` under `## YYYY-MM-DD` (newest first).
- Every concept (any `.md` except `index.md`/`log.md`) needs frontmatter with non-empty `type`. Minimal template:
  `---\ntype: Reference | Guide | Agent Memory\ntitle: ...\ndescription: ...\nstatus: draft | stable | deprecated\ngenerated: { by: agent/opencode, at: <ISO-8601-UTC> }\n---`
- Types used here: `Agent Memory` (`memory/` — decisions, pitfalls, pending work between sessions), `Reference` (`project/`, `code/` — durable repo truth). Links between concepts: absolute bundle-relative (`/project/arquitectura.md`) preferred. `sources[].resource` points to repo files (`../../js/state.js`) or URLs; per-claim cites use `[^id]` footnotes keyed to `sources[].id`.
- Trust/freshness: default unverified (no `verified` key). Agents never set `human:` — only a human adds `verified: { by: human:<id>, at: ... }` (→ human-reviewed). Set `stale_after: <ISO-8601-UTC>` when content expires; `status: deprecated` keeps history without deleting.
- Do not add `knowledge/` to `service-worker.js` `ASSETS` (agent docs, not app runtime).
