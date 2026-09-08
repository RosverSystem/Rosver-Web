# Cambio: Orden automático + unidad combobox + precios simples

**Fecha:** 2026-09-08  
**Tipo:** fix | feature

## Qué cambió

- **Destacado / tendencia:** ya no se escribe “Orden en carrusel” ni “Orden tendencia”; al guardar se asigna el siguiente número automático.
- **Tipo de unidad:** se puede elegir de la lista o escribir uno nuevo (`AdminCombobox`); si no existe, se crea al agregar la presentación.
- **Precio extra / oferta:** se quitó el selector confuso “Tipo de precio” y “Desde (unidades)”. Venta y mayorista van en la fila de agregar presentación; el bloque extra solo agrega **oferta**.

## Por qué

Pedido UX: el orden no debía pedirse a mano; la unidad debía permitir escribir; el “otro tipo de precio” no tenía sentido al usuario.

## Cómo

- `nextAutoSort` sobre productos ya destacados/en tendencia.
- `AdminCombobox` (datalist) en `admin-field.tsx`.
- Extra price siempre `priceKind: 'offer'` (al editar se mantiene el tipo existente).

## Archivos

- `RosverSac/src/shared/ui/admin-field.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminPriceListPage.tsx`
- `docs/changes/0133-precios-orden-auto-unidad-combobox.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Producto → Destacado/Tendencia: solo checkboxes, sin campos de orden
- [ ] Agregar presentación escribiendo un tipo nuevo (ej. “Fardo”) → se crea y guarda
- [ ] Precio extra: solo “Oferta” + monto (sin tipo ni “desde”)
- [ ] Listado de precios: mismo comportamiento
- [ ] _(UI)_ Móvil / tablet / desktop en wizard y modales
