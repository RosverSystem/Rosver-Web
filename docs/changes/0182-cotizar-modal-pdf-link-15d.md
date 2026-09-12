# Cambio: Modal PDF + link temporal 15 días + WhatsApp

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Botón «Enviar cotización a WhatsApp» abre un **modal responsive** con el PDF.
- Se guarda la cotización en Postgres (cliente, ubigeo, agencia, productos).
- Link público temporal **15 días**: `/c/{nombre-cliente}-{codigo}` (ej. `/c/rosa-sac-qt-2026-000004`).
- Al vencer: el PDF se elimina; los datos de cotización permanecen.
- En el modal: **Cotizar por WhatsApp** con mensaje prefijado + el link.
- Vista pública `/c/:slug` (cualquiera con el link).
- Admin `/admin/cotizaciones` + ítem en nav.

## Por qué

Compartir cotización por WhatsApp con PDF visible vía link personalizado, sin adjunto automático.

## Cómo

- `022_quote_public_link.sql`: `public_slug`, `link_expires_at`, `pdf_bytes` / `pdf_r2_key`.
- `POST /api/quotes` → crea + slug; `PUT /api/quotes/:id/pdf` → guarda PDF.
- `GET /api/quotes/public/:slug` (+ `/pdf`); purge al expirar.

## Archivos

- `RosverSac/server/sql/022_quote_public_link.sql`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/server/src/lib/quote-slug.ts`
- `RosverSac/src/features/quotes/ui/QuoteShareModal.tsx`
- `RosverSac/src/features/quotes/ui/PublicQuotePage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/features/cart/lib/quote-pdf.ts`

## Cómo verificar

- [ ] `/cotizar` → completar form → botón verde → modal con PDF
- [ ] «Cotizar por WhatsApp» abre chat con mensaje + link `/c/...`
- [ ] Abrir el link en otra pestaña / incógnito: se ve la cotización y el PDF
- [ ] Modal usable en móvil / tablet / desktop
- [ ] `/admin/cotizaciones` lista la fila con el slug
