# Cambio: Footer ancho y bajo

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Footer reorganizado en filas horizontales (marca/redes/libro → nav en línea → empresa+contacto).
- Contenedor más ancho (`max-w-[90rem]`), menos padding vertical.
- Libro de reclamaciones compacto en horizontal (sigue visible).

## Por qué

Pedido: pie más ancho y menos alto.

## Archivos

- `RosverSac/src/app/layout/Footer.tsx`

## Cómo verificar

- [ ] Desktop: footer bajo, contenido en filas
- [ ] Móvil: apila sin overflow horizontal
- [ ] Libro de reclamaciones y WhatsApp siguen clicables
