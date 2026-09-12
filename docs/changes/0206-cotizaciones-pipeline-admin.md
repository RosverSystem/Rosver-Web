# Cambio: Cotizaciones admin — mismo diseño que pedidos

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Pipeline comercial de cotizaciones: Recibida → En revisión → Respondida → Aceptada → Cerrada.
- Migración `027_quote_pipeline.sql` + evidencias en R2 `quotes/evidence/`.
- `/admin/cotizaciones`: tabla Bootstrap (código/cliente/fecha/fase), búsqueda, paginación, iconos ver/editar/eliminar.
- `/admin/cotizaciones/vista?codigo-cotizacion=&codcliente=`: productos con SKU, pipeline, modal al avanzar.
- API: `GET ?code=`, `PATCH`, `DELETE`, `POST /:id/evidence`.

## Archivos

- `RosverSac/server/sql/027_quote_pipeline.sql`
- `RosverSac/server/src/lib/upload-quote-evidence.ts`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/src/shared/lib/quote-pipeline.ts`
- `RosverSac/src/features/quotes/ui/AdminQuotesPage.tsx`
- `RosverSac/src/features/quotes/ui/AdminQuoteWorkspacePage.tsx`
- `RosverSac/src/app/App.tsx`
- `docs/features/quotes.md`
- `docs/changes/0206-cotizaciones-pipeline-admin.md`

## Cómo verificar

- [ ] Migración `027` + reiniciar API.
- [ ] `/admin/cotizaciones`: tabla con badges y acciones.
- [ ] Botón azul → vista con productos + Avanzar abre modal.
- [ ] Móvil / tablet / desktop.
