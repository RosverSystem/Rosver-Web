# Cambio: Hero Contacto estilo Memphis (mismo patrón que cotizar/carrito)

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- `ContactHero` pasa al banner Memphis (rayas, puntos, título neo-brutal) como cotizar/carrito.
- Se mantiene el ancho de la página contacto: `max-w-6xl`.

## Por qué

El hero suave con barra fina no coincidía con el resto de vistas públicas.

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `docs/changes/0075-contacto-hero-memphis.md`

## Cómo verificar

- [ ] `/contacto`: banner con rayas laterales + título en caja
- [ ] Contenido debajo sigue en `max-w-6xl`
- [ ] Móvil / tablet / desktop OK
