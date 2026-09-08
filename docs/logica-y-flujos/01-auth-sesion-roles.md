# Flujo — Auth, sesión y roles

## Superficies

| Quién | Tras login OK | Rutas |
| --- | --- | --- |
| Cliente (`roleCode=client`) | `/cuenta` | `/cuenta`, `/cuenta/perfil`, … |
| Admin (`roleCode=admin`) | `/admin` | SystemRSV; sin acceso cliente obligatorio |

## Login email/password

```
/login → POST /api/auth/login
  → requiresEmailVerification → OTP email → sesión → redirect
  → requiresTotp → código autenticador → sesión → redirect
  → ok → cookie rosver_session → redirect por rol
```

## Registro

```
/registro → validación UI → confirm teléfono → POST /api/auth/register
  → OTP email_verify → POST /api/auth/verify-email → sesión → /cuenta
```

## Sesión en UI

- Cookie httpOnly `rosver_session` (misma origen web+api en Railway).
- `AuthProvider` carga `GET /api/auth/me` al montar.
- Header público: si `user` → avatar + nombre + link `/cuenta` (admin también ve link ERP).
- Logout: `POST /api/auth/logout` + limpiar estado.

## RBAC

- Roles base: `admin`, `client` (sistema).
- Permisos: `module.action` generados por módulo.
- Guards: `RequireAuth`, `RequireAdmin`.

## Google OAuth

```
GET /api/auth/google/start → Google → /api/auth/google/callback → sesión → redirect
```

Bloqueado hasta `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
