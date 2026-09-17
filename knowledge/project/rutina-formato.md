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
  - id: script
    resource: ../../scripts/generate-routine-json.mjs
    title: Generador rutina.json
  - id: json
    resource: ../../rutina.json
    title: rutina.json generado
---

# Formato de la rutina seed

`rutina_entrenamiento_bandas.md` es la fuente legible; `rutina.json` (18 ejercicios) es lo que consume la app en JSON-first [^json].

## Contrato (`parseRoutine`)

- `## DÍA N`, luego por ejercicio `### N. Nombre (Músculo)`, línea `*resumen*`, y secciones `#### Ejecución paso a paso / Detalles técnicos (tabla 2 col) / Hashtags / Errores comunes a evitar / Vídeos`.
- Mantener headings exactos; `#### Hashtags` (nunca `Hastags` o el ejercicio pierde sus tags).
- `MUSCLE_TAGS` (9, en `js/constants.js`) es vocabulario cerrado; `normaliseTags()` quita `#`, insensible a caso/acentos, dedupes, descarta desconocidos. Se almacena sin `#`.
- Generador `scripts/generate-routine-json.mjs:9-18`: parsea el md con `parseRoutine()`, exige 18 ejercicios y días 1-3, valida tags y escribe `rutina.json` [^script].
- `validateRoutineData()` en `js/utils.js:157-175` exige 18 ejercicios, días `DÍA 1-3` y tags solo de `MUSCLE_TAGS` [^utils].
