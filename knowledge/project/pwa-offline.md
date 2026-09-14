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
---

# PWA y offline

- `CACHE` (`ritmo-vNN` en `service-worker.js`): bump en cada release; añadir a `ASSETS` cualquier fichero cacheable nuevo.
- `rutina_*.md` es network-first (luego cacheada); resto cache-first.
- Botón Actualizar fuerza `initialise({ forceRoutineSync: true })`.
- `knowledge/` NO va a `ASSETS` (docs de agentes, no de la app).
- Desarrollo local: `python3 -m http.server 4173`; prod-like: `docker compose up --build` (→ :8080).
