---
type: Reference
title: Arquitectura y modelo de datos
description: Entrypoints, estado en localStorage, días, backup y presets de Ritmo.
tags: [arquitectura, estado]
status: stable
generated: { by: agent/opencode, at: 2026-09-14T00:00:00Z }
sources:
  - id: readme
    resource: ../../README.md
    title: README de Ritmo
  - id: state
    resource: ../../js/state.js
    title: js/state.js
---

# Arquitectura y modelo de datos

- Entrada: `index.html` → `js/app.js` (módulo; wiring de eventos, timer de guía, registro del SW).
- `js/constants.js`: `STORAGE_KEY`, `MUSCLE_TAGS`, defaults de guía, límites de días.
- `js/state.js`: `localStorage` (`ritmo-data-v1`), `initialise()`, planes, backup/restore, `applyPreset()`.
- `js/render.js`: solo render (sin mutar estado). `js/utils.js`: `parseRoutine()`, `normaliseTags()`, helpers HTML.
- Días: strings `DÍA 1..N` (`MIN_DAYS=3`, `MAX_DAYS=7`). Reducir días borra esos planes, conserva historial.
- Backup v2 (`downloadBackup`): solo `days/plans/history/guide`; excluye ejercicios custom (`crypto.randomUUID()`).
- Seeds: `id: seed-N`, sync por `name` en cada `initialise()` — edits custom a un seed se pierden.
- `applyPreset()` exige exactamente 18 ejercicios `DÍA 1-3`; soporta presets de 3 y 6 días.
- Detalle relacionado: [formato de la rutina](/project/rutina-formato.md), [módulos JS](/code/modulos-js.md).
