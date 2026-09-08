# 0012 — Regla de rendimiento (página rápida)

**Fecha:** 2026-08-27  
**Tipo:** docs

## Qué cambió

- Nueva regla `06-performance` en Cursor (`.cursor/rules/06-performance.mdc`) y Claude Code (`.claude/rules/06-performance.md`).
- Mencionada en `AGENTS.md`, `CLAUDE.md`, `00-overview.md` y sección en `04-stack-y-librerias.md`.
- Plantilla `cambio.md`: check de percepción de carga / assets livianos.

## Por qué

Optimización explícita para ambos agentes: el catálogo debe ser rápido (móvil incluido), no solo visualmente correcto.

## Cómo

Reglas always-on alineadas (paridad agentes). Criterios: imágenes, JS, animaciones Motion/GSAP, fuentes, anti-patrones de peso.

## Archivos

- `.cursor/rules/06-performance.mdc`
- `.claude/rules/06-performance.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/architecture/00-overview.md`
- `docs/architecture/04-stack-y-librerias.md`
- `docs/templates/cambio.md`

## Cómo verificar

- [ ] Existe la regla en `.cursor/rules/` y `.claude/rules/`
- [ ] `AGENTS.md` y `CLAUDE.md` citan rendimiento obligatorio
- [ ] `04-stack-y-librerias.md` tiene sección Rendimiento
