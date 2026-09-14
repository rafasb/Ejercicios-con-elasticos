---
type: Agent Memory
title: Decisiones activas
description: Memoria persistente entre sesiones de agente (decisiones, pitfalls, pendientes).
tags: [memoria, agentes]
status: stable
generated: { by: agent/opencode, at: 2026-09-14T00:00:00Z }
---

# Decisiones activas

Memoria viva del arnés de agentes. Actualizar al cierre de cada sesión con trabajo relevante.

## Vigentes

- El bundle OKF vive en `knowledge/` (raíz del repo). Ver [arquitectura](/project/arquitectura.md).
- `knowledge/` es solo para agentes/humanos: nunca añadirlo a `ASSETS` del service worker. Ver [PWA y offline](/project/pwa-offline.md).

## Pitfalls aprendidos

- Los edits a seeds por `name` se sobrescriben en cada `initialise()` — documentar aquí si se toca el sync. Ver [formato de la rutina](/project/rutina-formato.md).

## Pendientes (draft — grill 2026-09-14, detalle en [mejoras](/project/mejoras.md))

- [P0] Backup v3 con customs + restore v2/v3 + aviso UI.
- [P0] Seeds `seed-*` inmutables + clon `user-*` (`parentSeedId`) + prefijo/badge visible; sync por `id`.
- [P0] Marcar candidato local a canon (sin servidor).
- [P0] Guardia `localStorage` corrupto + fuente rutina JSON generada desde md + validación.
- [P1] PWA offline completo (`js/*` en `ASSETS`) + `applyPreset` no rígido + avisos UX.
- Toolchain mínima: tests Node built-in + linter externo (`package.json` solo dev).
