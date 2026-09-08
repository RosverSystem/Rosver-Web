# Cambio: Vista Ofertas (/ofertas)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Nueva ruta `/ofertas` con `OffersPage` (feature `catalog`).
- Helper `getOfferProducts` / `isOfferProduct`: productos con `originalPrice` > `price`.
- Banner Memphis rojo “Ofertas activas”; grilla + paginación + scroll al cambiar página.
- Navbar: link Ofertas → `/ofertas` (antes iba a `/catalogo`).

## Por qué

El ítem “Ofertas” del menú no tenía vista propia; ahora lista solo promociones.

## Cómo

Misma feature `catalog` (mismo dominio de productos). Reutiliza `ProductGrid` y `CatalogPagination`. Sin feature nueva.

## Archivos

- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `RosverSac/src/features/catalog/model/offers.ts`
- `RosverSac/src/features/catalog/index.ts`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/features/catalog.md`
- `docs/changes/0057-vista-ofertas.md`

## Cómo verificar

- [ ] Menú **Ofertas** abre `/ofertas` y queda activo
- [ ] Solo productos con badge de descuento / precio tachado
- [ ] Banner “Ofertas activas” + “Hasta X% OFF”
- [ ] Link “Ver catálogo completo”
- [ ] Móvil / tablet / desktop OK
- [ ] Sin scroll horizontal
