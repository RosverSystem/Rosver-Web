# Formularios y avisos — toasts tipados

Toda validación, confirmación o fallo usa **toasts flotantes tipados**. No alargar el layout con mensajes bajo cada input.

## Tipos (obligatorio)

| Tone | Uso | Color Rosver |
| --- | --- | --- |
| `success` | Guardado, enviado, creado, sesión OK | `rosver-success` |
| `error` | Validación, API fallida, código incorrecto | `rosver-red` |
| `info` | Neutro / informativo | `rosver-blue` |
| `warning` | Correo no entregado, aviso no bloqueante | `rosver-yellow` + texto ink |

API: `useFormToasts` → `showSuccess` / `showErrors` / `showInfo` / `showWarning`.

UI: `FloatingToasts` (`shared/ui/floating-toasts`).

## Obligatorio en forms

- `noValidate` en `<form>`.
- **No** `required` / bubbles nativos del browser.
- Errores → `showErrors`. Éxitos → `showSuccess`.
- Inputs inválidos solo con borde (`cnField` / `aria-invalid`), sin texto inline.

## Anti-patrones

- Todos los toasts rojos como si fueran error.
- Banner de errores que empuja el layout.
- Reimplementar toasts por feature.

## Alcance

Login, registro, OTP, contacto, cotizar, cuenta, admin y cualquier form o aviso nuevo.

Paridad: `.cursor/rules/10-form-toasts.mdc`.
