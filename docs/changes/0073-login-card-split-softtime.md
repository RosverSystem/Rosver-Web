# Cambio: Login card split (estilo Softtime → Rosver)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `LoginPage` reescrito: card blanca centrada, split ilustración | form (pills), CTA rojo, social FB/Google stub.
- Fondo `rosver-soft`; barra lateral roja; ilustración SVG liviana (sin bitmap / sin lib nueva).
- `RegisterPage` mismo patrón de card.
- Sin panel ink + hero anterior.

## Por qué

El login anterior no coincidía con el ejemplo del usuario (card suave + ilustración).

## Cómo

Layout Softtime adaptado a tokens Rosver. Motion ya en stack. Sin dependencias nuevas.

## Archivos

- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `docs/features/auth.md`
- `docs/changes/0073-login-card-split-softtime.md`

## Cómo verificar

- [ ] `/login`: card centrada; desktop 2 cols; móvil solo form
- [ ] Pills + Empezar → `/cuenta`
- [ ] Botones social no rompen (stub)
- [ ] `/registro` misma estética
- [ ] Solo colores de paleta (+ logos FB/Google)
