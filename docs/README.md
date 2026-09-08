# RosverSac — documentación

Documentación de producto. El código vive en `RosverSac/`; aquí va el **qué**, **por qué** y **cómo verificar**.

## Empezar por aquí (producto)

1. [`architecture/02-producto-rosver-sac.md`](./architecture/02-producto-rosver-sac.md) — qué es, audiencias, entidades, reglas.
2. [`architecture/03-vistas-y-flujos.md`](./architecture/03-vistas-y-flujos.md) — rutas, flujos F1–F8, orden visual.
3. [`architecture/04-stack-y-librerias.md`](./architecture/04-stack-y-librerias.md) — librerías, Tailwind, Motion, convenciones.
4. [`architecture/05-estructura-informacion-y-captacion.md`](./architecture/05-estructura-informacion-y-captacion.md) — cómo organizar contenido y CTAs para captar clientes fácil.
5. [`architecture/06-banners-hero-y-assets.md`](./architecture/06-banners-hero-y-assets.md) — medidas Canva del banner hero (móvil/tablet/desktop) y assets de marcas.
6. [`architecture/07-categorias-imagen-erp.md`](./architecture/07-categorias-imagen-erp.md) — categorías con imagen + contrato para ERP.
7. [`features/README.md`](./features/README.md) — índice de módulos.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `architecture/` | Arquitectura, producto, vistas/flujos |
| `features/` | Ficha por módulo de producto + índice |
| `changes/` | Un archivo por cada cambio cerrado |
| `templates/` | Plantillas obligatorias |

## Flujo al cerrar una tarea

1. Implementar en `RosverSac/src/`.
2. Copiar `templates/cambio.md` → `changes/NNNN-slug.md`.
3. Si hay feature nueva o cambio de alcance → actualizar `features/`.
4. Si cambió la forma de trabajar o flujos → actualizar `architecture/`.

## Skills del agente

- **create-feature** — nueva feature (`.cursor/skills/` y `.claude/skills/`)
- **document-change** — registrar cambio (mismo en Cursor y Claude Code)

## Agentes

| Agente | Entrada |
| --- | --- |
| Cursor | `AGENTS.md` + `.cursor/rules/` |
| Claude Code | `CLAUDE.md` + `.claude/rules/` |

Misma obligación: `docs/changes/` al cerrar; UI siempre responsive (móvil / tablet / PC); **página rápida** (regla rendimiento).

Ver también `AGENTS.md` / `CLAUDE.md` en la raíz del repo.
