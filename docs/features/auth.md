# Feature: Auth (login / registro)

**Slug:** `features/auth/`  
**Estado:** activa (diseño visual; sin sesión real)

## Propósito

Acceso y alta de cuenta comercial para clientes (pedidos, cotizaciones, datos de entrega). Staff usará el mismo shell en fase lógica con roles.

## Alcance

- Incluido: UI `/login` y `/registro` a pantalla completa (`AuthLayout`), stubs de login social.
- Registro: validación propia (sin bubbles nativos), teléfono obligatorio, requisitos de contraseña, modal de confirmación de número → luego mock a `/cuenta`.
- Fuera de alcance: API, JWT, roles reales, recuperación de contraseña, OAuth.

## API pública

Exports desde `@/features/auth`:

| Export | Tipo | Descripción |
| --- | --- | --- |
| `LoginPage` | componente | Vista login full-bleed |
| `RegisterPage` | componente | Vista registro full-bleed |

## Dependencias

- `shared/`: `prefersReducedMotion`, `IconFacebook`
- `cssvg-icons`: `Check` (beneficios en registro)
- Shell: `AuthLayout` en `app/layout/`
- Otras features: ninguna

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/login` | `LoginPage` | Ilustración `login-hero-rosver.webp` + form; submit → `/cuenta` |
| `/registro` | `RegisterPage` | Ilustración + form; validación custom; modal confirma teléfono → `/cuenta` |

## Flujos

`03-vistas-y-flujos.md` — auth previo a pedido (B) cuando no hay sesión.

## Verificación

- [x] `/login` y `/registro` sin navbar/footer marketplace
- [x] Desktop: split ilustración + form
- [x] Móvil: solo form
- [x] Enlaces cruzados login ↔ registro; cotizar sin cuenta desde registro
- [x] Registro: errores propios, password rules, teléfono obligatorio + modal confirmación
- [x] Password: checklist al teclear + barra Baja/Media/Segura en idle
- [x] Errores flotantes (toasts) sin alargar el layout del form
- [ ] Persistencia de sesión / API (fase lógica)
