# Cambio: Registro — validación propia, contraseña y modal teléfono

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Formulario `noValidate`: mensajes de error propios bajo cada campo (sin tooltips nativos del navegador).
- Teléfono/WhatsApp **obligatorio** (mín. 9 dígitos).
- Requisitos de contraseña visibles en vivo: 8+, mayúscula, minúscula, número, carácter especial.
- Al pulsar «Crear cuenta» (si el form es válido): modal «¿Tu número es correcto?» con **Sí, es correcto** → `/cuenta` o **Editar número** (enfoca el campo).

## Por qué

Las notificaciones nativas no encajan con la marca; el teléfono es esencial para comercial/WhatsApp y hay que confirmarlo antes de crear la cuenta.

## Cómo

Validación controlada en React; checklist de reglas; modal accesible (`role="dialog"`, Escape / overlay → editar). Fase visual: sin API.

## Archivos

- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `docs/features/auth.md`
- `docs/changes/0077-registro-validacion-password-modal-telefono.md`

## Cómo verificar

- [ ] Enviar vacío: errores rojos bajo campos; **no** sale bubble «Completa este campo» del browser
- [ ] Teléfono vacío u &lt;9 dígitos: error obligatorio
- [ ] Contraseña débil: checklist en gris/rojo y mensaje de requisitos
- [ ] Form válido → modal con el número; Editar cierra y enfoca teléfono; Sí navega a `/cuenta`
- [ ] Móvil: modal bottom-sheet usable; tablet/desktop centrado
- [ ] `prefers-reduced-motion`: modal sin animación pesada
