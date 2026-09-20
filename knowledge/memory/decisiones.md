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
- Preview de volumen (2026-09-18): el slider de "Ajustar guía" reproduce el cue `Preparacion` al volumen elegido con debounce de 180 ms (`previewGuideVolume()`), para preescuchar sin cambiar el contrato de guardado (el volumen se persiste igual en el `submit`). Ver [módulos JS](/code/modulos-js.md).
- Toolchain check (2026-09-20): `npm run check` = `node scripts/check-syntax.mjs` (recorre todos los `js/*.js`; acepta rutas por argumento). Pitfall: `node --check a b` solo valida `a`; no volver a usar el glob directo. `lint` = Biome, `test` = `node --test`.
- Historial (2026-09-20): conservar todas las sesiones finalizadas, varias del mismo `day` incluidas, con tope configurable `MAX_HISTORY = 30` en `js/constants.js:7`. El tope se aplica solo en `save()` (`js/state.js:23-30`, las más recientes por fecha), de modo que `finish`, `initialise` y `restoreBackup` quedan acotados; no añadir recortes en `app.js`/`render.js`. Ver [módulos JS](/code/modulos-js.md).
- Historial/backup seguro (2026-09-20): saneado en los límites de entrada sin rechazar backups v2/v3. `save()` llama a `normaliseHistory()` (`js/utils.js:191-214`): coerciona tipos (`sets` número, strings, `day` solo `^DÍA [1-7]$` → `""`, `guide` numérico con `GUIDE_FIELDS`/`seconds()`). `normalisePlans()` (`js/state.js:41-51`) en `initialise`/`restoreBackup` descarta items no-objeto y fuerza `guide` a objeto. `normaliseExercise()` tolera `technical` no-string y re-normaliza `videos` (`js/utils.js:181-188`); `markdownList`/`listForStorage`/`listForForm`/`videosForStorage` coercionan `String(value ?? "")`. `reuse` (`js/app.js:424-437`) exige `configuredDays().includes(session.day)` antes de mutar; `finish` captura la sesión creada. Escape en salida de todo escalar de historial/plans, incluido `exercise.id` en `data-*`. No endurecer `isValidBackup` (compatibilidad). Ver [módulos JS](/code/modulos-js.md).

## Pitfalls aprendidos

