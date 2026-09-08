# Workspace core (RosverSac)

## Stack

React 19 + TypeScript + Vite en `RosverSac/`. Alias `@` → `RosverSac/src`.

## Producto

Catálogo de importaciones + gestión web. Leer `docs/architecture/02-producto-rosver-sac.md` y `03-vistas-y-flujos.md` antes de implementar pantallas o lógica. Fase actual: **visual con mocks**; lógica después.

**Responsive:** móvil / tablet / desktop (regla `03-responsive-ui`).  
**Paleta:** solo tokens oficiales (regla `09-paleta-colores`, `docs/architecture/06-paleta-colores.md`).  
**Paridad:** mismas reglas que Cursor (`.cursor/`).

## Organización

- Código por **feature** en `src/features/<nombre>/`.
- Export público **solo** desde `index.ts` de cada feature.
- Documentación de producto en `docs/`, nunca solo en comentarios o chat.

## Skills (leer antes de actuar)

| Skill | Cuándo |
| --- | --- |
| `create-feature` | Nueva feature, pantalla o módulo de producto |
| `document-change` | Al cerrar cualquier implementación |

Ubicación: `.claude/skills/<nombre>/SKILL.md` (espejo en `.cursor/skills/`).

## Dependencias entre capas

```
app/        → features (API pública) + shared
features/A  → shared + propio código
features/A  ✗ internos de features/B
shared/     ✗ features
```

## Al terminar una tarea

1. Implementar en `RosverSac/`.
2. Crear `docs/changes/NNNN-slug.md` (plantilla en `docs/templates/cambio.md`).
3. Actualizar `docs/features/` o `docs/architecture/` si aplica (sobre todo flujos en `02`/`03`).
4. Contexto suficiente para que Cursor (u otro agente) continúe sin el chat.

Docs en español, concretas, sin relleno.
