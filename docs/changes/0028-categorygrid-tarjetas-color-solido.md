# Cambio: CategoryGrid — tarjetas de color sólido con ícono de marca de agua

**Fecha:** 2026-09-04
**Tipo:** fix

## Qué cambió

`CategoryGrid.tsx` pasó de tarjetas blancas con borde fino + círculo gris (versión de `0027`) a tarjetas de **color sólido alternado** (rojo/negro, sin borde ni fondo blanco): ícono grande semitransparente como marca de agua de fondo, ícono chico en badge translúcido arriba, nombre de la categoría y "Ver productos →" abajo, con hover que levanta la tarjeta y anima el ícono de fondo.

## Por qué

El usuario marcó explícitamente que el modelo anterior (tarjetas blancas con círculo gris) "se ve feo" y pidió un diseño distinto — tercera iteración de esta sección en la sesión. Se buscó un resultado visualmente más vistoso y con más carácter de marca (rojo/negro sólido) sin repetir los patrones ya descartados (tarjeta oscura + glow difuminado, bordes neo-brutalistas).

## Cómo

- Sin blur ni glow (para no repetir el patrón prohibido en memoria): el "ícono de marca de agua" es un ícono grande con opacidad baja (`text-white/10`), no un círculo difuminado.
- Alternancia simple `i % 2` (par = negro, impar = rojo) en vez de cada 3ra tarjeta, para que el ritmo de color sea más parejo en una grilla de 8.
- Se mantiene la animación de entrada por `IntersectionObserver` (sin cambios de esa lógica, solo la apariencia de la tarjeta).

## Archivos

- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores.
- [x] Tarjetas alternan negro/rojo con ícono de fondo grande y contenido legible.
- [x] _(UI)_ Verificado en móvil (375px) y desktop — 2 columnas en móvil, 4 en desktop, sin overflow.
