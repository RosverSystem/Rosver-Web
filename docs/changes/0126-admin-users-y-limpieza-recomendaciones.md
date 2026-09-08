# Cambio: Admin — gestión real de usuarios (R20) + limpieza de recomendaciones

**Fecha:** 2026-09-08
**Tipo:** feature

## Qué cambió

Primera tanda de `docs/pendientes/RECOMENDACIONES.md` tras la auditoría E2E (0125), con R21 (Pedidos/Leads/Cotizaciones reales) explícitamente diferida por el usuario.

1. **R20 — `admin.users` real (listar / cambiar rol / activar-desactivar).** Antes `AdminUsersPage` era un wireframe (`WireBlock`) con datos mock (`USERS`) sin persistencia. Ahora:
   - Backend nuevo `server/src/routes/admin-users.ts`: `GET /api/admin/users` (join `users`+`roles`), `PATCH /api/admin/users/:id` (`roleId` y/o `status`).
   - Protecciones: un admin no puede desactivarse a sí mismo ni quitarse el rol de administrador a sí mismo (400 controlado); al desactivar un usuario se revocan todas sus sesiones activas (`revokeAllSessionsForUser`, reusa lo de recuperación de contraseña).
   - Frontend: `AdminUsersPage.tsx` reescrita (fetch real a `/api/admin/users` + `/api/admin/roles`, `AdminSelect` para el rol, botón activar/desactivar con `window.confirm`, buscador local). Se eliminó `admin-users/model/mocks.ts`.
   - Ruta `/admin/usuarios` + entrada "Usuarios" en el sidebar (`admin-nav.ts`, ícono `Group` de `cssvg-icons`).
2. **R23 — datos de prueba en catálogo público.** Se revisó `/catalogo` y se confirmó qué filas eran basura de pruebas manuales previas (productos "fsfds"/"test"/"asdasd", unidad "asdas", marca "TEST"); se borraron de Postgres.
3. **R22 — investigado, bloqueado.** `@types/nodemailer` en `8.0.1` ya es la versión más reciente publicada (`npm view @types/nodemailer versions`); no hay nada más nuevo que instalar. No es un problema de código: el proyecto ya typechequea limpio con esa versión.

## Por qué

Pedido explícito del usuario tras la auditoría: **"realiza las recomendaciones"**. Al preguntar el alcance de R21 (Pedidos/Leads/Cotizaciones reales, la más grande), el usuario eligió explícitamente **dejarla fuera de esta pasada** ("Dejarla fuera por ahora (recomendado)"), así que se excluye aquí y sigue como pendiente (P53) para una conversación de producto aparte. R19 (credenciales SMTP reales) tampoco es accionable por código — requiere acceso del usuario a su proveedor SMTP.

## Cómo

- Sin migración SQL: `users.status` y `role_id` ya existían desde `001_auth_rbac.sql`; el permiso `admin.users` ya estaba sembrado (`seed.ts`). Solo faltaban rutas + UI.
- Se probó de punta a punta contra la Postgres real de Railway con dos cuentas de prueba desechables (creadas directo en DB con `argon2`, contraseñas inventadas por el auditor, nunca impresas en texto — mismo patrón que 0125): una admin de prueba para UI y login, y una cliente de prueba para el ciclo desactivar→login bloqueado (403)→reactivar→login OK. Ambas borradas al cerrar.
- Se encontró y corrigió en el mismo cambio una validación muerta: el primer borrador de `PATCH /users/:id` intentaba bloquear "dejar sin administradores" comparando contra otros admins distintos al actor, pero como la ruta ya exige que el actor sea admin (`requireRole('admin')`) y el auto-bloqueo ya se maneja aparte, esa rama nunca podía dispararse. Se quitó en vez de dejar código muerto.
- Se reusó `revokeAllSessionsForUser` (ya existente desde recuperación de contraseña) para cerrar sesión a quien se desactiva.

## Archivos

- `RosverSac/server/src/routes/admin-users.ts` (nuevo)
- `RosverSac/server/src/index.ts` (monta la ruta)
- `RosverSac/src/features/admin-users/ui/AdminUsersPage.tsx` (reescrita)
- `RosverSac/src/features/admin-users/model/mocks.ts` (eliminado)
- `RosverSac/src/app/App.tsx` (ruta `/admin/usuarios`)
- `RosverSac/src/app/layout/admin/admin-nav.ts` (entrada de sidebar + título de página)
- `docs/pendientes/PENDIENTES.md`, `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [x] `npm run lint`, `npm run typecheck:server`, `npm run build` sin errores.
- [x] `/admin/usuarios` lista usuarios reales (join con `roles`).
- [x] Cambiar el rol de un usuario en el select dispara `PATCH` y persiste (probado con reversión inmediata sobre una cuenta real de cliente).
- [x] Desactivar un usuario → intento de login devuelve 403 "Cuenta deshabilitada"; reactivar → login vuelve a funcionar.
- [x] Un admin no puede desactivarse ni quitarse el rol de administrador a sí mismo (botón deshabilitado en UI + 400 si se fuerza por API).
- [x] _(UI)_ Verificado en **móvil** (375px), **tablet** (768px) y **desktop**: tabla con scroll horizontal contenido (no rompe el layout de página), mismo patrón que el resto del ERP.

## Pendiente

- R21 (Pedidos/Leads/Cotizaciones reales) sigue fuera de alcance — decisión explícita del usuario, ver P53.
- R19 (SMTP real) sigue bloqueado — requiere credenciales del proveedor del usuario.
- R22 (versión `@types/nodemailer`) bloqueado upstream, sin acción posible hoy.
- Continúa la pasada de recomendaciones: R18, R02, R06, R11, R03, R12, R07 (R09/R10 de menor prioridad).
