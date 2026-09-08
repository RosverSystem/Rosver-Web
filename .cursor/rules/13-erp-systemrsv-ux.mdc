---
description: UX/UI del ERP SystemRSV — estilo bento, paleta Rosver, sin mezclar con tienda pública
globs: RosverSac/src/app/layout/Admin*.tsx,RosverSac/src/app/pages/Admin*.tsx,RosverSac/src/features/admin-*/**
alwaysApply: false
---

# ERP SystemRSV — UX / UI (obligatorio en `/admin`)

El panel admin (**SystemRSV**) tiene **lenguaje visual propio**, distinto del ecommerce público. No copiar navbar rojo de la tienda ni wireframes grises.

Referencia de composición: dashboard bento (sidebar iconográfica oscura + top bar saludo/búsqueda/cuenta + cards redondeadas). Paleta: solo tokens Rosver (regla `09-paleta-colores`).

## Shell fijo

| Zona | Estilo |
| --- | --- |
| Fondo workspace | `bg-rosver-soft` |
| Sidebar | Slim, `bg-rosver-ink`, iconos claros; activo = `bg-rosver-red` o pill clara |
| Top bar | Saludo + primer nombre, **hora local**, buscador de módulos/datos (pill), menú **Mi cuenta** (perfil / logout) |
| Contenido | Cards `rounded-2xl` / `rounded-3xl`, `bg-white`, sombra suave; mucho aire |
| CTA primario ERP | `bg-rosver-red` (no azul soft del mock genérico) |
| Apoyo B2B | `rosver-blue` en chips / secundarios |

## Anti-patrones

- Mezclar UtilityBar / nav roja pública dentro de `/admin`.
- Tablas wireframe con bordes dashed eternos como UI final.
- Purple / cream / Inter genérico / glow neon.
- Más de un estilo de card o sidebar distinto por módulo.
- Logout suelto fuera del menú «Mi cuenta» del top bar.

## Módulos

Cada módulo nuevo (Productos, Pedidos, …) hereda este shell. La página puede empezar vacía; el chrome (nav + top) ya define el estilo.

Detalle: `docs/architecture/09-erp-systemrsv-ux.md`. Skill estructura: `fullstack-erp-structure`.
