# Formularios — toasts flotantes

Toda validación, campo obligatorio o condición de envío usa **toasts flotantes**. No alargar el layout con mensajes bajo cada input.

## Obligatorio

- `noValidate` en `<form>` (o botones `type="button"` + validación manual).
- **No** usar `required` / `minLength` HTML para disparar el bubble nativo del browser.
- Errores con `useFormToasts` + `FloatingToasts` (`shared/hooks/use-form-toasts`, `shared/ui/floating-toasts`).
- Marcar inputs inválidos solo con borde (`cnField` / `aria-invalid`), **sin** texto de error inline.
- Helpers: `isValidEmail`, `isValidPhone`, `cnField` en `@/shared/lib`.

## Anti-patrones

- Banner de errores dentro del flujo del form que empuja el contenido.
- Dependender del tooltip «Completa este campo» del navegador.
- Reimplementar toasts por feature: reutilizar `shared/`.

## Alcance

Login, registro, contacto, cotizar, cuenta, admin y **cualquier form nuevo**.
