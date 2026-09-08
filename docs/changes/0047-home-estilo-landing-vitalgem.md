# Cambio: Home resto de página estilo landing (ref. Vitalgem → Rosver)

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `CategoryCarousel`: cards grandes pastel, bullets, CTA, foto “saliendo”, flechas + autoplay 5s.
- Nuevo `ValueRibbon` (cinta fina de 4 beneficios).
- Nuevo `ProductCarousel` para destacados y tendencia (flechas + autoplay).
- `PromoBanners`: un banner oferta ancho con gradiente suave.
- `HowToBuy`: fila de círculos centrados.
- `IndustrySolutions`: cards pastel claras (no negras).
- `CtaBand` y `ProductCard`: más redondeados / sombra suave.
- Home reordenado: ribbon → categorías → destacados → promo → tendencia → cómo comprar → industrias → CTA.

## Por qué

Se tomó como referencia visual una landing tipo Vitalgem (cards de categoría, ribbon, top picks, promo), adaptada a paleta Rosver (rojo/ink/soft), sin copiar verdes/naranjas de fruta.

## Cómo

Sin librerías nuevas: scroll horizontal nativo + interval. Autoplay pausa en hover / reduced-motion.

## Archivos

- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/ValueRibbon.tsx`
- `RosverSac/src/features/catalog/ui/ProductCarousel.tsx`
- `RosverSac/src/features/catalog/ui/PromoBanners.tsx`
- `RosverSac/src/features/catalog/ui/HowToBuy.tsx`
- `RosverSac/src/features/catalog/ui/IndustrySolutions.tsx`
- `RosverSac/src/features/catalog/ui/CtaBand.tsx`
- `RosverSac/src/features/catalog/ui/TrendingProducts.tsx`
- `RosverSac/src/features/catalog/ui/ProductCard.tsx`
- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0047-home-estilo-landing-vitalgem.md`

## Cómo verificar

- [ ] Home: categorías en cards grandes (no solo círculos chicos), flechas funcionan
- [ ] Banner “Importá más / Pagá mejor” visible
- [ ] Carruseles de productos con flechas; autoplay ~5s
- [ ] Cómo comprar en círculos; industrias en cards claras
- [ ] Móvil / tablet / desktop sin overflow horizontal raro
- [ ] Paleta sigue Rosver (rojo), no verde de la referencia
