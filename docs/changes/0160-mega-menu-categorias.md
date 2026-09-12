# Cambio: Mega-menú categorías — clic fuera + nuevo modelo

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- “Ver categorías” se cierra con clic fuera, Escape o al navegar.
- Nuevo modelo: panel de 2 columnas (lista izquierda + detalle/subcategorías a la derecha).

## Por qué

Pedido de Rosa: cerrar al clic afuera y cambiar el layout del menú.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`

## Cómo verificar

- [ ] Abrir Ver categorías → clic fuera → se cierra
- [ ] Escape cierra
- [ ] Hover/clic en categoría izquierda muestra hijas a la derecha
- [ ] _(UI)_ Desktop (≥1024px)
