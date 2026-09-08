# Cambio: Registro — checklist al teclear + barra de seguridad

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Los requisitos de contraseña se **despliegan mientras se escribe** y se **ocultan ~0,9 s** después de dejar de teclear.
- Al ocultarse, aparece una **barra de seguridad**: Baja (rojo) / Media (amarillo) / Segura (verde), según cuántas reglas se cumplen.
- Si el submit falla por contraseña, el checklist vuelve a mostrarse.

## Por qué

El listado fijo ocupaba espacio; el usuario pidió feedback al teclear y, en reposo, un indicador tipo barra (baja / media / segura).

## Archivos

- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `docs/changes/0078-registro-password-barra-seguridad.md`

## Cómo verificar

- [ ] Empezar a escribir en Contraseña → aparece checklist
- [ ] Dejar de escribir ~1 s → checklist se esconde y sale barra Baja/Media/Segura
- [ ] Seguir tecleando → vuelve el checklist
- [ ] Vaciar el campo → no hay checklist ni barra
- [ ] Móvil / tablet / desktop: transición usable sin saltos fuertes
