# Cambio: Auth login/registro responsive sin scrollbar

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Shell compartido `AuthSplitShell`: viewport fijo (`h-dvh`), split desktop, hero que escala con la altura.
- Login y registro usan ese shell; tipografía/padding se reducen en pantallas bajas (`max-height`).
- Barra de scroll del documento oculta en `/login`, `/registro`, `/recuperar` (`auth-lock-scroll`).
- Scroll interno del formulario (si hace falta) sin barra visible (`.hide-scrollbar`).
- Lenis desactivado en rutas auth (igual que admin).

## Por qué

En 1920×1280 (y otros anchos/altos) el split con `min-h-dvh` + imagen hero empujaba la página y mostraba scrollbar. Había que adaptar a móvil, tablet, laptop y desktop.

## Cómo

- `AuthLayout` bloquea overflow del `html` mientras está montado.
- Hero con `max-h` relativo a `dvh`; caption se oculta en alturas muy bajas.
- En registro, lista de beneficios se oculta bajo ~780px de alto para que el form quepa.

## Archivos

- `RosverSac/src/features/auth/ui/AuthSplitShell.tsx` (nuevo)
- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `RosverSac/src/features/auth/ui/ResetPasswordPage.tsx`
- `RosverSac/src/app/layout/AuthLayout.tsx`
- `RosverSac/src/app/providers/SmoothScroll.tsx`
- `RosverSac/src/styles/global.css`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/login` en 1920×1080 / 1920×1280: sin scrollbar de página; split 50/50
- [ ] `/registro` igual; si el form es alto, se puede desplazarse sin ver barra
- [ ] Móvil (&lt;768): solo formulario, sin overflow horizontal
- [ ] Tablet (768–1023): formulario usable; sin scroll de página vacío
- [ ] Desktop (≥1024): hero + form; hero no desborda
- [ ] Reducir altura del DevTools (~700px): tipografía/espaciado más compactos; sin scroll fantasma
- [ ] Salir a `/` restaura scrollbar normal de la tienda
