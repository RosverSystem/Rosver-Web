# Cambio: Quitar “Agregar otro producto” en cotización

**Fecha:** 2026-09-08  
**Tipo:** fix

## Qué cambió

- Se eliminó el enlace/botón «Agregar otro producto a la lista» en `/cotizar`.
- Los productos se agregan solo con el buscador / carrito (sin fila vacía manual).

## Por qué

Pedido del usuario: quitar ese control de la cotización.

## Archivos

- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `docs/changes/0134-cotizar-sin-agregar-vacio.md`

## Cómo verificar

- [ ] En `/cotizar` (pestaña catálogo) no aparece «Agregar otro producto a la lista»
- [ ] Se puede seguir agregando productos con el buscador
- [ ] _(UI)_ Móvil / tablet / desktop
