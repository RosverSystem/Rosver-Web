# Cambio: Home estilo Katrina (categorías + mayoristas + campaña)

**Fecha:** 2026-09-13  
**Tipo:** feature

## Qué cambió

- Home limpio: solo **hero multipanel** + 3 secciones nuevas (paleta Rosver).
- **Busca por categoría.** — cards lifestyle full-bleed «lo último EN …».
- **Los más cotizados por mayoristas** — cards TOP + precio x mayor + CTA.
- **Lo último de campaña.** — grid bento (antes referencia «Pantalones») + barra «¡Ver todo!».
- Retirados del home: BrandCarousel, ValueRibbon, PromoBanners, HowToBuy, IndustrySolutions, CtaBand, Destacados genéricos.
- Versión `0.1.53`.

## Por qué

Rosa pidió actualizar el home a ese estilo y que «pantalones» pase a ser la campaña Rosver; eliminar el resto.

## Archivos

- `RosverSac/src/features/catalog/ui/HomePage.tsx`
- `RosverSac/src/features/catalog/ui/CategoryHomeCard.tsx`
- `RosverSac/src/features/catalog/ui/CategoryCarousel.tsx`
- `RosverSac/src/features/catalog/ui/TrendingProducts.tsx`
- `RosverSac/src/features/catalog/ui/CampaignLatestSection.tsx` (nuevo)
- `RosverSac/package.json`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0251-home-katrina-rosver-campaign.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] `/` muestra hero + categorías + mayoristas + campaña (sin marcas/how-to/cta viejos)
- [ ] Cards categoría: overlay «lo último EN …» y glow rojo en activo
- [ ] Cards mayorista: badge #TOP + caja precio rojo
- [ ] Campaña: grid + CTA «¡Ver todo!»
- [ ] Móvil / tablet / desktop
- [ ] Deploy rosversac.com
