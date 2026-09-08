# Feature: Área cliente

**Slug:** `features/account/`  
**Estado:** activa (wireframe de baja fidelidad; diseño final pendiente)

## Propósito

Espacio del cliente autenticado: resumen, pedidos, cotizaciones, perfil.

## Rutas

`/cuenta`, `/cuenta/pedidos`, `/cuenta/pedidos/:id`, `/cuenta/cotizaciones`, `/cuenta/perfil`.

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `AccountLayout` | layout | Sub-nav (Resumen/Pedidos/Cotizaciones/Perfil) + `Outlet` |
| `AccountOverviewPage` | página | `/cuenta` |
| `AccountOrdersPage` | página | `/cuenta/pedidos` |
| `AccountOrderDetailPage` | página | `/cuenta/pedidos/:id` |
| `AccountProfilePage` | página | `/cuenta/perfil` |

`/cuenta/cotizaciones` usa `ClientQuotesPage` de `quotes` (montada desde `app/App.tsx`, no importada internamente por `account`).

## Verificación

- [x] Layout cuenta con tabs activos por ruta
- [x] Listados mock con estados (badges)
- [ ] Guarda de sesión (fase lógica — hoy la ruta es de acceso directo)
- [ ] Reemplazar `WireBlock` por diseño final
