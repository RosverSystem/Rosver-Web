# Cambio: Banner de módulo ERP + Marcas

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Nuevo `AdminModuleBanner` (oscuro + patrón rojo, estilo área cliente) con chips de cantidades.
- `AdminPageHeader` ahora renderiza ese banner (`stats`, `eyebrow`, `description`).
- Marcas: banner con Total / Visibles / En inicio / Ocultas; búsqueda + filtros; iconos editar/borrar; CTA roja sólida sobre fondo oscuro.
- Resto de listados admin con `stats` meaningful y CTAs adaptados al banner oscuro (rojo sólido o `border-white/30 bg-white/10`).
- Cuenta: `AccountOrdersPage` y `ClientQuotesPage` usan `AdminModuleBanner` directo.

## Por qué

Unificar cabeceras admin/cuenta con datos de cantidad visibles de un vistazo, sin pills de conteo duplicadas en `actions`.

## Archivos

- `RosverSac/src/shared/ui/admin-module-banner.tsx`
- `RosverSac/src/shared/ui/admin-field.tsx` (`AdminPageHeader`)
- `RosverSac/src/features/admin-catalog/ui/AdminBrandsPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminCategoriesPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminOffersPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminUnitTypesPage.tsx`
- `RosverSac/src/features/admin-orders/ui/AdminOrdersPage.tsx`
- `RosverSac/src/features/quotes/ui/AdminQuotesPage.tsx`
- `RosverSac/src/features/complaints-book/ui/AdminComplaintsPage.tsx`
- `RosverSac/src/features/admin-users/ui/AdminUsersPage.tsx`
- `RosverSac/src/features/admin-media/ui/AdminStoragePage.tsx`
- `RosverSac/src/features/account/ui/AccountOrdersPage.tsx`
- `RosverSac/src/features/quotes/ui/ClientQuotesPage.tsx`
- `docs/changes/0215-admin-module-banner.md`

## Stats por módulo

| Página | Stats |
| --- | --- |
| Marcas | Total, Visibles, En inicio, Ocultas |
| Productos | Total, Visibles, Ocultos, Destacados |
| Categorías | Total, Raíces, Subcategorías |
| Precios (lista) | Productos |
| Ofertas | Total, Con precio |
| Unidades | Total, Base |
| Pedidos | Total, Pendientes, En envío, Entregados |
| Cotizaciones | Total, Recibidas, En curso, Aceptadas |
| Reclamaciones | Total, Recibidas, En revisión, Respondidas |
| Usuarios | Total, Activos, Inactivos, Verificados |
| Almacenamiento | Archivos, Imágenes, Peso |
| Mis pedidos | Total, En curso, Entregados, Gastado |
| Mis cotizaciones | Total, En curso, Cerradas |

## Cómo verificar

- [ ] `/admin/marcas` muestra banner oscuro con 4 métricas y CTA roja
- [ ] `/admin/productos`, categorías, precios, ofertas, unidades: banner + stats
- [ ] `/admin/pedidos`, cotizaciones, reclamaciones, usuarios, almacenamiento: banner + stats
- [ ] `/cuenta/pedidos` y cotizaciones cliente: banner oscuro
- [ ] Sin pills de conteo redundantes en `actions` (solo CTAs)
- [ ] _(UI)_ Móvil: banner apila título, stats y botones
- [ ] _(UI)_ Tablet / desktop: título + actions en fila; stats abajo
