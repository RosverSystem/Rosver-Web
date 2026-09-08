# Cambio: sesión visible en header + pendientes y lógica

**Fecha:** 2026-09-08  
**Tipo:** feature | fix | docs  
**Versión:** 0.1.1  
**Deploy:** Railway `Rosver-Web` → https://rosver-web-production.up.railway.app

## Qué cambió

- Header/footer muestran sesión real: avatar, nombre corto, menú (cuenta, perfil, admin, logout) vía `SessionAccountMenu`.
- Área `/cuenta`: saludo con usuario, botón cerrar sesión, aviso de mocks en pedidos/cotizaciones.
- Admin shell usa usuario real (no “Ana Torres”) y logout vía API.
- Regla `12-pendientes-recomendaciones` (Cursor + Claude).
- Carpeta `docs/pendientes/` (PENDIENTES + RECOMENDACIONES).
- Carpeta `docs/logica-y-flujos/` (auth + cuenta).

## Por qué

Con sesión activa el navbar seguía apuntando a `/login` con “Mi cuenta” genérico. Faltaba un registro vivo de deudas y de lógica de flujos.

## Cómo

- `useAuth()` en layout público; menú con click-outside.
- Docs vivos separados de `changes/` (historial) y `architecture/` (producto).

## Archivos

- `RosverSac/src/features/auth/ui/SessionAccountMenu.tsx`
- `RosverSac/src/app/layout/PublicNavbar.tsx`, `Footer.tsx`, `AdminShell.tsx`
- `RosverSac/src/features/account/ui/AccountLayout.tsx`, `AccountOverviewPage.tsx`
- `.cursor/rules/12-pendientes-recomendaciones.mdc` + espejo Claude
- `docs/pendientes/*`, `docs/logica-y-flujos/*`
- `AGENTS.md`, `CLAUDE.md`, `docs/README.md`

## Cómo verificar

- [ ] Login cliente → header muestra avatar + nombre (no “Mi cuenta” genérico)
- [ ] Menú → Mi cuenta / Perfil / Cerrar sesión
- [ ] `/cuenta` saluda con nombre/email; logout vuelve a login
- [ ] Visitante sigue viendo link a login
- [ ] Móvil: drawer muestra bloque de sesión
- [ ] Tablet / desktop: menú desktop visible
- [ ] `docs/pendientes/PENDIENTES.md` listado actualizado
- [ ] URL producción responde tras deploy
