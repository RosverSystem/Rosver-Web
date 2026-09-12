# Cambio: Logo Rosver + título pestaña System

**Fecha:** 2026-09-10  
**Tipo:** chore

## Qué cambió

- Sidebar admin: quita círculo «SR» + texto SystemRSV; usa `/Logo_Vertical.png` + texto **System**.
- Título de pestaña en `/admin`: **System** (antes SystemRSV).

## Por qué

Marca propia en el ERP; el nombre corto «System» en la pestaña del navegador.

## Cómo

`AdminSidebar` + `DocumentTitle` (`ERP_TITLE`).

## Archivos

- `RosverSac/src/app/layout/admin/AdminSidebar.tsx`
- `RosverSac/src/app/providers/DocumentTitle.tsx`
- `docs/changes/0210-admin-logo-titulo-system.md`

## Cómo verificar

- [ ] En `/admin` la pestaña dice **System**
- [ ] Sidebar muestra el logo Rosver + «System»
- [ ] Clic en logo vuelve a `/admin`
