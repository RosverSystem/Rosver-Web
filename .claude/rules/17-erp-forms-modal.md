---
description: ERP — alta/edición solo en AdminModal (no formularios inline en la página)
globs: RosverSac/src/app/layout/admin/**/*,RosverSac/src/features/admin-*/**,RosverSac/src/shared/ui/admin-*.tsx
alwaysApply: false
---

# ERP — formularios en modal

## Regla de oro

En **`/admin` (SystemRSV)** todo formulario de **crear / editar / publicar** va en **`AdminModal`** (`@/shared/ui/admin-modal`).

La página muestra listado (cards/filas) + CTA («Nueva…»). El form **no** vive como card inline permanente en el workspace.

**No aplica** a la tienda pública (`/`, `/catalogo`, `/cuenta`, auth, cotizar, etc.).

## Patrón obligatorio

1. Header con botón **Nueva X** / **Editar** abre modal.
2. Form dentro del modal: `noValidate` + toasts (regla `10`) + `AdminSelect` (regla `14`).
3. Footer del modal: Cancelar + submit (`form="…"` + `type="submit"`).
4. Tras guardar OK → cerrar modal + refrescar listado.
5. Escape / overlay: cerrar (si hay picker anidado, `closeOnEscape={false}` en el form padre como marcas).

## Excepciones (solo estas)

| Caso | Qué hacer |
| --- | --- |
| Búsqueda / filtros del listado | Input en página OK |
| Confirmación destruir | `window.confirm` o modal de confirmación corto |
| Wizard multipaso (productos) | **Dentro** de un `AdminModal` tamaño `xl`, no pantalla completa aparte |
| Listado de precios (presentación → precios) | Crear/editar presentación y precios en **modales**; el listado de presentaciones/precios puede quedar en la página |
| Preview / picker de medios | Modal o capa anidada (`layer` mayor) |

## Anti-patrones

- Card «Nueva oferta / categoría / marca» siempre visible encima del grid.
- Formulario de edición que empuja el listado hacia abajo.
- Wizard de producto reemplazando toda la ruta sin modal.
- Formularios inline «porque el form es largo» → usar `size="xl"` + scroll interno del modal.

## Checklist

- [ ] Alta/edición en `AdminModal`
- [ ] Listado usable sin el form abierto
- [ ] Toasts + AdminSelect
- [ ] Responsive: modal bottom-sheet en móvil (ya en `AdminModal`)
- [ ] No tocar formularios de la web pública con esta regla
