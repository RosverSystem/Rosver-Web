# Cambio: Paleta oficial Rosver como regla de diseño

**Fecha:** 2026-09-07  
**Tipo:** docs | chore

## Qué cambió

- Tokens en `global.css`: ink `#0D0D0D`, red-dark `#90040D`, + `rosver-blue`, `rosver-yellow`, `rosver-success`.
- Regla `09-paleta-colores` (Cursor + Claude) + doc `docs/architecture/06-paleta-colores.md`.
- UI alineada: badges oferta (amarillo), stock/éxito (verde), destacado/B2B (azul), CTAs primarios rojo.
- `Badge`, estrellas, footer WhatsApp, cotizar éxito usan tokens / excepción WA.

## Por qué

La guía de marca define la paleta; debe ser **regla**, no sugerencia.

## Archivos

- `RosverSac/src/styles/global.css`
- `.cursor/rules/09-paleta-colores.mdc`
- `.claude/rules/09-paleta-colores.md`
- `docs/architecture/06-paleta-colores.md`
- `docs/architecture/04-stack-y-librerias.md`
- `AGENTS.md`, `CLAUDE.md`, reglas `00-workspace-core`
- Cards/ficha/ofertas/contacto/quotes/badge/footer (aplicación)
- `docs/changes/0071-paleta-oficial-rosver.md`

## Cómo verificar

- [ ] Tailwind reconoce `bg-rosver-blue`, `bg-rosver-yellow`, `bg-rosver-success`
- [ ] `/catalogo`: badge ¡Oferta! amarillo; Destacado azul; CTA rojo
- [ ] Ficha: stock verde; mayorista azul; agregar rojo
- [ ] Hover rojo más oscuro (`#90040D`)
