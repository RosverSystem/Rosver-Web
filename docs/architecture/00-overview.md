# Arquitectura — visión general

## Producto

**Rosver Sac** — catálogo web de importaciones + sistema de gestión (admin/comercial) + área cliente.

Detalle: [`02-producto-rosver-sac.md`](./02-producto-rosver-sac.md)  
Vistas y flujos: [`03-vistas-y-flujos.md`](./03-vistas-y-flujos.md)  
Estructura de información y captación: [`05-estructura-informacion-y-captacion.md`](./05-estructura-informacion-y-captacion.md)

## Stack

Detalle de librerías y uso: [`04-stack-y-librerias.md`](./04-stack-y-librerias.md)

- **UI:** React 19 + TypeScript + Vite (`RosverSac/`)
- **Estilos:** Tailwind CSS v4 + tokens Rosver en `src/styles/global.css`
- **Animación:** Motion (`motion/react`) — p. ej. navbar resizable
- **Rutas:** React Router DOM v7
- **Utilidades:** `clsx` + `tailwind-merge` → `cn()` en `@/shared/lib`
- **Alias:** `@` → `RosverSac/src`

## Capas de `src/`

```
src/
  app/        → shell: App, providers, routing
  features/   → módulos de producto (UI + model + api + lib)
  shared/     → UI/hooks/lib reutilizables sin negocio de una feature
  styles/     → CSS global
```

## Reglas de dependencia

```
app/        → features (API pública) + shared
features/A  → shared + código propio
features/A  ✗ no importa internos de features/B
shared/     ✗ no importa features
```

## Fases

1. **Visual** — pantallas con mock; sin backend real.
2. **Lógica** — auth, API, reglas documentadas en `02` y `03`.

**UI:** siempre móvil + tablet + desktop (regla responsive).  
**Rendimiento:** página rápida (regla `06-performance` en Cursor y Claude Code).

## Agentes

Cursor (`AGENTS.md`, `.cursor/`) y Claude Code (`CLAUDE.md`, `.claude/`) comparten reglas; el avance se documenta en `docs/changes/`.

## Documentación

- Cambios cerrados → `docs/changes/`
- Fichas de feature → `docs/features/`
- Convención de módulos → `01-modulos-feature.md`

## Comandos

```bash
cd RosverSac
npm run dev      # desarrollo (:5173 por defecto)
npm run build    # producción
npm run lint     # oxlint
```
