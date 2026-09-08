# 0030 — Quitar selector “Todas” del buscador

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Se eliminó el bloque “Todas ▼” pegado al buscador del header desktop.

## Por qué

Pedido del usuario: simplificar el buscador (solo input + botón buscar).

## Cómo

- Ajuste en `PublicNavbar`: se quitó el `<span>` del selector; el dropdown de categorías del nav rojo no se tocó.

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`

## Cómo verificar

- [ ] Header desktop: buscador sin “Todas”, solo campo + botón rojo
- [ ] _(UI)_ Móvil / tablet / desktop sin regresiones en el header
