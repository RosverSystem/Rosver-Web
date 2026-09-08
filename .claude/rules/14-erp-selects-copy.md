---
description: Selects/combobox ERP — estilo Rosver y lenguaje claro (sin jerga técnica)
globs: RosverSac/src/app/layout/admin/**/*,RosverSac/src/features/admin-*/**,RosverSac/src/shared/ui/admin-*.tsx
alwaysApply: false
---

# ERP — selects, combobox y copy legible

## Obligatorio en `/admin`

- Usar `AdminSelect` / clases `adminControlClass` de `@/shared/ui/admin-field` (borde `rosver-line`, focus rojo, alto ~44px).
- **No** `<select>` nativo “pelado” sin estilo compartido.
- Labels visibles encima del control (`AdminField`); no solo placeholder.
- Opciones en **español cotidiano** (usuario que no programa).

## Lenguaje (anti-jerga)

| Evitar | Preferir |
| --- | --- |
| Sin padre / raíz / topbar | Categoría principal (aparece en el menú) |
| Sub de: X | Dentro de: X |
| Cascada / empaque / tramo | Presentación / unidades por caja / precio |
| NAV / slug / parent_id | En el menú / enlace / categoría superior |
| Mensajes de ayuda largos bajo el título | Sin texto de ayuda; UI autoexplicativa |

## Anti-patrones

- Explicar arquitectura en la UI (“Raíces → topbar…”).
- Select azul nativo del browser como look final.
- Placeholders que sustituyen al label.
