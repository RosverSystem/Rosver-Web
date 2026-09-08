# Cambio: Ofertas con cards horizontales + volumen

**Fecha:** 2026-09-07  
**Tipo:** feature

## Qué cambió

- `OfferCard`: badge campaña, “Ahorra S/…”, precio tachado + oferta Inc. IGV, **Añadir al carrito** + WhatsApp.
- `OffersPage`: grilla 1 col móvil / 2 cols desktop (ya no `ProductGrid` de catálogo).
- Helpers: `offerSavings`, `offerCampaignTag`, `VOLUME_TIERS`.
- Sección “Escala de precios por volumen…” + CTAs cotizar/carrito.

## Por qué

La vista de ofertas debía parecer lotes/campañas (mock de referencia), no la misma card del catálogo.

## Cómo

Estilo Rosver (ink/rojo/ámbar/verde ahorro). `useCart` para añadir. WhatsApp con mensaje prearmado por producto.

## Archivos

- `RosverSac/src/features/catalog/ui/OfferCard.tsx`
- `RosverSac/src/features/catalog/ui/OffersPage.tsx`
- `RosverSac/src/features/catalog/model/offers.ts`
- `docs/features/catalog.md`
- `docs/architecture/03-vistas-y-flujos.md`
- `docs/changes/0062-ofertas-cards-horizontales.md`

## Cómo verificar

- [ ] `/ofertas`: cards 2 columnas en desktop; 1 en móvil
- [ ] Badge campaña + ahorro verde + precios
- [ ] Añadir al carrito sube el badge del header
- [ ] WhatsApp abre con el producto en el mensaje
- [ ] Tabla de volumen visible debajo
- [ ] Sin assets bitmap nuevos
