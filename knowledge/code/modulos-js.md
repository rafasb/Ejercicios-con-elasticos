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
---

# Módulos JS

- `app.js`: todo el wiring (click/input/change, swipe, diálogos, guía con `AudioContext`, SW). No duplicar listeners.
- `state.js`: único escritor de `localStorage`; llamar a `save()` tras mutar `state.data`.
- `render.js`: sin mutación; usa `escapeHtml` / `formatInline` (`**bold**` solo) para todo input de usuario.
- `utils.js`: `listForStorage` (guarda `- item`), `videosForStorage` (solo líneas `http(s)://`), `seconds()` (clamp ≥ 0).
- UI en español (strings ES, código/comentarios EN ok). No presentar ejercicios como consejo médico (aviso en `README.md`).
