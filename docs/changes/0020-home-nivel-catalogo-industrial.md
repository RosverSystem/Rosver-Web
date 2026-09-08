# 0020 — Home a nivel de catálogo industrial (referencia Ferrincorp)

**Fecha:** 2026-09-03
**Tipo:** feature

## Qué cambió

El usuario compartió el Home de un catálogo B2B industrial de referencia (Ferrincorp) y pidió llevar el nuestro al mismo nivel, con marca Rosver, e íconos con animación **de interacción** (no loop, no fade — movimiento al pasar el mouse). Se agregaron 4 secciones nuevas y se enriqueció el Hero y las categorías:

- **`CategoryGrid`**: cada categoría ahora tiene un ícono real (antes era un círculo gris genérico) y pasó de 5 a 8 categorías (+ Iluminación, Limpieza industrial, Materiales de construcción).
- **`HowToBuy`** (nuevo): "Comprar en Rosver es así de fácil" — 4 pasos numerados (Cotizar, Pagar, Despachar, Asesoría), calcado del flujo de compra B2B del modelo.
- **`TrustBadges`** (nuevo): fila de 4 insignias (Compra segura, Factura/boleta, Envíos a todo el Perú, Asesoría técnica) antes del CTA final.
- **`IndustrySolutions`** (nuevo): 4 tarjetas oscuras por rubro (Mantenimiento industrial, Construcción, Minería, Manufactura) — la sección "habla el idioma" del comprador industrial, como en el modelo.
- **`Hero`**: se agregó la mini fila de features bajo los CTA (Stock disponible, Envíos a todo el Perú, Asesoría técnica, Facturación electrónica), igual que el modelo, animada como parte del mismo timeline de entrada.
- **`shared/ui/icons.tsx`**: 18 íconos nuevos (línea, `currentColor`, mismo estilo que los existentes) — Wrench, Bolt, Chip, Home, Shirt, Bulb, Spray, Trowel, ShieldCheck, Gear, Clipboard, Card, Truck, Headset, Receipt, Building, Mountain, Factory. Se exportó también el tipo `IconComponent` para tipar el mapeo categoría → ícono en los mocks.

## Animación de íconos (pedido explícito)

Todos los íconos interactivos usan el mismo patrón: contenedor circular `bg-rosver-soft` que en `hover` (vía `group-hover`, CSS puro — sin GSAP) se desplaza (`-translate-y-1` o `translate-x-1`), rota levemente y cambia a `bg-rosver-red` con ícono blanco, con `transition-all duration-300`. Es una animación que solo ocurre al interactuar, no hay loop ni parpadeo — es exactamente lo que se pidió, y se implementó en CSS (no GSAP) porque para un hover simple es la herramienta correcta según la regla de rendimiento del proyecto (`06-performance`: preferir CSS cuando alcanza).

## Qué NO se copió del modelo (a propósito)

- **Logos de marcas reales** (Shell, Mobil, Sika, Loctite, 3M, Truper): no hay confirmación de que Rosver sea distribuidor autorizado de esas marcas específicas — usar sus logos sin esa confirmación sería una representación falsa. Se omitió esa sección.
- **Banda de campaña con countdown** ("Fiestas Patrias") y las secciones de "Campañas destacadas" por marca (SIKA/TRUPER/LOCTITE/SHELL con banners y grillas propias): requieren fotografía y copy de campaña real específica por marca: no se fabricaron. El mecanismo de banner de campaña (carrusel + slide de temporada) ya existe desde `0016`/`0017` (el slide navideño) y es reutilizable cuando haya una campaña real que cargar.

## Archivos

- `RosverSac/src/shared/ui/icons.tsx`
- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/ui/CategoryGrid.tsx`
- `RosverSac/src/features/catalog/ui/Hero.tsx`
- `RosverSac/src/features/catalog/ui/HowToBuy.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/TrustBadges.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/IndustrySolutions.tsx` (nuevo)
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `.claude/launch.json` (nuevo — config para `preview_start` del dev server)

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] Verificado en el navegador: las 4 secciones nuevas + categorías expandidas renderizan con contenido real, sin errores de consola
- [x] Los 29 SVG de la página tienen contenido real (ningún ícono roto/vacío)
- [ ] **Verificación visual pendiente del usuario:** pasar el mouse sobre los íconos de categorías, pasos, insignias y soluciones — deben moverse/rotar solo al interactuar, sin animación en loop
- [ ] _(UI)_ Confirmar en móvil que las 8 categorías y las 4 tarjetas de industria no rompen el layout (grids ya responsivos: 2/3/4 columnas)
