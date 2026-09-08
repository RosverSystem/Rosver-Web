# 0007 — Wireframe de Home/Listado/Ficha en código

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- Nueva feature `catalog` (`RosverSac/src/features/catalog/`) con las tres pantallas del catálogo funcionando con datos mock y ruteo real:
  - `HomePage` (`/`) — Hero, barra de confianza, categorías destacadas, productos destacados, banda CTA intermedia.
  - `CatalogPage` (`/catalogo`, `/catalogo/:categorySlug`) — breadcrumb, filtros (sidebar en desktop, botón "Filtrar" en móvil vía `lg:hidden`), grid de productos, paginación mock.
  - `ProductPage` (`/producto/:slug`) — galería, info + atributos (SKU, origen, MOQ), precio, doble CTA ("Añadir al carrito" / "Cotizar por WhatsApp") y descripción.
- Mock data en `features/catalog/model/mocks.ts` (`CATEGORIES`, `PRODUCTS`, `TRUST_STATS`).
- Primitivos de wireframe reutilizables en `shared/ui/wireframe.tsx` (`WireBlock`, `WireImage`, `WireLine`): cajas con borde punteado y etiqueta que marcan qué representa cada bloque (CTA primario en rojo, secundario en verde, contenido en gris, chrome en blanco). Se usan en las tres pantallas para poder ver la estructura corriendo en el navegador sin depender de un diseño final.
- `Footer` nuevo en `app/layout/Footer.tsx`, montado junto a `PublicNavbar` en `App.tsx`.
- `App.tsx`: reemplaza el `HomePlaceholder` inline por `HomePage`/`CatalogPage`/`ProductPage` reales; agrega ruta `/cotizar` (stub) porque los nuevos componentes ya enlazan a ella.

## Por qué

El anteproyecto visual (artifact "Anteproyecto Rosver") se aprobó como estructura de referencia; el siguiente paso pedido fue verla "codificada" — es decir, la misma jerarquía de bloques y comportamiento responsive corriendo de verdad en `npm run dev`, no solo en un mockup estático. El diseño final (colores, tipografía, imágenes reales) se define después; por eso los bloques usan el kit de wireframe (`shared/ui/wireframe.tsx`) en vez de estilos definitivos.

## Cómo

- `catalog` sigue la convención de `docs/architecture/01-modulos-feature.md`: `index.ts` exporta solo `HomePage`, `CatalogPage`, `ProductPage`; `ui/` tiene los componentes internos (`Hero`, `TrustBar`, `CategoryGrid`, `ProductCard`, `ProductGrid`, `CtaBand`, `FiltersPanel`) sin exportarse fuera de la feature.
- `WireBlock`/`WireImage`/`WireLine` van en `shared/ui/` (no en `catalog`) porque los usarán también `listado`/`ficha` y, más adelante, otras features en fase visual — al migrar al diseño final basta con reemplazar estos primitivos o dejar de usarlos, sin tocar la estructura de las páginas.
- Filtrado de `CatalogPage` y datos de `ProductPage` resueltos por `slug`/`categorySlug` de React Router sobre el mock — sin API todavía, según la regla de fase visual.
- Responsive: grids con Tailwind (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`), filtros con `lg:hidden` / `hidden lg:block`, layout de ficha `lg:grid-cols-2`.

## Archivos

- `RosverSac/src/features/catalog/index.ts`
- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/ui/Hero.tsx`
- `RosverSac/src/features/catalog/ui/TrustBar.tsx`
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/ProductGrid.tsx`
- `RosverSac/src/features/catalog/ui/CtaBand.tsx`
- `RosverSac/src/features/catalog/ui/FiltersPanel.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/shared/ui/wireframe.tsx`
- `RosverSac/src/app/layout/Footer.tsx`
- `RosverSac/src/app/App.tsx`
- `docs/features/catalog.md`
- `docs/features/README.md`

## Cómo verificar

- [x] `npm run lint` sin errores
- [x] `npm run build` sin errores
- [ ] `cd RosverSac && npm run dev` → http://localhost:5173
- [ ] `/` muestra Hero, confianza, categorías, destacados y banda CTA
- [ ] `/catalogo/herramientas` filtra correctamente y resalta la categoría activa en el sidebar
- [ ] `/producto/taladro-percutor-20v` muestra galería, atributos, precio y doble CTA
- [ ] _(UI)_ **Móvil** (&lt;768px): filtros colapsan a botón "Filtrar", grids en 2 columnas
- [ ] _(UI)_ **Tablet** (768–1023px): grids en 3 columnas
- [ ] _(UI)_ **Desktop** (≥1024px): sidebar de filtros visible, grids en 4 columnas, ficha a dos columnas
