# Cambio: Restaurar intro en cada F5 (sin sessionStorage)

**Fecha:** 2026-09-11  
**Tipo:** fix

## Qué cambió

- Se revirtió el “una vez por pestaña” (`sessionStorage` / `rosver-intro-done`) en `IntroTransition`.
- La cortina de marca vuelve a correr en **cada carga real** (F5 incluido).
- Comentario de regla en el archivo: no saltar ni condicionar la intro por HMR/import/debug.

## Por qué

Se había limitado la animación para no repetirla en remounts de desarrollo; eso rompió el comportamiento de producto en F5. No debe tocarse.

## Cómo

Restaurar el estado original: `useState(prefersReducedMotion)` y sin persistencia en storage.

## Archivos

- `RosverSac/src/app/layout/IntroTransition.tsx`
- `docs/changes/0227-restaurar-intro-f5.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Abrir cualquier ruta → intro paneles + logo
- [ ] Pulsar F5 → la intro se vuelve a reproducir
- [ ] Con “reducir movimiento” del SO → no se muestra
