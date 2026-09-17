---
type: Reference
title: Plan de mejoras M1-M8 (orden de ejecución)
description: Planificación trasladada desde mejoras para próximas sesiones, con orden y resumen M1-M8.
status: draft
generated: { by: agent/opencode, at: 2026-09-15T08:00:00Z }
sources:
  - id: state
    resource: ../../js/state.js
    title: js/state.js (backup, initialise, applyPreset)
  - id: utils
    resource: ../../js/utils.js
    title: js/utils.js (parseRoutine, normaliseTags)
  - id: sw
    resource: ../../service-worker.js
    title: service-worker.js (ASSETS, CACHE)
---

# Plan de mejoras M1-M8

Detalle en [mejoras](/project/mejoras.md). Contexto en [arquitectura](/project/arquitectura.md) y [decisiones](/memory/decisiones.md).

## Orden sugerido

1. M1 + M2 + M3 (datos: backup v3, clon user-*, candidato local).
2. M4 + M4b (arranque seguro + JSON generado + tests parser).
3. M8 (toolchain mínima que sostiene lo anterior).
4. M5 + M6 + M7 (PWA completo, presets, avisos UX).

## Resumen M1-M8

- **M1** backup v3 con customs incluidos, acepta v2 avisando.[^state]
- **M2** seeds inmutables; edición = clon `user-*` con `parentSeedId`.[^state]
- **M3** marcar candidato local a canon, sin servidor.
- **M4** guardia `localStorage` corrupto con reset seguro.[^state]
- **M4b** rutina en JSON generado desde md + validación.[^utils]
- **M5** PWA offline completo: `ASSETS` + `CACHE`.[^sw]
- **M6** `applyPreset` flexible 3-7 días + compatibilidad v2/v3.[^state]
- **M7** flujo clonar-editar + avisos honestos en español.
- **M8** tests Node built-in + linter externo solo dev.

[^state]: Ver sources `state`.
[^utils]: Ver sources `utils`.
[^sw]: Ver sources `sw`.
