# Cambio: Habilitar/ocultar/eliminar productos + modales de aviso

**Fecha:** 2026-09-14  
**Tipo:** fix  
**Versión:** 0.1.68

## Qué cambió

- Productos admin: botones **Editar · Ocultar/Habilitar · Eliminar** (el oculto se puede volver a habilitar).
- Eliminar permanente con `DELETE ?permanent=1`; ocultar/habilitar vía `PATCH visible`.
- Nuevo `AdminConfirmModal` / `useAdminConfirm` — reemplaza `window.confirm` en ERP (productos, marcas, categorías, ofertas, specs, unidades, usuarios, roles, leads, storage) y vaciar carrito.
- Iconos redes (menú móvil / footer): fondo blanco + color ink para que no “desaparezcan”.

## Por qué

El basurero solo ocultaba y no había forma de habilitar; el aviso nativo del browser no tenía diseño Rosver; TikTok/IG se perdían en fondo oscuro.

## Cómo

Modal sobre `AdminModal` con tonos danger/warning/success; acciones de producto separadas por intención.

## Archivos

- `RosverSac/src/shared/ui/admin-confirm-modal.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductWorkspacePage.tsx`
- `RosverSac/server/src/routes/admin-catalog.ts`
- Varios módulos admin + `CartPage` + `PublicNavOverlay` / `Footer`

## Cómo verificar

- [ ] Producto oculto → botón verde Habilitar → vuelve a Visible
- [ ] Eliminar pide modal Rosver (no el diálogo del browser)
- [ ] Ocultar pide modal amarillo de advertencia
- [ ] Menú hamburguesa: IG/TikTok visibles sobre círculo blanco
- [ ] Móvil / tablet / desktop
