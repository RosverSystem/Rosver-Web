# CLAUDE.md — RosverSac (Claude Code)

Instrucciones de proyecto para Claude Code. **Deben coincidir** con `AGENTS.md` y las reglas de Cursor (`.cursor/rules/`).  
Detalle: `playbook-como-trabajamos.md` y `docs/`.

## Producto (leer antes de UI o lógica)

- Catálogo web de **importaciones** + **gestión** (admin/comercial) + área **cliente**.
- Stack: React 19 + TypeScript + Vite + Tailwind v4 + Motion + React Router — detalle en `docs/architecture/04-stack-y-librerias.md`.
- **Fase actual:** visual primero (mocks); lógica después.
- Fuente de verdad: `docs/architecture/02-producto-rosver-sac.md` y `03-vistas-y-flujos.md`.

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
| Reglas Claude | `.claude/rules/` |
| Skills Claude | `.claude/skills/` |
| Espejo Cursor | `.cursor/rules/`, `.cursor/skills/`, `AGENTS.md` |

**Alias:** `@` → `RosverSac/src`  
**Ejemplo:** `import { AuthPage } from '@/features/auth'`

## Capas

- `app/` — shell, providers, routing
- `features/<nombre>/` — módulo de producto (`index.ts` = único export público)
- `shared/` — UI/hooks/lib sin negocio de una sola feature
- `styles/` — CSS global

## Flujo obligatorio

1. **Feature nueva** → skill `create-feature` (`.claude/skills/create-feature/SKILL.md`) antes de codear.
2. **Módulo ERP / API** → skill `fullstack-erp-structure` + UX `erp-systemrsv-saas-ux`.
3. **Al cerrar cualquier tarea** → skill `document-change` → `docs/changes/NNNN-slug.md`.
4. Feature nueva → ficha en `docs/features/` + fila en índice.
5. Docs en **español**, concretas.
6. Si cambia un flujo o regla de negocio → actualizar `02` / `03` en architecture.
7. Dejar contexto escrito para Cursor (y viceversa): el avance vive en `docs/`, no solo en el chat.

## Reglas clave

- No importar internos de otra feature; solo `@/features/<nombre>`.
- `shared/` no importa `features/`.
- Una feature por archivo; no mezclar dominios.
- Secretos en `.env` (gitignored); nunca commitear credenciales.
- En fase visual: no API real; datos mock alineados al dominio documentado.
- **Responsive obligatorio:** móvil, tablet y desktop en toda UI/animación/sección (ver `.claude/rules/03-responsive-ui.md`).
- **Rendimiento obligatorio:** página rápida — imágenes ligeras, animaciones acotadas, sin libs de más (ver `.claude/rules/06-performance.md`).
- **Assets / logos:** WebP-AVIF o SVG; tamaños reales; lazy below-fold; banners geométricos en CSS/SVG (ver `.claude/rules/08-assets-optimizacion.md`).
- **Optimización:** permitido usar skills/libs de optimización si mejoran carga y se documentan en `04-stack-y-librerias.md`.
- **Iconos UI nuevos:** solo `cssvg-icons` ([icon.cssvg.com](https://icon.cssvg.com)) — ver `.claude/rules/07-icons-cssvg.md`.
- **Paleta oficial:** solo tokens Rosver (`docs/architecture/06-paleta-colores.md`, `.claude/rules/09-paleta-colores.md`).
- **Formularios / validación:** toasts flotantes (`FloatingToasts` + `useFormToasts`); nunca bubbles nativos ni errores inline que alarguen el form (`.claude/rules/10-form-toasts.md`).
- **ERP selects / copy:** `AdminSelect` + lenguaje cotidiano; sin jerga ni textos de ayuda técnicos (`.claude/rules/14-erp-selects-copy.md`).
- **Despliegues / versiones:** documentar en `08` + `docs/changes/`. **Todo cambio cerrado → push GitHub `main` + deploy Railway** (`.claude/rules/11-despliegues-versiones.md`). Infra: Railway (web + Postgres), Cloudflare R2 (media).
- **Base de datos continua:** si el cambio requiere persistencia → migración `RosverSac/server/sql/NNN_*.sql` en el mismo trabajo (`.claude/rules/15-database-migraciones.md`).
- **CRUD completo:** al tocar una tabla/módulo de datos → Create + Read + Update + Delete (o soft-delete) en API y admin; vincular a la tienda si es público (`.claude/rules/16-crud-completo.md`).
- **Pendientes / recomendaciones:** actualizar `docs/pendientes/` al cerrar o dejar trabajo a medias (`.claude/rules/12-pendientes-recomendaciones.md`).

## Paridad con Cursor

- Mismas convenciones que `.cursor/rules/` y `AGENTS.md`.
- Al terminar, documentar para que el agente de Cursor retome sin re-explicar.

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
- Cambios recientes: `docs/changes/` (leer el último `NNNN` antes de seguir)
