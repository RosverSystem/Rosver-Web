# Documentación de cambios

Ninguna tarea se considera cerrada sin registro en `docs/changes/`.

## Procedimiento

1. Copiar `docs/templates/cambio.md` → `docs/changes/NNNN-slug.md`.
2. `NNNN` = siguiente entero de 4 dígitos (ej. `0002`).
3. `slug` = kebab-case descriptivo.
4. Completar: qué cambió, por qué, cómo, archivos, cómo verificar.

## Cuándo actualizar más docs

| Situación | Actualizar |
| --- | --- |
| Feature nueva o cambio de alcance | `docs/features/<nombre>.md` + índice |
| Cambio de arquitectura o convención | `docs/architecture/` |

Usar skill **document-change** al cerrar implementaciones.

Estilo: español, hechos concretos, checklist de verificación ejecutable.

Este registro es el **puente de contexto** entre Claude Code y Cursor.
