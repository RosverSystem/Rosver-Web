---
name: erp-systemrsv-saas-ux
description: Estilo UX/UI del ERP SystemRSV tipo SaaS soft (sidebar blanca con labels, top bar search+perfil, cards). Usar al diseñar o tocar cualquier pantalla /admin.
---

# ERP SystemRSV — estilo SaaS soft (paleta Rosver)

Referencia de composición: dashboard SaaS claro (sidebar con texto, search ⌘K, perfil arriba a la derecha, workspace en cards). **Colores solo tokens Rosver** — no azul EduNova / no purple AI.

## Layout obligatorio

```
┌──────────┬─────────────────────────────────────┐
│ Sidebar  │ Top bar: search módulos · perfil    │
│ blanca   ├─────────────────────────────────────┤
│ labels   │ Workspace bg-rosver-soft            │
│ + iconos │ Cards blancas rounded-2xl / 3xl     │
└──────────┴─────────────────────────────────────┘
```

| Pieza | Tokens / reglas |
| --- | --- |
| Fondo app | `bg-rosver-soft` |
| Sidebar | `bg-white`, borde `border-rosver-line`, ~240–280px |
| Item activo | Pill `bg-rosver-red text-white` (no azul) |
| Item idle | `text-rosver-muted` / hover `bg-rosver-soft` |
| Top search | Pill blanca, placeholder módulos |
| Perfil | Avatar + nombre + rol; **logout solo en menú** |
| Cards | `bg-white rounded-2xl shadow-sm border-rosver-line` |
| CTA | `bg-rosver-red` · apoyo `rosver-blue` |

## Módulos actuales (única nav)

1. **Inicio** → `/admin`
2. **Productos** (grupo)
   - Listado → `/admin/productos`
   - Categorías → `/admin/categorias`
   - Ofertas → `/admin/ofertas`

No añadir otros ítems al sidebar sin actualizar esta skill + `admin-nav.ts` + docs.

## Anti-patrones

- Sidebar oscura solo-iconos (modelo anterior).
- Nav roja de la tienda pública dentro de `/admin`.
- Azul primario del mock EduNova; purple/cream genéricos.
- Mezclar wireframe dashed con cards SaaS en la misma vista.
- Logout suelto fuera del menú de perfil.

## Checklist pantalla nueva

- [ ] Hereda `AdminShell`
- [ ] Vista puede empezar en blanco (card placeholder)
- [ ] Responsive: drawer sidebar en móvil
- [ ] Iconos `cssvg-icons`
- [ ] Docs `09-erp-systemrsv-ux.md` + change si aplica
