# 0005 — Documentar stack y librerías

**Fecha:** 2026-08-27  
**Tipo:** docs

## Qué cambió

- Nueva ficha `docs/architecture/04-stack-y-librerias.md` con dependencias, uso, Tailwind/Motion, patrones UI propios y cómo añadir libs.
- Punteros en `AGENTS.md`, `CLAUDE.md`, `docs/README.md`, `00-overview.md`.
- Reglas espejo Cursor/Claude: `05-stack-librerias`.

## Por qué

Que Cursor y Claude Code conozcan las librerías oficiales del proyecto y no inventen stack paralelo.

## Cómo

Solo documentación; versiones canónicas siguen en `RosverSac/package.json`.

## Archivos

- `docs/architecture/04-stack-y-librerias.md`
- `docs/architecture/00-overview.md`
- `docs/README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/05-stack-librerias.mdc`
- `.claude/rules/05-stack-librerias.md`

## Cómo verificar

- [ ] Abrir `04-stack-y-librerias.md` y ver tabla de deps alineada con `package.json`
- [ ] `CLAUDE.md` y `AGENTS.md` enlazan al doc de stack
- [ ] Regla `05-stack-librerias` existe en `.cursor/rules/` y `.claude/rules/`
