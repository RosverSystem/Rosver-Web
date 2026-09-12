# Flujo — Auth, sesión y roles

## Superficies

| Quién | Tras login OK | Rutas |
| --- | --- | --- |
| Cliente (`roleCode=client`) | `/cuenta` | `/cuenta`, `/cuenta/perfil`, … |
| Admin (`roleCode=admin`) | `/admin` | SystemRSV |

## Login (password o passwordless)

```
/login → POST /api/auth/login
  → cuenta pending → requiresEmailVerification → modal + OTP email_verify
  → verificado + totp_enabled → requiresTotp → POST /login/totp → sesión
  → verificado sin totp → requiresEmailOtp → POST /login/otp → sesión
```

## Registro (24 h)

```
/registro → pending_registrations (expires 24h) + OTP email_verify
  → POST /verify-email → INSERT users + DELETE pending → sesión
  → si expira → purge automático (cada 15 min)
```

## Recuperación

```
/recuperar → POST /reset-password/start
  → totp_enabled → challenge reset_totp → POST /reset-password/totp → OTP correo
  → sin totp → OTP correo
  → POST /reset-password (código + nueva pass) → revoca sesiones → sesión
```

OTP email: **3 intentos** por código; reenvío permitido.

## Autenticador (perfil)

```
POST /2fa/setup → QR → POST /2fa/enable (código)
POST /2fa/disable (solo código app)
```

## Sesión / RBAC / Google

Sin cambios de modelo de cookie/RBAC. Google OAuth sigue bloqueado sin credenciales.
