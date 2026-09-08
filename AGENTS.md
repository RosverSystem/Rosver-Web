# AGENTS — RosverSac

Resumen para el agente (Cursor). Detalle en `playbook-como-trabajamos.md` y `docs/`.  
**Paridad:** mismas reglas que Claude Code → `CLAUDE.md` + `.claude/rules/` + `.claude/skills/`.

## Producto (leer antes de UI o lógica)

- Catálogo web de **importaciones** + **gestión** (admin/comercial) + área **cliente**.
- Stack: React 19 + TypeScript + Vite + Tailwind v4 + Motion + React Router — detalle en `docs/architecture/04-stack-y-librerias.md`.
- **Fase actual:** visual primero (mocks); lógica después.
- Fuente de verdad de flujos: `docs/architecture/02-producto-rosver-sac.md` y `03-vistas-y-flujos.md`.

## Comandos

```bash
cd RosverSac
npm run dev      # UI (Vite, :5173)
npm run build
npm run lint
```

## Estructura

| Qué | Dónde |
| --- | --- |
| Código UI | `RosverSac/src/` |
| Documentación | `docs/` |
| Reglas Cursor | `.cursor/rules/` |
| Skills Cursor | `.cursor/skills/` |
| Espejo Claude Code | `CLAUDE.md`, `.claude/rules/`, `.claude/skills/` |

**Alias:** `@` → `RosverSac/src`  
**Ejemplo:** `import { AuthPage } from '@/features/auth'`

## Capas

- `app/` — shell, providers, routing
- `features/<nombre>/` — módulo de producto (`index.ts` = único export público)
- `shared/` — UI/hooks/lib sin negocio de una sola feature
- `styles/` — CSS global

## Flujo obligatorio

1. **Feature nueva** → leer skill `create-feature` antes de codear.
2. **Módulo ERP / API** → skill `fullstack-erp-structure` + UX `erp-systemrsv-saas-ux`.
3. **Al cerrar cualquier tarea** → skill `document-change` → `docs/changes/NNNN-slug.md`.
4. Feature nueva → ficha en `docs/features/` + fila en índice.
5. Docs en **español**, concretas.
6. Si cambia un flujo o regla de negocio → actualizar `02` / `03` en architecture.
7. Escribir docs para que **Claude Code** retome el avance sin el chat.

## Reglas clave

- No importar internos de otra feature; solo `@/features/<nombre>`.
- `shared/` no importa `features/`.
- Una feature por archivo; no mezclar dominios.
- Secretos en `.env` (gitignored); nunca commitear credenciales.
- En fase visual: no API real; datos mock alineados al dominio documentado.
- **Responsive obligatorio:** toda UI/animación/sección pensada para **móvil, tablet y PC** (regla `03-responsive-ui`).
- **Rendimiento obligatorio:** página rápida — imágenes ligeras, animaciones acotadas, sin libs de más (regla `06-performance`).
- **Assets / logos:** WebP-AVIF o SVG; tamaños reales; lazy below-fold; banners geométricos en CSS/SVG (regla `08-assets-optimizacion`).
- **Optimización:** permitido usar skills/libs de optimización si mejoran carga y se documentan en `04-stack-y-librerias.md`.
- **Iconos UI nuevos:** solo `cssvg-icons` ([icon.cssvg.com](https://icon.cssvg.com)) — regla `07-icons-cssvg`.
- **Paleta oficial:** solo tokens Rosver (`06-paleta-colores.md`, regla `09-paleta-colores`).
- **Formularios / validación:** toasts flotantes (`FloatingToasts` + `useFormToasts`); nunca bubbles nativos ni errores inline que alarguen el form (regla `10-form-toasts`).
- **Despliegues / versiones:** documentar en `08` + `docs/changes/`. **Todo cambio cerrado → push GitHub `main` + deploy Railway** (regla `11-despliegues-versiones`). Infra: Railway (web + Postgres), Cloudflare R2 (media).
- **Pendientes / recomendaciones:** actualizar `docs/pendientes/` al cerrar o dejar trabajo a medias (regla `12-pendientes-recomendaciones`).

## Punteros

- Producto: `docs/architecture/02-producto-rosver-sac.md`
- Vistas/flujos: `docs/architecture/03-vistas-y-flujos.md`
- Lógica de flujos: `docs/logica-y-flujos/`
- Pendientes: `docs/pendientes/`
- Stack / librerías: `docs/architecture/04-stack-y-librerias.md`
- Paleta: `docs/architecture/06-paleta-colores.md`
- ERP UX: `docs/architecture/09-erp-systemrsv-ux.md`
- Despliegue / Postgres / R2: `docs/architecture/08-despliegue-y-almacenamiento.md`
- Features: `docs/features/README.md`
- Módulos: `docs/architecture/01-modulos-feature.md`
- Plantillas: `docs/templates/`
- Cambios: `docs/changes/`
