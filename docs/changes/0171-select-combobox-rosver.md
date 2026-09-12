# Cambio: Select / combobox Rosver unificado

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Nuevo `SelectCombobox` en `shared/ui` (lista custom, opción activa ink, sin azul nativo).
- `AdminSelect` del ERP usa el mismo menú custom.
- Aplicado en: Cotizar (presentación), Catálogo (ordenar), Contacto/Empresa (DNI-RUC), Libro de reclamaciones.

## Por qué

Pedido: trabajar el diseño de selects/combobox (p. ej. UND / DOCENA en cotizar).

## Archivos

- `RosverSac/src/shared/ui/select-combobox.tsx`
- `RosverSac/src/shared/ui/admin-field.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/features/catalog/ui/CatalogPage.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/src/features/account/ui/AccountCompanyPage.tsx`
- `RosverSac/src/features/complaints-book/ui/ComplaintsBookPage.tsx`

## Cómo verificar

- [ ] `/cotizar`: abrir presentación — menú redondeado, opción activa negra (no azul)
- [ ] `/catalogo`: ordenar con el mismo estilo
- [ ] `/admin` selects (marcas/categorías): menú custom
- [ ] Contacto / Mi empresa / Libro reclamaciones: selects OK
- [ ] Móvil / tablet / desktop
