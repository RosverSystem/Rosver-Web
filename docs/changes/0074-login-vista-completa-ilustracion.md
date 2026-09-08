# Cambio: Login vista completa + ilustración real

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `AuthLayout`: login/registro a pantalla completa (sin navbar/footer marketplace); link ROSVER → inicio.
- `LoginPage`: split 50/50 full `dvh`; ilustración WebP profesional; form a la derecha.
- Asset `public/login-hero-rosver.webp` (trabajador Rosver, casco rojo).
- `RegisterPage` mismo patrón full-bleed.

## Por qué

La card chica + doodle SVG no cumplían el ejemplo ni la calidad pedida.

## Archivos

- `RosverSac/src/app/layout/AuthLayout.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `RosverSac/public/login-hero-rosver.webp`
- `docs/features/auth.md`
- `docs/changes/0074-login-vista-completa-ilustracion.md`

## Cómo verificar

- [ ] `/login` llena la pantalla; sin header/footer marketplace
- [ ] Desktop: ilustración izquierda + form derecha
- [ ] Móvil: solo form (ilustración oculta)
- [ ] Empezar → `/cuenta`; “Inicio” en esquina vuelve a `/`
- [ ] Imagen carga (WebP en `/login-hero-rosver.webp`)
