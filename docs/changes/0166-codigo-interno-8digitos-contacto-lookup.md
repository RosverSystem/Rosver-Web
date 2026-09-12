# Cambio: Código interno 8 dígitos + contacto lookup UX

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Código interno de producto se muestra como **8 dígitos** (`2` → `00000002`).
- Secuencia Postgres permite partir desde `0` (`00000000`) e incrementar de 1 en 1.
- Admin productos: columna/lista y campo de solo lectura con el código formateado.
- Contacto: select DNI/RUC custom; botón buscar solo icono; búsqueda al salir del campo o al clic; validación RUC empieza con 10/20; WhatsApp/teléfono y correo en campos separados.

## Por qué

Pedido UX: código interno legible a ancho fijo; formulario de contacto más claro y usable.

## Cómo

- Helper `formatInternalCode` + `codeLabel` en API catálogo/admin.
- Migración `016_product_code_sequence.sql` (`MINVALUE 0`, `setval` al máximo actual).
- Combobox accesible + blur lookup Decolecta.

## Archivos

- `RosverSac/src/shared/lib/internal-code.ts`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/server/sql/016_product_code_sequence.sql`
- `RosverSac/server/src/lib/catalog-products.ts`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `RosverSac/server/src/routes/peru.ts`
- `docs/changes/0166-codigo-interno-8digitos-contacto-lookup.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Ficha producto: Código interno tipo `00000002` (no solo `2`)
- [ ] Admin → Productos: lista muestra `#00000002`; al editar aparece el campo interno
- [ ] Nuevo producto: tras guardar, código 8 dígitos asignado
- [ ] Contacto: select DNI/RUC abre menú; lupa busca; al salir del nº con datos válidos también busca
- [ ] RUC que no empiece en 10/20 → toast de error
- [ ] WhatsApp/teléfono y Correo son campos distintos
- [ ] _(Si UI)_ móvil / tablet / desktop OK
