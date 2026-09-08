# Cambio: Productos ERP por fases (Odoo) + specs libres sin reseñas manuales

**Fecha:** 2026-09-08  
**Tipo:** feature  
**Versión:** 0.1.19  
**Deploy:** https://rosver-web-production.up.railway.app (`5ef91d3`)

## Qué cambió

- Alta/edición de productos en **4 fases**: Datos → Detalle → Precios → Especs.
- Especificaciones: el usuario crea **tipo + valor** (sin grilla fija SKU/Voltaje/…).
- `POST /api/admin/spec-attributes` para tipos nuevos al vuelo.
- Calificaciones: solo lectura (promedio/reseñas de clientes); quitado «Agregar reseña» del flujo producto.

## Por qué

La vista monolítica con specs default y reseñas admin no coincidía con el flujo real (tipo Odoo + specs libres + rating del cliente).

## Cómo

Wizard en `AdminProductsPage`; specs guardadas solo las filas agregadas; rating sigue recalculándose vía `product_reviews` (UI cliente pendiente P30).

## Archivos

- `RosverSac/src/features/admin-catalog/ui/AdminProductsPage.tsx`
- `RosverSac/server/src/routes/admin-catalog.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/admin/productos` → Nuevo producto → pasar fases 1–4
- [ ] En Especs: agregar «Material» + valor → guardar → se ve en ficha tienda
- [ ] No hay formulario «Agregar reseña» en el producto
- [ ] Rating se muestra como promedio de clientes
- [ ] Móvil / tablet / desktop
