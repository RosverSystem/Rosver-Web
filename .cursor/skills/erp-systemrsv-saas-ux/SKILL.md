---
name: erp-systemrsv-saas-ux
description: Estilo UX/UI del ERP SystemRSV tipo SaaS soft (sidebar blanca colapsable, top bar sin perfil duplicado). Usar al diseñar o tocar cualquier pantalla /admin.
---

# ERP SystemRSV — estilo SaaS soft (paleta Rosver)

Referencia: sidebar clara colapsable (iconos / iconos+labels) + top bar limpia. **Colores solo tokens Rosver**.

## Layout

```
┌────────────┬──────────────────────────────────┐
│ Sidebar    │ Top: título página · search · ⏰ │
│ blanca     ├──────────────────────────────────┤
│ (colaps.)  │ Workspace bg-rosver-soft         │
│ perfil ↓   │ Cards blancas rounded-2xl        │
└────────────┴──────────────────────────────────┘
```

| Pieza | Regla |
| --- | --- |
| Fondo | `bg-rosver-soft` |
| Sidebar expandida | `bg-white` ~260px, icono + label |
| Sidebar colapsada | ~72px, solo iconos + tooltips |
| Activo | Pill/borde `rosver-red` (nunca azul mock) |
| **Perfil** | **Solo** al pie del sidebar (avatar · nombre · menú logout). **Prohibido** repetir avatar/saludo en el top bar |
| Top bar | Título de módulo + búsqueda módulos (⌘K) + hora; sin bloque “Mi cuenta” |
| Cards | `bg-white rounded-2xl shadow-sm border-rosver-line` |
| CTA | `bg-rosver-red` |

## Módulos nav

1. **Inicio** → `/admin`
2. **Productos** → Listado `/admin/productos` · Categorías `/admin/categorias` · Ofertas `/admin/ofertas`

## Anti-patrones

- Perfil duplicado (sidebar + top bar).
- Sidebar oscura permanente solo-iconos como único modo.
- Azul EduNova / purple / cream.
- Nav roja de la tienda pública en `/admin`.

## Checklist

- [ ] `AdminShell` + sidebar colapsable
- [ ] Un solo perfil (footer sidebar)
- [ ] Top bar sin avatar/nombre de sesión
- [ ] Responsive drawer móvil
- [ ] `cssvg-icons` + docs `09-erp-systemrsv-ux.md`
