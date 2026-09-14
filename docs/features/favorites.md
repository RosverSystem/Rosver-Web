# Feature: favorites

**Slug:** `features/favorites/`  
**Estado:** activa

## Propósito

Permitir que el cliente autenticado marque productos como favoritos (corazón), verlos en `/cuenta/favoritos` y que el admin vea esos favoritos por cliente en SystemRSV.

## Rutas / UI

| Superficie | Detalle |
| --- | --- |
| Catálogo / ficha / trending | `FavoriteButton` (corazón) |
| Navbar | Link a `/cuenta/favoritos` + badge de cantidad |
| `/cuenta/favoritos` | `AccountFavoritesPage` |
| `/admin/clientes` | Contador «Favs» |
| `/admin/clientes/:id` | Tab Favoritos + lista |

## API

| Método | Ruta | Auth |
| --- | --- | --- |
| `GET` | `/api/favorites` | sesión |
| `GET` | `/api/favorites/ids` | sesión |
| `POST` | `/api/favorites` | sesión |
| `POST` | `/api/favorites/toggle` | sesión |
| `DELETE` | `/api/favorites/:productId` | sesión |

Admin: `favoriteCount` / `favoriteProducts` en listado y detalle de clientes.

## Persistencia

Migración `RosverSac/server/sql/043_product_favorites.sql` → tabla `product_favorites (user_id, product_id)`.

## Export público

| Export | Descripción |
| --- | --- |
| `FavoritesProvider` / `useFavorites` / `useOptionalFavorites` | Store de IDs |
| `FavoriteButton` | Toggle corazón |
| `AccountFavoritesPage` | Vista cliente |

## Verificación

- [ ] Sin sesión: corazón → login con `?next=`
- [ ] Con sesión: toggle guarda/quita; aparece en `/cuenta/favoritos`
- [ ] Admin ve conteo y lista por cliente
- [ ] Móvil / tablet / desktop
