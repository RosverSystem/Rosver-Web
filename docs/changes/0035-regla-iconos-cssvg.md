# 0035 — Regla iconos cssvg-icons + dependencia

**Fecha:** 2026-09-07  
**Tipo:** docs | chore

## Qué cambió

- Paquete `cssvg-icons` en `RosverSac` ([icon.cssvg.com](https://icon.cssvg.com)).
- Regla obligatoria `07-icons-cssvg` en Cursor y Claude Code: UI nueva usa cssvg, no Lucide.
- Actualizados `04-stack-y-librerias.md`, `AGENTS.md`, `CLAUDE.md`, regla `05-stack-librerias`.

## Por qué

Unificar iconos animados del catálogo con la librería elegida por el equipo.

## Cómo

- Preferir `hoverToAnimate` + reduced-motion.
- Excepciones: marca/redes/dominio en `shared/ui/icons.tsx`; Lucide solo legado.

## Archivos

- `RosverSac/package.json` / lockfile
- `.cursor/rules/07-icons-cssvg.mdc`
- `.claude/rules/07-icons-cssvg.md`
- `docs/architecture/04-stack-y-librerias.md`
- `AGENTS.md`, `CLAUDE.md`

## Cómo verificar

- [ ] `npm ls cssvg-icons` en `RosverSac`
- [ ] Existe la regla en `.cursor/rules/` y `.claude/rules/`
- [ ] Stack doc lista cssvg como iconos UI
