---
type: Reference
title: PWA y offline
description: Service worker, estrategia de caché y política de actualización.
tags: [pwa, offline, cache]
status: stable
generated: { by: agent/opencode, at: 2026-09-14T00:00:00Z }
sources:
  - id: sw
    resource: ../../service-worker.js
    title: service-worker.js
  - id: state
    resource: ../../js/state.js
    title: js/state.js
---

# PWA y offline

- `CACHE ritmo-v40` en `service-worker.js:1` (bump en cada release); añadir a `ASSETS` cualquier fichero cacheable nuevo [^sw].
- `ASSETS` en `service-worker.js:3`: 5 js (`app/constants/utils/state/render`) + `rutina.json` + resto (`index.html`, `styles.css`, `offline.html`, md, manifest, icon.svg, icon-192.png, icon-512.png) + 5 cues de audio `./assets/{Tension,Pausa,Distension,Descanso,Preparacion}.m4a` (precacheados, cache-first) [^sw].
- `rutina_entrenamiento_bandas.md` network-first y `rutina.json` network-first (luego cacheados) en `service-worker.js:17-26`; resto cache-first en `service-worker.js:29` con fallback solo-navegación a `offline.html` [^sw].
- Botón Actualizar fuerza `initialise({ forceRoutineSync: true })` en `js/state.js:169,204` [^state].
- `knowledge/` NO va a `ASSETS` (docs de agentes, no de la app).
- Desarrollo local: `python3 -m http.server 4173`; prod-like: `docker compose up --build` (→ :8080).
