# Cambio: Permiso explícito para libs/skills de optimización

**Fecha:** 2026-09-07  
**Tipo:** docs

## Qué cambió

- Reglas Cursor/Claude (`05`, `06`, `08`) y `04-stack-y-librerias.md`: se autoriza usar tecnologías, skills y librerías de **optimización** si mejoran carga y se documentan.
- `AGENTS.md` / `CLAUDE.md` actualizados.

## Por qué

El producto pidió libertad para usar tools/libs que ayuden a optimizar, sin abrir la puerta a dependencias “por si acaso”.

## Archivos

- `.cursor/rules/05-stack-librerias.mdc`
- `.cursor/rules/06-performance.mdc`
- `.cursor/rules/08-assets-optimizacion.mdc`
- `.claude/rules/05-stack-librerias.md`
- `.claude/rules/08-assets-optimizacion.md`
- `docs/architecture/04-stack-y-librerias.md`
- `AGENTS.md` / `CLAUDE.md`
- `docs/changes/0054-permiso-libs-optimizacion.md`

## Cómo verificar

- [ ] Agentes leen el permiso en `04` / reglas `05`–`08`
- [ ] Cualquier lib nueva de opt. debe aparecer en `04` + change
