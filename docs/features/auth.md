# Feature: Auth (login / registro / sesión)

**Slug:** `features/auth/`  
**Estado:** lógica OTP + autenticador + pending 24h (v0.1.43)

## Propósito

Acceso seguro a cuenta cliente y ERP SystemRSV: registro con verificación 24 h, login con/sin contraseña, OTP email o autenticador (Google/Microsoft), recuperación, sesión httpOnly, RBAC.

## Alcance

- Incluido: passwordless, TOTP vs email OTP, `pending_registrations` + purge, modal verificación, 2FA en perfil, reset con TOTP-first, sin Facebook.
- Parcial: Google OAuth (faltan Client ID/Secret).
- Fuera: UI admin de roles.

## Flujos clave

1. **Registro** → `pending_registrations` + OTP → verify → `users`.
2. **Login** → password o passwordless → TOTP si vinculado, si no OTP correo.
3. **No verificado** → puede “entrar” pero modal obligatorio + OTP.
4. **Perfil** → vincular/desvincular autenticador (desvincular = código app).

## Cómo verificar

- [ ] Ver checklist en `docs/changes/0144-auth-otp-authenticator-passwordless-pending.md`
