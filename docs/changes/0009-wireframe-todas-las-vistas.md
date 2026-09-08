# 0009 — Wireframe de todas las vistas en código

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

Se completó el wireframe de baja fidelidad (patrón `WireBlock`/`WireImage`/`WireLine` de `shared/ui/wireframe.tsx`, iniciado en `0007` para `catalog`) para **todas** las rutas documentadas en `docs/architecture/03-vistas-y-flujos.md`. La app corre de punta a punta con datos mock y sin diseño final — eso se trabaja después.

Features nuevas:

| Feature | Rutas | Notas |
| --- | --- | --- |
| `cart` | `/carrito` | Cantidad editable, quitar ítem, camino dual Cotizar/Pedir. `AddToCartButton` ahora usado por `catalog/ProductPage`. |
| `contact` | `/contacto` | Formulario con estado éxito + atajo WhatsApp (`wa.me`). |
| `quotes` | `/cotizar`, `/cuenta/cotizaciones`, `/admin/cotizaciones` | Form público, listado cliente y bandeja admin comparten `QUOTES`/`QUOTE_STATUS_TONE`. |
| `auth` | `/login`, `/registro` | Formularios UI, sin sesión real. |
| `account` | `/cuenta`, `/cuenta/pedidos`, `/cuenta/pedidos/:id`, `/cuenta/perfil` | `AccountLayout` con tabs (`/cuenta/cotizaciones` se sirve desde `quotes`, montada por `app/App.tsx`). |
| `admin-catalog` | `/admin/productos`, `/admin/productos/nuevo`, `/admin/productos/:id`, `/admin/categorias` | Formulario de producto compartido entre alta y edición. |
| `admin-content` | `/admin/contenido` | Edición mock de hero, banda CTA y datos de empresa. |
| `admin-leads` | `/admin/leads` | Listado + detalle en dos paneles. |
| `admin-orders` | `/admin/pedidos` | Tabla con badges de estado. |
| `admin-users` | `/admin/usuarios` | Tabla + select de rol. |

Chrome nuevo (capa `app/`, no feature):

- `app/layout/AdminShell.tsx` — sidebar por sección (desktop) + tabs horizontales (móvil) + topbar con usuario/salir + `Outlet`.
- `app/pages/AdminDashboardPage.tsx` — accesos rápidos (leads/cotizaciones/pedidos pendientes, productos publicados).
- `shared/ui/badge.tsx` — `Badge` genérico de estado (tonos neutral/info/success/warning/danger), usado por `quotes`, `account` y los `admin-*`.

`app/App.tsx` se reescribió: cada zona pública usa un `PublicLayout` (navbar + footer) compartido; `/cuenta/*` anida bajo `AccountLayout`; `/admin/*` anida bajo `AdminShell`. Ya no quedan `StubPage` — todas las rutas de `03-vistas-y-flujos.md` tienen una vista real (aunque de baja fidelidad).

## Por qué

Se pidió ver el wireframe de **todas** las vistas del producto codificado y navegable, no solo Home/Listado/Ficha. El diseño final sigue pendiente a propósito; el objetivo de este cambio es validar estructura, rutas y navegación entre las tres caras del producto (pública, cliente, gestión) antes de invertir en visual definitivo.

## Cómo

- Todas las páginas nuevas reutilizan `shared/ui/wireframe.tsx` (`WireBlock`/`WireImage`/`WireLine`) y el nuevo `shared/ui/badge.tsx` — reemplazar diseño más adelante implica tocar estos primitivos, no cada página.
- Datos mock: cada feature con estado propio tiene su `model/mocks.ts` (`cart`, `quotes`, `account`, `admin-leads`, `admin-orders`, `admin-users`). `admin-catalog` reutiliza `PRODUCTS`/`CATEGORIES` de `catalog` (misma fuente que el catálogo público) en vez de duplicarlos.
- `catalog` exporta ahora `PRODUCTS`/`Product` además de `CATEGORIES`/`Category` (antes solo categorías) porque `cart` y `admin-catalog` los necesitan vía la API pública de la feature.
- Sin auth real ni guardas de ruta: `/cuenta/*` y `/admin/*` son de acceso directo por ahora (regla de fase visual — `02-producto-rosver-sac.md` §"Qué NO hacer").
- Responsive en las tres pantallas: grids con breakpoints Tailwind, `AdminShell` con sidebar en desktop y tabs scrollables en móvil, `AccountLayout` con tabs scrollables, tablas de admin con `overflow-x-auto` para no forzar scroll horizontal de la página.

## Archivos

- `RosverSac/src/features/cart/**`
- `RosverSac/src/features/contact/**`
- `RosverSac/src/features/quotes/**`
- `RosverSac/src/features/auth/**`
- `RosverSac/src/features/account/**`
- `RosverSac/src/features/admin-catalog/**`
- `RosverSac/src/features/admin-content/**`
- `RosverSac/src/features/admin-leads/**`
- `RosverSac/src/features/admin-orders/**`
- `RosverSac/src/features/admin-users/**`
- `RosverSac/src/features/catalog/index.ts` (export `PRODUCTS`/`Product`)
- `RosverSac/src/features/catalog/ui/ProductPage.tsx` (usa `AddToCartButton` real)
- `RosverSac/src/shared/ui/badge.tsx`
- `RosverSac/src/app/layout/AdminShell.tsx`
- `RosverSac/src/app/pages/AdminDashboardPage.tsx`
- `RosverSac/src/app/App.tsx`
- `docs/features/*.md` (estado + verificación de las 10 features tocadas)
- `docs/features/README.md`

## Cómo verificar

- [x] `npm run lint` sin errores
- [x] `npm run build` sin errores
- [x] Navegadas todas las rutas de `03-vistas-y-flujos.md`: `/`, `/catalogo/herramientas`, `/producto/taladro-percutor-20v`, `/carrito`, `/contacto`, `/cotizar`, `/registro`, `/cuenta/pedidos`, `/cuenta/cotizaciones`, `/admin`, `/admin/productos`, `/admin/productos/nuevo`, `/admin/categorias`, `/admin/contenido`, `/admin/leads`, `/admin/cotizaciones`, `/admin/usuarios` — sin errores de consola, contenido correcto
- [ ] _(UI)_ **Móvil**: `AdminShell` muestra tabs horizontales en vez de sidebar; `AccountLayout` tabs con scroll horizontal propio
- [ ] _(UI)_ **Tablet/Desktop**: `AdminShell` muestra sidebar fija; grids y tablas no fuerzan scroll horizontal de la página completa
