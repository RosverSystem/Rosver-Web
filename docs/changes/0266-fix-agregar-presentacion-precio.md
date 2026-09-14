# Cambio: Fix agregar presentación/precio (Datos inválidos)

**Fecha:** 2026-09-14  
**Tipo:** fix  
**Versión:** 0.1.69

## Qué cambió

- Al agregar presentación en ficha producto, ya no falla con «Datos inválidos» cuando la cantidad no tiene etiqueta (`label: null`, p. ej. «× 1»).
- API packagings/prices: acepta `label` null y coerce de números.
- Front: no envía `label` null; compara cantidades con `Number()`.

## Por qué

Zod rechazaba `label: null` (`z.string().optional()` no admite null). Cualquier presentación del catálogo sin etiqueta fallaba al Agregar.

## Archivos

- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminProductWorkspacePage.tsx`

## Cómo verificar

- [ ] Producto con Unidad + Docena → agregar otra presentación distinta (p. ej. Caja × N) con precio → OK
- [ ] Cantidad mostrada como «× 1» (sin etiqueta) se puede agregar
- [ ] Duplicada muestra «Esa presentación ya está en este producto»
