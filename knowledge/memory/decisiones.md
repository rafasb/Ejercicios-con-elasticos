---
type: Agent Memory
title: Decisiones activas
description: Memoria persistente entre sesiones de agente (decisiones, pitfalls, pendientes).
tags: [memoria, agentes]
status: stable
generated: { by: agent/opencode, at: 2026-09-16T12:00:00Z }
---

# Decisiones activas

Memoria viva del arnés de agentes. Actualizar al cierre de cada sesión con trabajo relevante.

## Vigentes

- Arnés: flujo proporcional desde 2026-09-17. `explorador`, `planificador`, `revisor` y `verificador` se usan por incertidumbre/riesgo, no como cadena fija; cada edición ejecuta primero el check más barato que pueda refutarla. Ver [AGENTS.md](../../AGENTS.md).
- Lint Biome (decisión 2026-09-18, punto 2): config sobre reescritura — relajadas `noMisleadingCharacterClass` (regex `normaliseTag` en `js/utils.js:83`, contrato `MUSCLE_TAGS`), `noAssignInExpressions` (patrón `||=` en `js/app.js`/`js/state.js`) y `noDelete` (contrato backup v3, `delete` en `js/state.js:149-150`); resto (`noForEach`→`for...of`, `useTemplate`, `useOptionalChain`) se corrige mecánico sin cambio semántico. `parseRoutine()` solo admite cambio de forma de iteración (`return`→`continue`), nunca de lógica.
- El bundle OKF vive en `knowledge/` (raíz del repo). Ver [arquitectura](/project/arquitectura.md).
- `knowledge/` es solo para agentes/humanos: nunca añadirlo a `ASSETS` del service worker. Ver [PWA y offline](/project/pwa-offline.md).
- Seeds `seed-*` inmutables por `id` — sync por `id` en `js/state.js:211`; edición = clon `user-*` con `parentSeedId` y `candidateForCanon`. Ver [mejoras](/project/mejoras.md).
- Backup v3 con customs (`exercises` filtrados `!seed-*`) y restore compatible v2/v3 (v2 avisa sin customs). Ver [arquitectura](/project/arquitectura.md).
- Lote 1+2 UI (2026-09-18): paleta evolucionada sobria + gamificación sin migración; racha = días naturales consecutivos con sesión finalizada (hoy solo si finalizada, hueco rompe, vacío sin prefijo); progreso y resumen derivados sin storage nuevo; heatmap descartado y Lote 3 (XP/niveles/insignias) aparcado. Ver [módulos JS](/code/modulos-js.md).
- Cues de audio de la guía (2026-09-18, release `ritmo-v37`): 5 audios m4a en `assets/` (una por fase, incluida `Preparacion`) reproducidos con Web Audio (`decodeAudioData` + `AudioBufferSourceNode` + `GainNode` con `state.data.guide.volume`); fallback al pitido sintetizado si falla el buffer; `service-worker.js:1,3` con `CACHE ritmo-v37` y los 5 `./assets/*.m4a` en `ASSETS`. Ver [módulos JS](/code/modulos-js.md) y [PWA y offline](/project/pwa-offline.md).

## Pitfalls aprendidos

