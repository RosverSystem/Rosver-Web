# 0017 — Slide navideño reconstruido en capas desde frames de Canva

**Fecha:** 2026-08-27
**Tipo:** feature

## Qué cambió

- Corrección sobre `0016`: la "página 1" del Canva (`DAHTeOTwM5M`) **no era un error** — es una referencia intencional del usuario (captura de la tabla de medidas). Se actualizó `docs/architecture/06-banners-hero-y-assets.md` para reflejarlo.
- Se construyó la **página 3** del mismo Canva como el frame inicial de una animación de scroll: los 10 elementos de la página 2 ("Super ofertas navideñas"), reposicionados fuera del lienzo en la dirección desde la que deben entrar. Se leyó la estructura exacta de la página 2 (posición, tamaño, rotación, color, fuente de cada elemento) para poder replicarla.
- Nuevo `features/catalog/ui/HeroCampaignChristmas.tsx`: el slide de campaña en **desktop** (`lg:`) dejó de ser una imagen plana — ahora son 10 capas reales (4 imágenes, 2 formas, 4 textos) animadas con GSAP desde las coordenadas de la página 3 hasta las de la página 2. En móvil/tablet sigue la imagen plana (no hay frames a esas medidas todavía).
- Nuevos assets: `public/banners/assets/deco-blob.png`, `deco-tree.png`, `deco-stocking.png`, `deco-gifts.png` — las 4 ilustraciones de Canva extraídas como PNG transparentes independientes.

## Por qué

El usuario aclaró que quería que la animación se construyera **en Canva, desde la página 3 en adelante**, como frames de una animación de scroll — no una sola imagen con crossfade. Se leyó la página 2 con las herramientas de Canva conectadas para obtener las coordenadas exactas de cada elemento (texto, imágenes, formas), y se replicó esa composición en la página 3 con cada pieza fuera de cuadro, dando así los dos extremos (inicio/fin) que necesita una animación de scroll con GSAP.

## Cómo se extrajeron las ilustraciones (limitación real encontrada)

Canva Free no permite exportar PNG con fondo transparente (`export-design` devolvió el error explícito). Alternativa aplicada:
1. Se armó una página temporal con las 4 ilustraciones lado a lado sobre fondo magenta (`#ff00ff`, un color que no aparece en ninguna de las 4 — verde del árbol, rojo/beige de regalos y media, tostado del blob).
2. Se exportó esa página como PNG normal (sin transparencia).
3. Un script local (Node, sin dependencias — parser/encoder de PNG manual, no quedó en el repo) decodificó el PNG, aplicó una clave de color con rampa suave (no un corte binario) para evitar el fleco magenta en los bordes antialiased, y recortó cada ilustración a su propio archivo RGBA.
4. Verificado visualmente cada recorte antes de usarlo — el primer intento con corte binario dejó un borde magenta visible en `deco-gifts.png`; se corrigió con la rampa de distancia de color + de-spill de canal.

## Cómo (implementación en el sitio)

- `HeroCampaignChristmas` posiciona cada capa en `%` (relativo a un lienzo de referencia 1920×600, igual a las medidas del Canva) y usa `container-type: inline-size` + `cqw` para el tamaño de fuente — así todo escala junto con el ancho real del carrusel sin recalcular nada a mano.
- Cada capa anima con `gsap.fromTo(el, boxStyleDesde, { ...boxStyleHasta, duration, delay escalonado })`, disparado una sola vez cuando el slide se vuelve activo (`useGSAP` con `dependencies: [active]` + un ref `played` para no repetir la entrada si el carrusel vuelve a pasar por este slide).
- El badge "cuotas sin interés" usa el **path SVG real** de la forma de estrella de Canva (no una aproximación con `border-radius`) — se leyó directo del diseño.
- `prefers-reduced-motion`: salta directo al estado final (`gsap.set` en vez de `fromTo`).
- Verificado en el navegador a 1440px: la versión en capas se muestra (`lg:`) y la imagen plana se oculta; a 375px es al revés. Las posiciones iniciales de cada capa (`top`/`left`/`width` en `%`) se comprobaron matemáticamente exactas contra las coordenadas de Canva (ej. blob: `left: 1920/1920 = 100%` ✓, árbol: `top: 650/600 = 108.33%` ✓).

## Pendiente / limpieza

- El Canva `DAHTeOTwM5M` quedó con **2 páginas de trabajo temporales** (4 y 5, fondo magenta) usadas solo para extraer las ilustraciones — la API no tiene una operación para borrar páginas, así que quedan ahí hasta que el usuario las borre manualmente desde Canva.
- Sigue pendiente: versiones móvil/tablet de este mismo slide (hoy usan la imagen plana única, ver `06-banners-hero-y-assets.md` §5).
- El script de extracción de assets no se guardó en el repo (fue una utilidad de una sola vez); si se necesita extraer más ilustraciones de Canva en el futuro, se puede rehacer con la misma técnica (página compuesta + chroma key magenta + rampa de distancia de color).

## Archivos

- `RosverSac/src/features/catalog/ui/HeroCampaignChristmas.tsx`
- `RosverSac/src/features/catalog/ui/HeroCarousel.tsx`
- `RosverSac/public/banners/assets/deco-blob.png`
- `RosverSac/public/banners/assets/deco-tree.png`
- `RosverSac/public/banners/assets/deco-stocking.png`
- `RosverSac/public/banners/assets/deco-gifts.png`
- `docs/architecture/06-banners-hero-y-assets.md`
- Canva `DAHTeOTwM5M`: página 3 (nueva, frame inicial), páginas 4-5 (nuevas, temporales de extracción)

## Cómo verificar

- [x] `npm run lint` y `npm run build` sin errores
- [x] A 1440px se ve la versión en capas (`hidden lg:block` visible); a 375px se ve la imagen plana (`lg:hidden` visible)
- [x] Posiciones iniciales de las 4 capas de imagen verificadas exactas en `%` contra las coordenadas de Canva
- [x] Las 4 ilustraciones extraídas revisadas visualmente sin fleco de color de fondo
- [ ] **Verificación visual pendiente del usuario:** `npm run dev` → `/` en desktop, esperar a que el carrusel llegue al slide navideño (o hacer clic en el segundo punto) y confirmar que cada pieza entra desde su dirección y encaja en el lugar exacto del diseño de la página 2
- [ ] Borrar manualmente las páginas 4 y 5 del Canva si no se quieren conservar
