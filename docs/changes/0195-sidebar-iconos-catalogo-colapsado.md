# Cambio: Sidebar colapsada — iconos del catálogo (sin letras)

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Colapsado: Catálogo muestra **iconos** de Productos / Precios / Categorías / Marcas / Ofertas (ya no P/L/C/M/O).
- Iconos distintos por ítem del catálogo en `admin-nav`.
- Expandido: submenú también con icono + nombre.
- Vite reiniciado con caché limpia.

## Por qué

Rosa reportó letras sueltas y errores visuales en el sidebar colapsado (caché + letras intencionales antiguas).

## Archivos

- `RosverSac/src/app/layout/admin/AdminSidebar.tsx`
- `RosverSac/src/app/layout/admin/admin-nav.ts`
- `docs/changes/0195-sidebar-iconos-catalogo-colapsado.md`

## Cómo verificar

- [ ] Colapsar menú: solo iconos; **sin** letras P L C M O
- [ ] Hover/title muestra el nombre del módulo
- [ ] Expandir: Catálogo con lista + iconos
- [ ] `Ctrl+Shift+R` en `/admin`
