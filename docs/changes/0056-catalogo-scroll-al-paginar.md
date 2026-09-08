# Cambio: Scroll al inicio del listado al paginar catálogo

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Al cambiar de página en `CatalogPagination`, la vista hace scroll suave a `#catalogo-resultados` (inicio de productos / toolbar).

## Archivos

- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `docs/changes/0056-catalogo-scroll-al-paginar.md`

## Cómo verificar

- [ ] En `/catalogo`, bajar a la paginación, ir a página 2 → vuelve arriba del listado (no del hero)
- [ ] Flechas anterior/siguiente igual
- [ ] Móvil / tablet / desktop OK
