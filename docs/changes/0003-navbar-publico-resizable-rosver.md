# 0003 — Navbar público Rosver (resizable + estilo marca)

**Fecha:** 2026-08-27  
**Tipo:** feature

## Qué cambió

- Stack UI: Tailwind CSS v4, Motion (`motion`), React Router, `clsx` / `tailwind-merge`.
- Primitivos tipo Aceternity Resizable Navbar en `shared/ui/resizable-navbar` (Navbar, NavBody, NavItems, MobileNav*).
- `PublicNavbar` con estilo Rosver: barra superior (redes + buscar), logo ROS/VER, links, categorías dropdown, carrito y cuenta.
- Animación al scroll: la barra principal se estrecha, flota, blur y sombra (desktop y mobile).
- Shell de app con router y home placeholder para probar scroll.

## Por qué

Primera pieza visual del catálogo: navegación compartida replicando la funcionalidad/animación de Aceternity con branding Rosver (referencia del header propio).

## Cómo

- Primitivos reutilizables en `shared/`; composición Rosver en `app/layout`.
- Tokens de marca en `@theme` (`rosver-red`, tipografías Manrope + Oswald).
- Sin lógica real de búsqueda/carrito/auth (fase visual / mock).

## Archivos

- `RosverSac/package.json`
- `RosverSac/vite.config.ts`
- `RosverSac/index.html`
- `RosverSac/src/styles/global.css`
- `RosverSac/src/shared/lib/cn.ts`
- `RosverSac/src/shared/ui/resizable-navbar/*`
- `RosverSac/src/shared/ui/icons.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/app/App.tsx`

## Cómo verificar

- [ ] `cd RosverSac && npm run dev` → http://localhost:5173
- [ ] Arriba: iconos sociales + “Buscar productos...”
- [ ] Logo ROS (rojo) + VER (negro), links Inicio/Productos/Tienda/Categorías, carrito y usuario
- [ ] Al hacer scroll, la barra principal se compacta (ancho, blur, sombra, bordes redondeados)
- [ ] En viewport estrecho: menú hamburguesa con links y búsqueda
- [ ] `npm run build` sin errores
