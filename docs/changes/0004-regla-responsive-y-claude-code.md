# 0004 — Regla responsive + contexto Claude Code

**Fecha:** 2026-08-27  
**Tipo:** docs

## Qué cambió

- Regla Cursor `03-responsive-ui`: toda UI/animación/sección debe diseñarse para móvil, tablet y desktop.
- Regla Cursor `04-agent-parity`: Cursor y Claude Code comparten reglas y documentan el avance en `docs/`.
- `CLAUDE.md` + `.claude/rules/` + `.claude/skills/` espejando las mismas reglas/skills que Cursor.
- Actualización de `AGENTS.md`, skills `document-change` / `create-feature`, plantilla `cambio.md`.

## Por qué

1. Evitar diseños solo-desktop en el catálogo Rosver Sac.  
2. Que Claude Code trabaje con el mismo playbook y deje contexto escrito para Cursor (y al revés).

## Cómo

- Documentación y reglas; sin cambio de código de producto en este registro.
- Fuente de verdad compartida: `docs/changes/` como puente entre agentes.

## Archivos

- `.cursor/rules/03-responsive-ui.mdc`
- `.cursor/rules/04-agent-parity.mdc`
- `.cursor/rules/00-workspace-core.mdc`
- `.cursor/rules/02-documentation.mdc`
- `.cursor/skills/*/SKILL.md`
- `CLAUDE.md`
- `.claude/rules/*`
- `.claude/skills/*/SKILL.md`
- `AGENTS.md`
- `docs/templates/cambio.md`

## Cómo verificar

- [ ] Existe `CLAUDE.md` alineado con `AGENTS.md`
- [ ] `.claude/rules/` incluye responsive + documentation + parity
- [ ] `.cursor/rules/03-responsive-ui.mdc` está en alwaysApply
- [ ] Plantilla de cambio pide checks móvil/tablet/desktop
