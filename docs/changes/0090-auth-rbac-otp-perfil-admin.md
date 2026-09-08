# Cambio: Auth real — RBAC, OTP, Google stub, perfil, admin

**Fecha:** 2026-09-08  
**Tipo:** feature

## Qué cambió

- API Hono (`RosverSac/server`) con Postgres: roles, permisos por módulo/acción, sesiones httpOnly, OTP email, TOTP 2FA, OAuth Google (requiere credenciales).
- Migración `001_auth_rbac.sql` + seed: roles `admin` / `client`, módulos con permisos generados, usuarios de prueba.
- Front: `AuthProvider`, login/registro cableados, verificación OTP, perfil con avatar default, `/admin` protegido (vista blanca SystemRSV).
- Avatares default SVG en `/public/avatars/`.
- Proxy Vite `/api` → `:8787`.

## Usuarios seed (cambiar en producción)

| Rol | Correo | Password (local seed) |
| --- | --- | --- |
| admin | `admin@multiserviciosmta.site` | `RosverAdmin!2026` |
| client | `acosta.wp076@gmail.com` | `RosverCliente!2026` |

## Pendiente del usuario

- `SMTP_PASS` del correo Hostinger (OTP reales)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (+ redirect URI)
- Deploy del servicio API en Railway

## Archivos

- `RosverSac/server/**`
- `RosverSac/src/features/auth/**`
- `RosverSac/src/features/account/ui/AccountProfilePage.tsx`
- `RosverSac/src/app/App.tsx`, `AdminDashboardPage.tsx`
- `RosverSac/public/avatars/*`
- `docs/features/auth.md`, `docs/architecture/04`, `08`

## Cómo verificar

- [ ] `npm run db:setup` + `npm run dev:api` + `npm run dev`
- [ ] Login admin → `/admin` blanco
- [ ] Login cliente → `/cuenta/perfil`
- [ ] Registro nuevo → OTP en consola API (sin SMTP_PASS) → verifica → sesión
- [ ] Google sin keys → 501 / mensaje claro
- [ ] Móvil / tablet / desktop en login, registro, perfil, admin
