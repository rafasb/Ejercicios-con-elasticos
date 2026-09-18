---
type: Reference
title: Módulos JS
description: Qué vive en cada módulo de js/ y reglas de edición.
tags: [codigo, js]
status: stable
generated: { by: agent/opencode, at: 2026-09-14T00:00:00Z }
sources:
  - id: app
    resource: ../../js/app.js
    title: js/app.js
  - id: render
    resource: ../../js/render.js
    title: js/render.js
  - id: state
    resource: ../../js/state.js
    title: js/state.js
---

# Módulos JS

- `app.js`: todo el wiring (click/input/change, swipe, diálogos, guía con `AudioContext`, SW). No duplicar listeners.
- `state.js`: único escritor de `localStorage`; llamar a `save()` tras mutar `state.data`.
- `render.js`: sin mutación; usa `escapeHtml` / `formatInline` (`**bold**` solo) para todo input de usuario.
- `utils.js`: `listForStorage` (guarda `- item`), `videosForStorage` (solo líneas `http(s)://`), `seconds()` (clamp ≥ 0).
- UI en español (strings ES, código/comentarios EN ok). No presentar ejercicios como consejo médico (aviso en `README.md`).
- Opcional 1 candidata a canon: botón `toggle-candidate` solo `user-*` en `js/render.js:56` [^render]; `render.js` solo render sin mutar, `app.js` solo wiring [^render][^app].
- Guards `js/app.js:214` (clona `seed-*` antes de editar) y `js/app.js:221` (solo `user-*` alterna marca) [^app]; ids `js/app.js:415` (`user-UUID`) y `js/app.js:421` (`parentSeedId`, `candidateForCanon:false`) [^app].
- `toggleCandidateForCanon()` en `js/state.js:48` solo `user-*`, invierte flag, `save()` y devuelve estado [^state]; badge `CANDIDATA` en `js/render.js:29` [^render] y filtro `candidates` en `js/render.js:38` [^render].
- Entrenar solo lectura (decisión 2026-09-18): `renderTrain` en `js/render.js:19,23` sin `<input data-record>`, 2 `<button data-goto-plan="reps|resistance">` con `data-plan-index` que saltan a Plan y enfocan `input[data-plan]` del mismo ejercicio vía `handleGotoPlan()` en `js/app.js:202-218`; fuente única Plan con `save()`, `state.workout` ya no guarda edición.
- Lote 1+2 UI sobria (2026-09-18): tokens `--pine/--clay/--radius-card/--radius-pill/--shadow/--space` en `styles.css:1-14`, header con gradiente + `#header-copy` slot `aria-live` en `index.html:19`, `bottom-nav` pill activo en `styles.css:136-139`, cards en `styles.css:58` y Finalizar sticky `var(--pine)` con `.is-partial/.is-ready` en `styles.css:91`; progreso derivado `done/total` (`completedSets>0` o `rating`) con `role="progressbar"` en `js/render.js:19-27`; racha `currentStreak()` días naturales consecutivos (hoy solo si finalizada) en `js/render.js:107-134` mostrada discreta `Racha N día(s) · <VIEW_COPY>`; resumen `sessionSummaryHtml()`/`findPreviousEntry()` (Hoy/Anterior series/reps/resistencia/valoración, sin previo se oculta) en `js/render.js:97-105` + wiring `finish`/`close-summary` y `<dialog id="summary-dialog">` en `js/app.js:352-359` e `index.html:102-106`; todo derivado sin storage nuevo, `escapeHtml`, ES sin consejo médico. Refresco de progreso en un único punto: listener `close` de `#guide-dialog` en `js/app.js:405` (`renderApp()` tras cerrar guía); no añadir render por fase. Solape sticky/snap resuelto con una sola fuente de offset (`styles.css:64-68,102-107`): nunca declarar a la vez `scroll-padding-top` (contenedor) y `scroll-margin-top` (objetivo), se suman.
- Ver [arquitectura](/project/arquitectura.md) y [decisiones](/memory/decisiones.md).
