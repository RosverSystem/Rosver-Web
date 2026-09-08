# Feature: Admin — catálogo

**Slug:** `features/admin-catalog/`  
**Estado:** activa (ERP SystemRSV — Productos vacío; form/categorías legacy)

## Propósito

CRUD de productos y categorías que alimentan el catálogo público.

## Rutas

`/admin/productos`, nuevo, edición, `/admin/categorias`.

## UX

Hereda shell SystemRSV (`docs/architecture/09-erp-systemrsv-ux.md`).  
`/admin/productos` = placeholder vacío hasta CRUD real.

## Flujos

`03-vistas-y-flujos.md` → F7 · `logica-y-flujos/03-erp-systemrsv.md`

## Verificación

- [x] Ruta `/admin/productos` montada en shell ERP
- [x] Vista Productos vacía (sin mocks wireframe)
- [ ] CRUD productos + API + R2
- [ ] Rediseñar categorías / formularios al estilo ERP
