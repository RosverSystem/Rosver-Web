# Cambio: Registro — errores flotantes (sin alargar el form)

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Eliminados mensajes de error **inline** bajo cada campo y el banner «Revisa los campos…» del flujo del form.
- Los avisos pasan a **toasts flotantes** (`fixed`, esquina superior) que no empujan el layout.
- Los campos inválidos siguen con borde rojo; los toasts se cierran solos (~4,5 s) o con «Cerrar».

## Por qué

Los textos bajo cada input alargaban la página al validar.

## Archivos

- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `docs/changes/0079-registro-errores-flotantes.md`

## Cómo verificar

- [ ] Enviar form vacío: toasts arriba; el alto del form **no** crece por mensajes bajo inputs
- [ ] Solo bordes rojos en campos; checklist/barra de password sin cambios
- [ ] Móvil: toasts anchos usables; desktop: stack a la derecha
- [ ] «Cerrar» o esperar ~4,5 s limpia los avisos
