# Cambio: Scrollbar alineado al estilo marketplace Rosver

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- Scrollbar 6px, track transparente (sin franja blanca).
- Thumb en `rosver-muted`; hover `rosver-red`; active `rosver-red-dark`.
- Eliminado el estilo semitransparente/`color-mix` que no encajaba con el UI.

## Por qué

El diseño anterior no conjugaba con el marketplace (rojo / ink / muted): se veía ajeno al resto del chrome.

## Cómo

Misma lógica de acentos del sitio: neutro en reposo, rojo solo al interactuar. Un solo bloque CSS (sin duplicar `html` + `*`).

## Archivos

- `RosverSac/src/styles/global.css`
- `docs/changes/0041-scrollbar-estilo-marketplace.md`

## Cómo verificar

- [ ] Thumb gris muted fino; al hover pasa a rojo Rosver
- [ ] Sin canaleta blanca al costado del hero
- [ ] Coincide visualmente con tipografía/muted del header
- [ ] Móvil / tablet / desktop OK
