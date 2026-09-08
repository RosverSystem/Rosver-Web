# 0015 — Medidas de banner hero para Canva (docs, sin código)

**Fecha:** 2026-08-27
**Tipo:** docs

## Qué cambió

- Nuevo documento [`docs/architecture/06-banners-hero-y-assets.md`](../architecture/06-banners-hero-y-assets.md): especifica las 3 medidas de canvas para diseñar el banner hero en Canva (móvil 750×1000, tablet 1024×768, desktop 1920×600), zona segura, formato/peso objetivo (WebP, acotado por la regla de rendimiento `06-performance`), y el patrón de la fila de marcas/categorías debajo del banner.
- `docs/README.md` actualizado para enlazar el nuevo doc.

## Por qué

El usuario mostró dos referencias (Grupo Shinán, Chamo Import) y pidió que el hero de Home sea un banner de impacto visual completo en desktop, con una fila de marcas relacionadas debajo — y pidió las medidas para diseñarlo en Canva (3 versiones: móvil/tablet/desktop) antes de tocar código.

## Cómo

- Se comparó explícitamente ambas referencias: se recomienda **no** quemar el titular/CTA dentro de la imagen (como Grupo Shinán) — se pierde accesibilidad, SEO y la animación GSAP que ya existe en `Hero.tsx`. Se sigue el patrón de Chamo Import: imagen de impacto + texto/CTA reales en HTML encima.
- Las medidas parten de necesidades reales de recorte: móvil vertical (3:4) porque una foto panorámica se ve mal aplastada en una pantalla angosta; tablet más cuadrada (4:3); desktop panorámica (~3.2:1) para el efecto full-bleed.
- Queda pendiente confirmar con el cliente si la fila "de marcas" son marcas/distribuidoras reales o categorías propias — no bloquea el diseño del banner, solo cambia qué logos van en esa fila.
- **No se tocó código todavía** — es la fase de preparar los assets antes de implementar el banner full-bleed (que sí requiere cambiar el layout de `Hero.tsx`, documentado como referencia técnica en el mismo doc, §3).

## Archivos

- `docs/architecture/06-banners-hero-y-assets.md`
- `docs/README.md`

## Cómo verificar

- [ ] Diseñar los 3 banners en Canva siguiendo las medidas y la zona segura del documento
- [ ] Confirmar con el cliente si la fila de logos debajo del banner son marcas de terceros o categorías propias
- [ ] Exportar en WebP dentro del peso objetivo de cada breakpoint y entregar los 3 archivos para implementarlos
