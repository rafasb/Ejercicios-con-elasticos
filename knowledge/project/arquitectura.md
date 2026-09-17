---
type: Reference
title: Arquitectura y modelo de datos
description: Entrypoints, estado en localStorage, días, backup y presets de Ritmo.
tags: [arquitectura, estado]
status: stable
generated: { by: agent/opencode, at: 2026-09-16T00:00:00Z }
sources:
  - id: readme
    resource: ../../README.md
    title: README de Ritmo
  - id: state
    resource: ../../js/state.js
    title: js/state.js
  - id: constants
    resource: ../../js/constants.js
    title: js/constants.js
  - id: utils
    resource: ../../js/utils.js
    title: js/utils.js
---

# Arquitectura y modelo de datos

- Entrada: `index.html` → `js/app.js` (módulo; wiring de eventos, timer de guía, registro del SW).
- `js/constants.js`: `STORAGE_KEY`, `MUSCLE_TAGS`, defaults de guía, límites de días.
- `js/state.js`: `localStorage` (`ritmo-data-v1`), `initialise()`, planes, backup/restore, `applyPreset()`.
- `js/render.js`: solo render (sin mutar estado). `js/utils.js`: `parseRoutine()`, `normaliseTags()`, helpers HTML.
- Días: strings `DÍA 1..N` (`MIN_DAYS=3`, `MAX_DAYS=7` en `js/constants.js:4-5`) [^constants]. Reducir días borra esos planes, conserva historial.
- `initialise()` JSON-first: `ROUTINE_JSON_URL` en `js/constants.js:3` [^constants], `loadRoutineExercises()` fetch JSON + `validateRoutineData()` con fallback a md en `js/state.js:74-82` [^state]; aviso `routineError` ES en `js/state.js:199,223,225` [^state].
- `applyPreset()` 3-7 días: reparte catálogo `seed-*`+`user-*` en round-robin y devuelve `{ok, message}` ES en `js/state.js:85-101` [^state]; historial intacto, seeds inmutables.
- Backup v3 con customs (`!seed-*`) en `js/state.js:103-112` [^state]; `isValidBackup` acepta v2 y v3 en `js/state.js:114-127` [^state]; restore hidrata customs con `normaliseTags`/`videosForStorage` en `js/state.js:129-167` [^state].
- Seeds `seed-N` inmutables, sync por `id` en `js/state.js:210-211` [^state]; edición clona a `user-*` con `parentSeedId` en `js/state.js:39-42` [^state], candidato a canon en `js/state.js:48` [^state].
- Toolchain: `package.json` `type: module` `private` `engines 22.x` scripts `lint`/`check`/`test` devDeps `biome 1.9.4` (+ `biome.json`, `.dockerignore`).
- Detalle relacionado: [formato de la rutina](/project/rutina-formato.md), [módulos JS](/code/modulos-js.md).
