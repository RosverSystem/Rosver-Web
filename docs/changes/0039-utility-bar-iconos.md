# Cambio: Barra utility más llamativa con iconos

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- Top bar del `PublicNavbar`: fondo `rosver-ink`, tipografía blanca, acentos rojos.
- Iconos `cssvg-icons`: `Compass` (envíos), `Check` (cotiza), `Message` (cotizar), `Phone` (ayuda).
- Links con hover en pill suave; separadores verticales.

## Por qué

La franja gris clara se veía plana y poco legible; se pedía más presencia visual sin romper el header marketplace.

## Cómo

Contraste alto (negro + rojo + blanco) en lugar de gris sobre gris. Sin borde inferior de la utility (el contraste de color ya separa del bloque logo).

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/changes/0039-utility-bar-iconos.md`

## Cómo verificar

- [ ] Barra superior oscura con iconos rojos a la izquierda y links con icono a la derecha
- [ ] Hover en “Cotizar pedido” / “Ayuda” aclara el fondo
- [ ] En tablet el mensaje “Cotiza sin compromiso” aparece; en sm angosto puede ocultarse
- [ ] Se ve bien en **móvil** (barra oculta &lt;sm), **tablet** y **desktop**
- [ ] Sin librerías nuevas; solo `cssvg-icons` ya instalado
