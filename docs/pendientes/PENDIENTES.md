# Pendientes — Rosver Web

Última actualización: 2026-09-08

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P01 | Google OAuth (Client ID + Secret) | Auth completo | bloqueado | Falta credenciales Google Cloud; redirect prod: `/api/auth/google/callback` |
| P02 | Facebook login | UI login/registro | pendiente | Botón placeholder; no pedido aún como OAuth |
| P03 | Pedidos / cotizaciones reales en `/cuenta` | Auth + cuenta | pendiente | Siguen mocks; falta API de pedidos/quotes |
| P04 | UI admin roles/permisos | Auth RBAC | pendiente | API `/api/admin/roles` lista; panel SystemRSV en blanco |
| P05 | Recuperación de contraseña | Auth | pendiente | No implementado |
| P06 | Subida foto perfil a R2 | Perfil | pendiente | Solo avatares SVG default |
| P07 | 2FA UI en perfil (activar TOTP) | Auth TOTP | pendiente | API `/api/auth/2fa/*` lista; falta pantalla |
| P08 | Header sesión visible | Login UX | hecho | `SessionAccountMenu` en navbar/footer; avatar + nombre + menú |
| P09 | CLI `railway` no autenticado en esta máquina | Deploy continuo | pendiente | Push GitHub OK; deploy vía GraphQL `serviceInstanceDeploy`. Opcional: `railway login` |

## Hechos recientes (referencia)

- Auth API + deploy Railway unificado web+api
- SMTP Hostinger configurado en Railway
- Seed admin + cliente
- Header sesión visible (v0.1.1 / commit `55538bc`)

