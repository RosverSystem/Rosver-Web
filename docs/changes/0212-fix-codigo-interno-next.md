# Cambio: Fix código interno siguiente en wizard

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- `GET /api/admin/products/next-code` ya no choca con el middleware UUID (`next-code` no es UUID → 400 vacío).
- Al crear producto, el campo muestra al toque el siguiente número (desde el listado) y se confirma con la API.

## Por qué

El campo salía vacío: la API rechazaba `next-code` como id inválido.

## Archivos

- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `docs/changes/0212-fix-codigo-interno-next.md`

## Cómo verificar

- [ ] Nuevo producto → Código interno con 8 dígitos (ej. `00000003`), solo lectura
- [ ] Coincide con el siguiente después del mayor del listado
