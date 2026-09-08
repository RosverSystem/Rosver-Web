# Cambio: Quitar línea blanca entre nav roja y hero Home

**Fecha:** 2026-09-07  
**Tipo:** fix

## Qué cambió

- En `/`, el `PublicNavbar` ya no usa `border-b border-rosver-line`.
- En el resto de rutas públicas el borde inferior del header se mantiene para separar del contenido blanco.

## Por qué

La barra de categorías y el `HeroWaveSlider` son ambos `bg-rosver-red`; el borde gris del header dibujaba una franja blanca entre ambos y se veía como un corte raro.

## Cómo

Diseño **bloque rojo continuo** en Home (nav + hero sin costura). Alternativas descartadas: sombra bajo el nav (sigue separando), o `margin` negativo (parche frágil).

## Archivos

- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `docs/changes/0038-linea-blanca-nav-hero-home.md`

## Cómo verificar

- [ ] En `/` (desktop ≥1024px) no hay línea blanca entre “Ver categorías / Inicio…” y el hero rojo
- [ ] En `/catalogo` (u otra ruta) el header sigue teniendo borde inferior limpio sobre fondo blanco
- [ ] Se ve bien en **móvil**, **tablet** y **desktop**
- [ ] Sin impacto de rendimiento
