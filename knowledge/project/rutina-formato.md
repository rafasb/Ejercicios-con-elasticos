---
type: Reference
title: Formato de la rutina seed
description: Contrato exacto entre rutina_entrenamiento_bandas.md y parseRoutine().
tags: [rutina, parser, seeds]
status: stable
generated: { by: agent/opencode, at: 2026-09-14T00:00:00Z }
sources:
  - id: rutina
    resource: ../../rutina_entrenamiento_bandas.md
    title: Rutina seed (fuente de verdad)
  - id: utils
    resource: ../../js/utils.js
    title: parseRoutine() en js/utils.js
---

# Formato de la rutina seed

`rutina_entrenamiento_bandas.md` es la fuente de verdad de los 18 seeds; se fetch + parsea en runtime.

## Contrato (`parseRoutine`)

- `## DÍA N`, luego por ejercicio `### N. Nombre (Músculo)`, línea `*resumen*`, y secciones `#### Ejecución paso a paso / Detalles técnicos (tabla 2 col) / Hashtags / Errores comunes a evitar / Vídeos`.
- Mantener headings exactos; `#### Hashtags` (nunca `Hastags` o el ejercicio pierde sus tags).
- `MUSCLE_TAGS` (9, en `js/constants.js`) es vocabulario cerrado; `normaliseTags()` quita `#`, insensible a caso/acentos, dedupes, descarta desconocidos. Se almacena sin `#`.
