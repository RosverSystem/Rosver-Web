# Feature: Cotizaciones

**Slug:** `features/quotes/`  
**Estado:** activa (diseño visual alineado a contacto/catálogo)

## Propósito

Solicitar cotizaciones desde el catálogo/carrito y gestionarlas en backoffice (comercial/admin).

## Alcance

- Público/cliente: formulario `/cotizar`, confirmación.
- Cliente: listado en `/cuenta/cotizaciones`.
- Admin/sales: `/admin/cotizaciones`.

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/cotizar` | `QuoteRequestPage` | Datos negocio + ítems (carrito o buscador) + WhatsApp / pasar a carrito; beneficios 24h/TC abajo |
| `/cuenta/cotizaciones` | `ClientQuotesPage` | Listado estados |
| `/admin/cotizaciones` | `AdminQuotesPage` | Bandeja comercial |

## Comportamiento visual (`/cotizar`)

1. Si el carrito tiene ítems → se precargan en la lista (vía `useCart`).
2. Si está vacío → buscador de catálogo para agregar.
3. Tab alternativo: pegar lista libre.
4. Total estimado + TC referencial mock; CTA WhatsApp y “Pasar lista a carrito”.

## Flujos

`03-vistas-y-flujos.md` → F3, F6.

## Verificación

- [x] Formulario visual completo (`QuoteRequestPage`, `/cotizar`)
- [x] Diseño final visual (datos + lista + CTAs + beneficios abajo)
- [x] Prefill desde carrito compartido (`CartProvider`)
- [x] Listado cliente con estados (`ClientQuotesPage`, `/cuenta/cotizaciones`)
- [x] Vista admin lista con estados (badges) (`AdminQuotesPage`, `/admin/cotizaciones`)
- [ ] Persistencia real de `QuoteRequest` (fase lógica)
