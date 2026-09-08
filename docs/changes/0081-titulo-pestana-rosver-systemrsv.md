# Cambio: Título de pestaña Rosver SAC / SystemRSV

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Pestaña del navegador: **Rosver SAC** en toda la web pública (catálogo, auth, cuenta).
- En rutas `/admin/*` (ERP): **SystemRSV**.
- `DocumentTitle` escucha `pathname` y actualiza `document.title`.
- `index.html` default: `Rosver SAC`.

## Por qué

Separar marca comercial (web) de marca del sistema de gestión (ERP) en la pestaña.

## Archivos

- `RosverSac/src/app/providers/DocumentTitle.tsx`
- `RosverSac/src/app/App.tsx`
- `RosverSac/index.html`
- `docs/changes/0081-titulo-pestana-rosver-systemrsv.md`

## Cómo verificar

- [ ] `/`, `/catalogo`, `/login`, `/cuenta` → pestaña «Rosver SAC»
- [ ] `/admin`, `/admin/productos` → pestaña «SystemRSV»
- [ ] Navegar público ↔ admin cambia el título sin recargar
