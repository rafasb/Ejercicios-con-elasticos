---
type: Reference
title: Mejoras propuestas (backlog para próximas sesiones)
description: Backlog priorizado de robustez + UX mínima, acordado por grill el 2026-09-14. Base para planificar próximas sesiones.
tags: [mejoras, backlog, planificacion]
status: draft
generated: { by: agent/opencode, at: 2026-09-14T12:00:00Z }
sources:
  - id: state
    resource: ../../js/state.js
    title: js/state.js (backup v2, initialise, applyPreset)
  - id: utils
    resource: ../../js/utils.js
    title: js/utils.js (parseRoutine, normaliseTags)
  - id: sw
    resource: ../../service-worker.js
    title: service-worker.js (ASSETS, CACHE)
  - id: espec
    resource: ../../Especificaciones iniciales.md
    title: Especificaciones iniciales
---

# Mejoras propuestas (backlog para próximas sesiones)

Acordado por grill el 2026-09-14. Objetivo: **robustez primero**, ámbito **ambos** (deuda crítica + UX mínima ligada), toolchain mínima abierta sin romper runtime vanilla (sin build/bundler en la app). Ver [arquitectura](/project/arquitectura.md), [formato de la rutina](/project/rutina-formato.md), [PWA y offline](/project/pwa-offline.md), [módulos JS](/code/modulos-js.md) y [decisiones activas](/memory/decisiones.md).

## Decisiones cerradas en el grill

- Backup que excluye customs = **defecto crítico** → corregir con **backup v3 compatible** (acepta v2 y v3).
- Seeds **inmutables** (`seed-*`); edición = **clon `user-*` con `parentSeedId`**; sync por `id`, nunca por `name`. Opciones 1 y 3 complementarias: clon + **prefijo/badge visible de origen** en UI.
- Flujo "proponer para canon" = **marcar candidato local** (sin servidor); export JSON queda como posible paso posterior, no en este backlog.
- Rutina → **JSON generado desde el md** (script); md queda legacy; parser endurecido con validación + tests.
- Toolchain: **tests con Node built-in (sin dependencias)** + **linter externo aceptado** (`package.json` solo dev, runtime sigue vanilla).
- PWA offline incompleto = **P1** (después de backup + modelo de datos).

## P0 — Datos y robustez

### M1. Backup v3 con ejercicios personalizados (crítico)
- **Problema:** `downloadBackup` (v2) solo guarda `days/plans/history/guide`; los customs (`crypto.randomUUID()`) se pierden al restaurar en otro dispositivo. `restoreBackup` no los espera.[^state]
- **Propuesta:** backup `version: 3` con `exercises` customs incluidos; `restoreBackup` acepta v2 (avisa "sin customs") y v3; UI explica qué incluye cada backup.
- **Aceptación:** crear custom → backup → restaurar en perfil limpio → custom + plan + historial intactos; restaurar un v2 viejo no rompe y avisa.

### M2. Seeds inmutables + clon `user-*` + prefijo visible
- **Problema:** `initialise()` hace sync por `name` y `Object.assign` sobre el seed: cualquier edición del usuario a un seed se sobrescribe en cada arranque.[^state]
- **Propuesta:** `seed-*` inmutable desde la fuente; botón "Personalizar/Clonar" crea `user-<uuid>` con `parentSeedId`; el sync solo toca `seed-*` por `id`; badge/prefijo visible de origen (`APP` vs `MIS EJERCICIOS`); filtro y resumen muscular incluyen ambos sin regresión.
- **Aceptación:** editar un seed crea/clona user-*; tras `forceRoutineSync` el seed se actualiza y el clon del usuario queda intacto; origen distinguible en catálogo y plan.

### M3. Marcar candidato local a canon
- **Propuesta (alcance cerrado):** flag `candidateForCanon: true` en `user-*`, filtro "candidatos" en Ejercicios; sin envío a servidor. Export JSON de propuesta = fuera de este backlog.
- **Aceptación:** marcar/desmarcar persiste en `localStorage` y sobrevive al sync; backup v3 lo incluye.

### M4. Guardia `localStorage` corrupto
- **Problema:** `initialise()` hace `JSON.parse(stored)` sin `try`: un dato corrupto rompe el arranque.
- **Propuesta:** `try/catch`, conservar copia corrupta (`ritmo-data-corrupt-<fecha>`), reset seguro + mensaje ES, y no perder seeds (re-seed desde fuente).
- **Aceptación:** con dato corrupto la app arranca, avisa y conserva la copia para diagnóstico.