- No usar Docker/offline como gate de cada parche: `npm run check` existe y cubre la sintaxis JS; Docker y offline se reservan para PWA, arranque y entregas.
- `pkill -f "http.server 4173"` se automata (coincide con la propia shell) y cuelga la llamada: usar `pkill -f "http[.]server 4173"` o PID (`echo $!` + `kill <pid>`), con arranque y parada en llamadas separadas. Regla fijada en `.opencode/agents/verificador.md:27-29`.
- Sync ya no es por `name` sino por `id` (`js/state.js:211`): antes `Object.assign` por nombre sobrescribía edits del usuario; ahora `seed-*` es inmutable y solo el clon `user-*` es editable. Ver [formato de la rutina](/project/rutina-formato.md).
- Scroll-snap con sticky: `scroll-padding-top` (contenedor) y `scroll-margin-top` (objetivo) **se suman**, no se solapan; declarar ambos duplica el offset y el sticky tapa la tarjeta. Una sola fuente de offset = altura del sticky + `top` + hueco (`styles.css:64-68,102-107`). Ver [módulos JS](/code/modulos-js.md).
- Progreso de Entrenar (`state.workout` efímero) solo se recalcula al re-renderizar: `start-guide` muta `completedSets` sin `renderApp()`, punto único de refresco el evento `close` de `#guide-dialog` en `js/app.js:405`. No añadir render por fase de guía. Ver [módulos JS](/code/modulos-js.md).
- `playGuideCue()` es `async` (espera `loadCue()`) y `runGuidePhase()` no lo espera: hay que revalidar `state.guideState` tras cada `await` (`js/app.js:95-110`) o un cue tardío sonaría con la guía ya cancelada. Ver [módulos JS](/code/modulos-js.md).

## Pendientes (auditado 2026-09-17 — detalle en [mejoras](/project/mejoras.md) y [plan M1-M8](/project/plan-mejoras.md))

- [x] [P0 hecho 2026-09-16] Backup v3 con customs + restore v2/v3
- [x] [P0 hecho 2026-09-16] Seeds `seed-*` inmutables + clon `user-*` (`parentSeedId`) + sync por `id`
- [x] [P0 hecho 2026-09-16] Candidato local a canon (`candidateForCanon` + filtro)
- [x] [auditado hecho 2026-09-17] R-004 `js/utils.js:125-175` — `parseRoutine`/`validateRoutineData` con errores ES accionables (sin `catch` silencioso). Ver [mejoras](/project/mejoras.md).
- [x] [auditado hecho 2026-09-17] R-005 `js/constants.js:7,9` — `MUSCLE_TAGS` (9) + `MUSCLE_TAG_LABELS` ES. Ver [mejoras](/project/mejoras.md).
- [x] [hecho 2026-09-17] R-006 `js/render.js:27/38` — badges origen + filtro candidatos. Ver [mejoras](/project/mejoras.md) y [plan M1-M8](/project/plan-mejoras.md).
- [x] [hecho 2026-09-17] R-007/R-008 `js/app.js:214/221` + `js/app.js:415/421` + `js/state.js:48` — clonar-editar + candidato. Ver [mejoras](/project/mejoras.md) y [plan M1-M8](/project/plan-mejoras.md).
- [x] [hecho 2026-09-17] R-009/M7 `index.html:35-36` + `styles.css:106` — avisos ES. Ver [mejoras](/project/mejoras.md) y [plan M1-M8](/project/plan-mejoras.md).
- [x] [hecho 2026-09-17] M4 guardia `localStorage` corrupto (`js/state.js:18,169-196` copia `ritmo-data-corrupt-<timestamp>` + `storageWarning` ES + re-seed). Ver [mejoras](/project/mejoras.md).
- [x] [auditado hecho 2026-09-17] M4b fuente rutina JSON generada desde md + validación (`rutina.json:1-10`, `scripts/generate-routine-json.mjs:1-18`, `js/constants.js:3`, `js/state.js:75-83,199,208`).
- [x] [auditado hecho 2026-09-17] M5 PWA offline completo (`service-worker.js:1,3,17-28` `CACHE ritmo-v32` + `ASSETS` `js/*` + network-first json/md).
- [x] [auditado hecho 2026-09-17] M6 `applyPreset` flexible 3-7 días (`js/state.js:86-102` retorno `{ok,message}` ES).
- [x] [hecho 2026-09-17] M8 toolchain — artefactos (`package.json`/`biome.json`/`.dockerignore`) + sync docs `AGENTS.md`/`README.md` (Node 22, `check`/`lint`/`test`, backup v3).
- [x] [hecho 2026-09-17] M7 avisos UX honestos (ver R-009 arriba). Ver [mejoras](/project/mejoras.md) y [plan M1-M8](/project/plan-mejoras.md).
