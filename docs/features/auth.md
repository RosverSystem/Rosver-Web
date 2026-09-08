# Feature: Auth (login / registro / sesión)

**Slug:** `features/auth/`  
**Estado:** lógica inicial (API + UI cableada)

## Propósito

Acceso seguro a cuenta cliente y ERP SystemRSV: registro, login, OTP email, 2FA TOTP, Google OAuth, sesión httpOnly, RBAC por módulos.

## Alcance

- Incluido: API `/api/auth/*`, `/api/profile`, `/api/admin` (roles/permisos/módulos), login/registro UI, OTP verify, perfil con avatar, guardas `RequireAuth` / `RequireAdmin`, seed admin/cliente.
- Parcial: Google OAuth (código listo; faltan Client ID/Secret), SMTP real (falta `SMTP_PASS` Hostinger).
- Fuera: Facebook login, recuperación de contraseña completa, UI admin de roles.

## API pública (`@/features/auth`)

| Export | Tipo |
| --- | --- |
| `LoginPage` / `RegisterPage` | UI |
| `AuthProvider` / `useAuth` | sesión |
| `RequireAuth` / `RequireAdmin` | rutas |
| `OtpVerifyPanel` | UI OTP |

## Backend

`RosverSac/server` — Hono + Postgres. Regla: cada módulo genera permisos `module.action`. Roles base: `admin`, `client` (personalizables vía API).

## Cómo verificar

- [ ] `npm run db:setup` · `npm run dev:api` · `npm run dev`
- [ ] Admin → `/admin` · Cliente → `/cuenta/perfil`
- [ ] Registro → OTP (consola API sin SMTP) → sesión