### M4b. Fuente rutina en JSON generado desde md + validación
- **Problema:** `parseRoutine()` depende de headings exactos, orden de secciones y regex frágiles (`Hashtags`, `Errores...` hasta fin, `Vídeos`).[^utils]
- **Propuesta:** script (Node built-in) que convierte `rutina_entrenamiento_bandas.md` → `rutina.json` validado (18 ejercicios, días 1-3, tags del vocabulario); la app consume el JSON; el md queda legacy legible; error de fuente visible en consola/UI en vez de silencio (`catch {}` actual).
- **Aceptación:** fuente inválida falla con mensaje accionable; el JSON generado pasa tests.

## P1 — PWA, presets y compatibilidad

### M5. PWA offline completo (P1, después de P0)
- **Problema:** `ASSETS` solo lista `./js/app.js`, no sus imports (`constants.js`, `utils.js`, `state.js`, `render.js`); cache-first offline puede romper la app.[^sw]
- **Propuesta:** añadir todos los `js/*` cacheables a `ASSETS`, bump `CACHE`, test offline real (primera carga → avión → reload + entrenar).
- **Aceptación:** app usable offline tras primera visita, incluyendo catálogo y plan.

### M6. Relajar `applyPreset` + compatibilidad backup v2/v3
- **Problema:** `applyPreset()` exige exactamente 18 ejercicios `DÍA 1-3` y solo 3/6 días; `sixDayGroups` es búsqueda costosa y opaca; con customs o días 4-7 el preset falla en silencio (`return false`).
- **Propuesta:** presets que no exijan 18 exactos, soporten 3-7 días o error ES explicable; `isValidBackup` cubre v2 y v3.
- **Aceptación:** presets funcionan con catálogo extendido; fallo siempre con mensaje, nunca silencioso.

## UX mínima ligada (no features nuevas sueltas)

### M7. Flujo clonar-editar + avisos honestos
- Clonar desde detalle del seed, badge de origen, pre-carga de tags al editar, guardar normalizado.
- Avisos ES: qué incluye el backup, que los seeds no se editan directamente, qué pasa al reducir días.
- Sin consejo médico nuevo; mantener aviso `README.md`.

## Toolchain mínima (sin cambiar runtime)

### M8. Tests Node built-in + linter externo
- Tests sin dependencias para `parseRoutine`, `normaliseTags`, `isValidBackup`/migración v2→v3, guardia corruptos.
- Linter externo mínimo (acepta `package.json` dev); runtime sigue sin build/bundler; verificación manual actual se conserva como checklist.

#### Riesgos del linter externo y mitigaciones (acordado 2026-09-14)
- **R1. Rompe el invariante "cero toolchain".** Hoy no hay `package.json` y `AGENTS.md` lo prohíbe. *Mitigación:* `package.json` + lock solo dev; actualizar `AGENTS.md`, `README.md` y este backlog dejando por escrito que el runtime sigue vanilla sin build/bundler.
- **R2. Fuga a producción vía Docker.** `Dockerfile` hace `COPY .` y no hay `.dockerignore`: `node_modules` y configs dev acabarían servidos por nginx. *Mitigación obligatoria:* crear `.dockerignore` (`node_modules`, cachés npm, configs solo-dev si aplica) y no añadir nada dev a `ASSETS` del service worker.
- **R3. Fricción dev y supply-chain.** Exige Node/npm, `npm install`, pin de versiones y mantenimiento de la config. *Mitigación:* una sola herramienta (Biome preferente, ESLint alternativa), script `npm run lint`, sin hooks obligatorios al inicio; documentar versión Node.
- **Alternativa si se quiere evitar:** quedarse solo con Node built-in (`node --check`, `node --test`); el linter aporta estilo/robustez, no ejecución.

#### Decisión toolchain (acordado 2026-09-14)
- **Linter preferente: Biome** (un binario, linter + formateador, `biome.json` mínimo). **Alternativa: ESLint** (más ecosistema, más config; solo si se necesitan reglas que Biome no cubra).
- **Node fijado: 22 LTS** (verificado `v22.19.0` / npm `11.14.1` en el entorno); reflejarlo en `engines` del futuro `package.json` dev.

## Orden sugerido para próximas sesiones

1. M1 + M2 + M3 (datos: backup v3, clon user-*, candidato local).
2. M4 + M4b (arranque seguro + JSON generado + tests parser).
3. M8 (toolchain mínima que sostiene lo anterior).
4. M5 + M6 + M7 (PWA completo, presets, avisos UX).

## Fuera de alcance explícito

- Sincronización multi-dispositivo / cuentas / servidor.
- Export/envío real de propuestas canon fuera del dispositivo.
- Recomendaciones automáticas de entrenamiento.
- Cambiar runtime a bundler/framework.

[^state]: `js/state.js`: `downloadBackup` (v2 sin customs), `initialise()` sync por `name`, `applyPreset` 18 exactos, `JSON.parse` sin `try`.
[^utils]: `js/utils.js`: `parseRoutine`, `normaliseTags`, `videosForStorage`.
[^sw]: `service-worker.js`: `ASSETS` sin `js/constants.js|utils.js|state.js|render.js`.
