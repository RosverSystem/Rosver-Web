# Paridad de agentes (Claude Code ↔ Cursor)

Este repo lo trabajan **Claude Code** y **Cursor** con las **mismas** reglas.

## Fuente de verdad compartida

| Qué | Dónde |
| --- | --- |
| Resumen Claude Code | `CLAUDE.md` |
| Resumen Cursor | `AGENTS.md` |
| Reglas Claude | `.claude/rules/` |
| Reglas Cursor | `.cursor/rules/` |
| Skills | `.claude/skills/` y `.cursor/skills/` |
| Avance | `docs/changes/`, `docs/features/`, `docs/architecture/` |

## Al cerrar trabajo

1. `docs/changes/NNNN-slug.md` obligatorio.
2. Actualizar features/architecture si aplica.
3. Escribir para que **Cursor** (u otro agente) retome sin el historial del chat.

No dejar decisiones solo en la conversación.
