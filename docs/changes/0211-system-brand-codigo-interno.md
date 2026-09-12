# Cambio: System tipografía + código interno preview

**Fecha:** 2026-09-10  
**Tipo:** feature

## Qué cambió

- Sidebar: «System» con Oswald (`font-display`), punto rojo, subrayado gradiente y separador del logo.
- Productos wizard: código interno se carga al crear (`GET /api/admin/products/next-code`), visible y solo lectura; al editar muestra el real.

## Por qué

Marca más clara junto al logo; el código interno debe verse ya al alta, sin poder editarlo.

## Cómo

Preview = `MAX(code)+1` (no consume secuencia). El INSERT sigue usando el serial real.

## Archivos

- `RosverSac/src/app/layout/admin/AdminSidebar.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `docs/changes/0211-system-brand-codigo-interno.md`

## Cómo verificar

- [ ] Sidebar: System con tipografía display + acento rojo
- [ ] Nuevo producto: código interno aparece en 8 dígitos, no editable
- [ ] Editar producto: muestra el código guardado
- [ ] Tras guardar, el código coincide con el listado
