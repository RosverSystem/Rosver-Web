# 0013 — Quitar "Categorías" del navbar (duplicaba el catálogo)

**Fecha:** 2026-08-27
**Tipo:** fix

## Qué cambió

- `PublicNavbar.tsx`: eliminado el dropdown "Categorías" del navbar de escritorio y la sección "Categorías" del menú móvil.
- Removidos junto con eso: el componente `CategoriesMenu`, el estado `categoriesOpen`, y los imports que solo usaba esa pieza (`IconChevronDown`, `AnimatePresence`, `motion`, `CATEGORIES`).
- El navbar ahora solo lista `Inicio`, `Catálogo`, `Contacto` + acciones (`Cotizar`, carrito, cuenta).

## Por qué

El usuario notó que "Categorías" en el navbar duplicaba lo que ya se puede ver y filtrar directamente en `/catalogo` (sidebar de filtros + categorías destacadas en Home). Quitar el dropdown reduce un punto de navegación redundante.

## Cómo

- No se tocó `features/catalog` — las categorías reales siguen viviendo ahí y se acceden vía Home (`CategoryGrid`) y el sidebar de `/catalogo` (`FiltersPanel`).
- Verificado que no quedan imports huérfanos tras quitar el componente (`npm run lint` limpio).

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] Verificado en navegador: el navbar de escritorio y el menú móvil ya no muestran "Categorías" (`header.innerText` confirmado sin esa palabra)
- [ ] _(UI)_ Confirmar visualmente en móvil, tablet y desktop que el navbar se ve bien sin el hueco que dejaba el dropdown
