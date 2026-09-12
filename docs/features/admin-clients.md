# Feature: admin-clients (SystemRSV)

**Slug:** `features/admin-clients/`  
**Estado:** activa

## Propósito

Gestionar clientes registrados: ver interés en productos (frecuentes y últimos vistos) y contactarlos para ofrecer ofertas.

## Alcance

- Incluido: listado `/admin/clientes`, detalle `/admin/clientes/:id`, track de vistas con sesión, WhatsApp/email con mensaje de oferta.
- Fuera: CRM completo, campañas masivas, segmentación automática.

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `AdminClientsPage` | página | Listado |
| `AdminClientDetailPage` | página | Ficha + interés + contacto |

## Dependencias

- `shared/`: api, toasts, WhatsApp helpers
- Vista de producto tienda → `POST /api/catalog/products/:slug/view` (con cookie)

## Pantallas / rutas

| Ruta | Componente |
| --- | --- |
| `/admin/clientes` | `AdminClientsPage` |
| `/admin/clientes/:id` | `AdminClientDetailPage` |

## Verificación

- [ ] Cliente logueado abre fichas → filas en `user_product_views`
- [ ] Admin ve listado y «Ver detalles»
- [ ] Tabs frecuentes / últimos vistos
- [ ] WhatsApp / email con mensaje de oferta
- [ ] Móvil / tablet / desktop
