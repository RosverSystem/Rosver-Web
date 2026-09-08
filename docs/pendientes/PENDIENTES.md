# Pendientes — Rosver Web

Última actualización: 2026-09-08

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P01 | Google OAuth (Client ID + Secret) | Auth completo | bloqueado | Falta credenciales Google Cloud; redirect prod: `/api/auth/google/callback` |
| P02 | Facebook login | UI login/registro | pendiente | Botón placeholder; no pedido aún como OAuth |
| P03 | Pedidos / cotizaciones reales en `/cuenta` | Auth + cuenta | pendiente | Siguen mocks; falta API de pedidos/quotes |
| P04 | UI admin roles/permisos | Auth RBAC | pendiente | API lista; falta pantalla en estilo ERP |
| P10 | CRUD Productos ERP + API | Pedido ERP | pendiente | Listado/categorías/ofertas vacíos (shell colapsable v0.1.7) |
| P13 | ERP perfil solo sidebar + top limpio | Pedido UX refs | hecho | Sidebar colapsable; sin duplicar perfil en top (v0.1.7) |
| P11 | Migrar resto módulos admin al estilo SystemRSV | ERP UX | cancelado | Nav reducida a Inicio+Productos; otros fuera hasta pedido |
| P05 | Recuperación de contraseña | Auth | pendiente | No implementado |
| P06 | Subida foto perfil a R2 | Perfil | hecho | `POST /api/profile/avatar` + `/api/media` (v0.1.4) |
| P07 | 2FA UI en perfil (activar TOTP) | Auth TOTP | pendiente | API `/api/auth/2fa/*` lista; falta pantalla |
| P08 | Header sesión visible | Login UX | hecho | Menú con primer nombre + logout interno (v0.1.2) |
| P09 | CLI `railway` no autenticado en esta máquina | Deploy continuo | pendiente | Deploy vía GraphQL; opcional `railway login` |
| P14 | Auto-deploy GitHub→Railway a veces usa commit viejo | Deploy ERP 0.1.7 | parcial | Forzar `commitSha` en GraphQL si falla |
| P12 | Vars R2 en Railway prod | Avatar upload | hecho | `R2_*` upsert en Rosver-Web (v0.1.4) |

## Hechos recientes (referencia)

- Auth API + deploy Railway unificado web+api
- SMTP Hostinger configurado en Railway
- Seed admin + cliente
- Header sesión visible (v0.1.2)
- Shell ERP SystemRSV (sidebar + top bar) + Productos vacío (v0.1.3)
- Cuenta: pedidos/cotizaciones con fotos + avatar R2 (v0.1.4)
- ERP SaaS soft: Inicio + Productos (listado/categorías/ofertas) (v0.1.5)
- Banner área cliente (v0.1.6)
- ERP sidebar colapsable + perfil único (v0.1.7)

