# Cambio: Corazón favorito con estado visual claro

**Fecha:** 2026-09-14  
**Tipo:** fix  
**Versión:** 0.1.67

## Qué cambió

- Corazón favorito: outline negro → **relleno rojo sólido** al agregar; vuelve a outline al quitar.
- Feedback inmediato (optimistic + pop) al tocar.
- API `/api/favorites/ids` también envía `slugs` para marcar el estado aunque el card use slug.

## Por qué

El icono cssvg Heart solo tiene trazo (`fill="none"`); el cambio de color era casi invisible y a veces el estado no coincidía.

## Cómo

Path del corazón controlado con `fill`/`stroke`; store cruza id UUID y slug.

## Archivos

- `RosverSac/src/features/favorites/ui/FavoriteButton.tsx`
- `RosverSac/src/features/favorites/model/favorites-store.tsx`
- `RosverSac/server/src/lib/product-favorites.ts`
- `RosverSac/server/src/routes/favorites.ts`

## Cómo verificar

- [ ] Login → tocar corazón: se rellena rojo al instante
- [ ] Volver a tocar: vuelve a outline
- [ ] Recargar página: favoritos siguen rellenos
- [ ] Móvil / tablet / desktop
