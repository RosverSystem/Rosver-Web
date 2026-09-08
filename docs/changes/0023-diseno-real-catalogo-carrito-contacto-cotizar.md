# Cambio: Diseño real (sin wireframe) en catálogo, producto, carrito, contacto y cotizar

**Fecha:** 2026-09-04
**Tipo:** fix

## Qué cambió

Se eliminó `WireBlock`/`WireImage` de las páginas públicas restantes que aún lo usaban, siguiendo la misma línea de `0021` (Home):

- `FiltersPanel.tsx`: sidebar de categorías real (tarjeta blanca, ítem activo resaltado), botón "Filtrar" para móvil con ícono `SlidersHorizontal` (lucide-react). Se quitaron las líneas `WireLine` que insinuaban filtros futuros inexistentes.
- `ProductPage.tsx`: galería con nuevo componente compartido `shared/ui/product-image-placeholder.tsx` (gradiente + ícono, mismo lenguaje visual que `ProductCard`), info del producto y CTA doble (Añadir al carrito / Cotizar por WhatsApp) sin cajas punteadas.
- `CartPage.tsx`: ítems con el mismo placeholder de imagen, tarjetas reales para resumen y acciones; estado vacío con ícono `ShoppingCart` (lucide-react).
- `ContactPage.tsx` y `QuoteRequestPage.tsx`: formularios ya eran reales, solo se reemplazó el contenedor `WireBlock` por una tarjeta blanca con borde.
- `ProductCard.tsx` se refactorizó para usar el mismo `ProductImagePlaceholder` compartido (antes tenía el `IconBag` inline duplicado).

## Por qué

El usuario pidió explícitamente dejar de trabajar "como si fuera un wireframe" y usar datos mockeados pero con la apariencia de una página ya desplegada. `FiltersPanel` ya había quedado marcado como pendiente al cerrar `0021`; esta tarea lo resuelve junto con el resto de páginas públicas que todavía mostraban bordes punteados y etiquetas de debug.

**Fuera de alcance de este cambio** (no tocado): las 22 pantallas de `admin/`, `account/` (área cliente logueada) y `auth/` siguen en wireframe. Son áreas internas de gestión, no la "primera impresión del cliente" en la que se ha enfocado el trabajo de esta sesión; se dejan para una pasada aparte cuando el usuario lo pida.

## Cómo

- Reutilización de patrones ya validados en `0021` (tarjetas `border-rosver-line`, `rounded-2xl`, `bg-rosver-soft` para paneles secundarios) para mantener consistencia visual entre Home y el resto del sitio.
- Nuevo primitivo `ProductImagePlaceholder` en `shared/ui/` para no duplicar el gradiente + ícono en 3 lugares (`ProductCard`, `ProductPage`, `CartPage`).

## Archivos

- `RosverSac/src/features/catalog/ui/FiltersPanel.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/shared/ui/product-image-placeholder.tsx` (nuevo)
- `RosverSac/src/features/cart/ui/CartPage.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] `/catalogo`, `/producto/:slug`, `/carrito`, `/contacto`, `/cotizar` revisados en navegador: sin bordes punteados ni labels de debug, sin errores de consola en carga limpia.
- [x] _(UI)_ Verificado en viewport reducido (~529px) sin overflow horizontal.
- [ ] Pendiente (fuera de este cambio): mismo tratamiento para `admin/`, `account/` y `auth/`.
