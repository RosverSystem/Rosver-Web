# Cambio: Regla toasts + validación en todos los forms

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Shared: `FloatingToasts`, `useFormToasts`, `isValidEmail` / `isValidPhone`.
- Regla `10-form-toasts` (Cursor + Claude) + punteros en `AGENTS.md` / `CLAUDE.md`.
- Forms con toasts (sin `required` nativo): login, registro, contacto, cotizar (WhatsApp), cuenta, admin producto.

## Por qué

Los bubbles nativos y errores inline alargan o rompen la UI; se unifica el patrón en todo el sitio.

## Archivos

- `RosverSac/src/shared/ui/floating-toasts.tsx`
- `RosverSac/src/shared/hooks/use-form-toasts.ts`
- `RosverSac/src/shared/lib/form-validation.ts`
- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/features/account/ui/AccountProfilePage.tsx`
- `RosverSac/src/features/admin-catalog/ui/AdminProductFormPage.tsx`
- `.cursor/rules/10-form-toasts.mdc`
- `.claude/rules/10-form-toasts.md`
- `docs/changes/0080-regla-toasts-validacion-forms.md`

## Cómo verificar

- [ ] `/login` vacío → toasts; sin bubble «Completa este campo»
- [ ] `/registro`, `/contacto`, `/cotizar` (WhatsApp sin datos) → toasts
- [ ] Cuenta / admin producto: guardar vacío → toasts
- [ ] Móvil / tablet / desktop: toasts fijos, form no se alarga
