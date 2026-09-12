# Cambio: FAQ contacto limpio Rosver (sin neo-brutal)

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- FAQ sin borde grueso ni sombra offset (estilo distinto al de la referencia Meta).
- Cards suaves Rosver (`rounded-xl`, `border-rosver-line`, acento rojo al abrir).
- Se mantiene animación GSAP de altura/opacity.

## Por qué

Rosa: el fondo/contorno se veía igual al de Meta; pedía otro estilo.

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`

## Cómo verificar

- [ ] FAQ sin sombra roja offset ni borde 3px ink
- [ ] Abrir/cerrar con GSAP
- [ ] _(UI)_ Móvil / tablet / desktop