- No usar Docker/offline como gate de cada parche: `npm run check` existe y cubre la sintaxis JS; Docker y offline se reservan para PWA, arranque y entregas.
- `pkill -f "http.server 4173"` se automata (coincide con la propia shell) y cuelga la llamada: usar `pkill -f "http[.]server 4173"` o PID (`echo $!` + `kill <pid>`), con arranque y parada en llamadas separadas. Regla fijada en `.opencode/agents/verificador.md:27-29`.
- Sync ya no es por `name` sino por `id` (`js/state.js:211`): antes `Object.assign` por nombre sobrescribía edits del usuario; ahora `seed-*` es inmutable y solo el clon `user-*` es editable. Ver [formato de la rutina](/project/rutina-formato.md).
- Scroll-snap con sticky: `scroll-padding-top` (contenedor) y `scroll-margin-top` (objetivo) **se suman**, no se solapan; declarar ambos duplica el offset y el sticky tapa la tarjeta. Una sola fuente de offset = altura del sticky + `top` + hueco (`styles.css:64-68,102-107`). Ver [módulos JS](/code/modulos-js.md).
- Fondo bajo sticky: un `background` translúcido (`rgba(...)`) deja ver el contenido al quedar el elemento fijo; componer el tinte a color sólido sobre `--paper` antes de hacerlo sticky (caso `.tag-summary` → `#f6edd7`, `styles.css:57-58`). Ver [módulos JS](/code/modulos-js.md).
- Cascada sticky: no declarar `position` no-sticky en una regla de mayor especificidad que `.sticky-action` (p. ej. `.primary-button.sticky-action`, `styles.css:103`): anula el `position: sticky` de `styles.css:102` y el CTA deja de quedar fijado. Para anclar hijos absolutos no hace falta `position: relative`; `position: sticky` ya establece containing block. Ver [módulos JS](/code/modulos-js.md).
- Progreso de Entrenar (`state.workout` efímero) solo se recalcula al re-renderizar: `start-guide` muta `completedSets` sin `renderApp()`, punto único de refresco el evento `close` de `#guide-dialog` en `js/app.js:405`. No añadir render por fase de guía. Ver [módulos JS](/code/modulos-js.md).
- `playCueBuffer()` es `async` (espera `loadCue()`) y `runGuidePhase()`/`previewGuideVolume()` no lo esperan: hay que revalidar `isActive()` tras cada `await` (`js/app.js:96-110`) o un cue tardío sonaría con la guía ya cancelada o el diálogo cerrado. Ver [módulos JS](/code/modulos-js.md).
- XSS/DoS por historial/backup (corregido 2026-09-20): no bastaba con escapar `session.day`; el vector real llegaba a Entrenar/Plan por `entry.sets/reps/guide` y `state.activeDay` vía `reuse`. Regla: cualquier escalar de historial o de `plans` restaurado debe pasar por `escapeHtml` en `render.js` y coercionarse en `normaliseHistory`/`normalisePlans`/`normaliseExercise`/`normaliseGuide`. No reabrir sumideros sin escape ni asumir shapes de backup. Ver [módulos JS](/code/modulos-js.md).
- Recursión síncrona en la guía (corregido 2026-09-20): `runGuidePhase` con duración 0 llamaba a `next()` en línea y `runTensionCycle` se re-invocaba síncronamente; con fases 0 y `cycles` alto desborda la pila (`RangeError`; 800 OK, 999 revienta). El tope `MAX_GUIDE_CYCLES=999` NO basta: hay que **diferir** la reentrada con `queueMicrotask` + guard `if (state.guideState)` (`js/app.js:134-138`). `seconds()` acota a `MAX_GUIDE_SECONDS=3600` para no colgar timers con duraciones enormes de backup.

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
- [ ] [sugerido 2026-09-18] `test/guide-cues.test.mjs` solo comprueba que `GUIDE_CUE_PREPARATION` existe en `GUIDE_CUE_FILES`/`GUIDE_CUE_FALLBACK_HZ`; ampliar la aserción a **todas** las claves de `GUIDE_CUE_FILES` (cada cue debe tener fallback en `GUIDE_CUE_FALLBACK_HZ`) para que un cue nuevo sin frecuencia de fallback falle en test. Ver [módulos JS](/code/modulos-js.md).
- [x] [hecho 2026-09-20] `npm run check` ya no usa `node --check js/*.js` (que solo valida el primer argumento) sino `scripts/check-syntax.mjs`, que recorre todos los `js/*.js` con `spawnSync(process.execPath, ["--check", file])` y sale != 0 si alguno falla; check positivo 5/5 y negativo con `/tmp` (exit 1) verificados.
- [x] [hecho 2026-09-20] XSS almacenado por backup en la cadena historial → `reuse` → Plan/Entrenar: `normaliseHistory()` + `save()` (`js/utils.js:186-209`, `js/state.js:23-30`), guard de día en `reuse` (`js/app.js:425-428`) y `escapeHtml` en historial, `guideInputs`, `activeDay` e `item.sets/reps/resistance`. `revisor` APRUEBA + `verificador` APTO. Ver [módulos JS](/code/modulos-js.md).
- [x] [hecho 2026-09-20] XSS por `exercise.id` en atributos `data-*` (escape en `js/render.js:31,64` y `js/app.js:194`) y crash/DoS por `exerciseId` inexistente (fila "Ejercicio no disponible" en `renderPlan`, `flatMap` en `finish`) y por backups malformados (`normalisePlans`, guards de lista y `technical`/`videos`). `revisor` APRUEBA + `verificador` APTO (fuzz de backups). Ver [módulos JS](/code/modulos-js.md).
- [x] [hecho 2026-09-20] Residuales de guía/catálogo cerrados: `normaliseGuide()` (`js/state.js:41-51`) coerciona `guide` (numéricos con `seconds`, `volume` clamp [0,1]) en `initialise`/`restoreBackup`; `normalisePlans` coerciona la guía de cada item; `initialise` filtra `state.data.exercises` a array de objetos (`js/state.js:227-229`); `add-plan` guarda catálogo vacío; `playCue` clampa volumen; el submit de "Ajustar guía" usa `seconds()` + clamp. `revisor` APRUEBA + `verificador` APTO (fuzz A1–A4/B1–B3).
