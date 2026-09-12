# Cambio: Restaurar footer; solo badge libro ancho/bajo

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Se **revirtió** el layout horizontal del footer (0169).
- Vuelve el diseño de 4 columnas (Navegación · Datos empresa · Contacto).
- Solo el badge del Libro de reclamaciones: más **ancho**, menos **alto** (imagen baja y estirada en contenedor blanco).

## Por qué

El pedido «ancho y menos largo» era del badge del libro, no de todo el pie.

## Archivos

- `RosverSac/src/app/layout/Footer.tsx`

## Cómo verificar

- [ ] Footer otra vez en columnas como antes
- [ ] Badge del libro: más ancho y más chato que la versión alta
- [ ] Enlace a `/libro-reclamaciones` OK
