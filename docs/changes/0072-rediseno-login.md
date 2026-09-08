# Cambio: Rediseño login (y registro alineado)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `LoginPage`: hero + split ink/form, labels, ver/ocultar clave, recordar, links catálogo/cotizar.
- Sin `WireBlock`; CTA rojo paleta; submit mock → `/cuenta`.
- `RegisterPage` actualizado al mismo lenguaje visual (sin wireframe).

## Por qué

Login seguía en wireframe; el resto del sitio ya tiene diseño Rosver.

## Archivos

- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `docs/features/auth.md`
- `docs/features/README.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0072-rediseno-login.md`

## Cómo verificar

- [ ] `/login`: panel oscuro + formulario; Ingresar → `/cuenta`
- [ ] Ver/ocultar contraseña; link a registro
- [ ] `/registro` coherente; crear cuenta → `/cuenta`
- [ ] Móvil apila paneles; desktop 2 cols
- [ ] Colores solo tokens Rosver (+ WA si aparece)
