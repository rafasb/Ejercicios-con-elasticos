# Knowledge Log

## 2026-09-18
* **Release ritmo-v34 (a11y+PWA)**: bump `CACHE` en `service-worker.js:1` + PNGs 192/512 en `ASSETS`; manifest con 3 iconos (SVG+PNG); `#update-app-btn` 48px y `.primary-button` AA 6.03 en `styles.css:26,63`; H2 diálogos con `Cargando…` en `index.html:87,97`; `revisor` APRUEBA + `verificador` PASA (0 errores, 4 vistas, offline Train+Plan). Ver `/project/pwa-offline.md`.

## 2026-09-17
* **Release ritmo-v33**: bump `CACHE` en `service-worker.js:1` (M4 cambiaba `js/state.js` cacheado); `revisor` APRUEBA + `verificador` PASA (online 18 seeds/4 vistas, offline usable, M4 aviso ES). Ver `/project/pwa-offline.md`.
* **M8 docs + auditoría backlog**: `README.md` sync toolchain Node 22 (`check`/`lint`/`test`) + backup v3 con customs; `decisiones.md`/`mejoras.md` alineados con repo (M4b/R-004/R-005/M5/M6 auditados hechos `fichero:línea` vía explorador). Ver `/memory/decisiones.md`.
* **M4 guardia verificada**: `storageWarning` ES + copia `ritmo-data-corrupt-<timestamp>` + re-seed 18 `seed-*` en `js/state.js:18,169-196`; `npm run check` + `revisor` APRUEBA + `verificador` PASA (`http://localhost:4173`). Ver `/project/mejoras.md`.
* **R-004 opcional 1 candidato/badges/filtro**: candidato en `js/render.js:56`, badges/filtro en `js/render.js:29,38` + guards en `js/app.js:214,221` con ids `415,421` y toggle en `js/state.js:48`.
* **R-004 opcional 2 avisos**: avisos en `index.html:35-36` + estilos en `styles.css:106`.
* **Arnés de agentes**: flujo proporcional por riesgo, unidades cohesionadas de hasta dos archivos y validación inmediata; conocimiento durable lo mantiene el orquestador, con memoria para decisiones/pitfalls. Ver `AGENTS.md` y `/memory/decisiones.md`.
* **Cierre OKF**: `pwa-offline` (CACHE v32, ASSETS+json, network-first md+json), `arquitectura` (JSON-first+`routineError`, preset 3-7, backup v3), `rutina-formato` (script+json 18+`validateRoutineData`). Ver `/project/pwa-offline.md`, `/project/arquitectura.md`, `/project/rutina-formato.md`.
* **M5 offline v31/v32**: `CACHE ritmo-v32` en `service-worker.js:1` + aviso versión en UI. Ver `/project/pwa-offline.md`.
* **M6 flexible 3-7**: `applyPreset` en `js/state.js:85-100` reparte catálogo `seed-*`+`user-*` en N grupos, retorno `{ok,message}` ES.
* **M4b JSON-first R-001..R-005**: `ROUTINE_JSON_URL` en `js/constants.js:3`, fetch JSON con fallback md en `js/state.js:76-77,199,223`.
* **R-009 avisos+toasts**: `routineError` ES en `js/state.js:199,223,225`, toast en `js/app.js:465,470`.
* **R-007 clonar + R-008 toggle**: `cloneSeedToUser` en `js/state.js:39`, `toggleCandidateForCanon` en `js/state.js:48`, callers en `js/app.js:215,221-224`. Ver `/project/arquitectura.md`.
* **S-001 estilos**: badges/filtros en `styles.css:34-42,80-82,105`.
* **R-006 badges+filtro**: `originBadges`/`originFilterBar` en `js/render.js:29-30,44`, tag badges en `js/utils.js:97`.
* **R-005 labels ES**: `MUSCLE_TAG_LABELS` en `js/constants.js:9`, filtro en `js/utils.js:101`.
* **R-004 validación+catch**: avisos tags en `js/utils.js:142,169`, catch init en `js/app.js:470`.
* **M4-1 guardia corrupto**: copia `ritmo-data-corrupt-*` + reset + toast en `js/state.js:171-189`. Ver `/project/mejoras.md`.
* **M6 R-007**: `applyPreset` relajado en `js/state.js` (3-7 días, catálogo seeds+user-*, retorno `{ok,message}` ES, sin `sixDayGroups`); pendiente adaptar caller `js/app.js` al nuevo retorno. Ver `/project/arquitectura.md`.

## 2026-09-14
* **M8 decidida**: linter preferente Biome (alternativa ESLint) + Node 22 LTS en `project/mejoras.md`.
* **M8 matizado**: riesgos del linter externo + mitigaciones (`.dockerignore` obligatorio, `package.json` solo dev, alternativa Node-only) en `project/mejoras.md`.
* **Grill mejoras**: sesión grilling (robustez primero, ambos, toolchain abierta, knowledge bundle). Backlog P0/P1 en `project/mejoras.md` (draft): backup v3 con customs, seeds inmutables + clon `user-*` + prefijo visible, candidato local a canon, guardia corrupto, JSON generado desde md, PWA P1, tests Node + linter externo. Pendientes volcados a `memory/decisiones.md`.
* **Creation**: Bundle OKF v0.2 inicial (`knowledge/`): índice, log y 5 conceptos semilla (memoria, arquitectura, rutina, PWA, módulos JS).
