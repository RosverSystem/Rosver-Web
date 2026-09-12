# Cambio: Código interno + specs técnicas ejemplo

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- La ficha de producto muestra **Código interno** (`products.code`, serial del sistema) en especificaciones de tienda.
- **Especificaciones técnicas** usan el mismo estilo zebra (etiquetas izq. / valores der.).
- Seed `015_product_tech_specs_seed.sql` con ejemplos para RS-5402: dimensiones, peso, potencia, material, temperatura de color.
- API catálogo expone `code` en cada producto; mock PRD-5402 alineado.
- Búsqueda también indexa código interno y nombres de specs.

## Por qué

Pedido de UX: distinguir el código interno del sistema del SKU comercial, y mostrar datos técnicos de ejemplo con el mismo look de tabla.

## Cómo

- Mapper `mapStoreProduct` → campo `code`.
- UI: fila «Código interno» al inicio del bloque de tienda; bloque técnico ya con `SpecBlock`.
- Migración idempotente de atributos + `product_spec_values`.

## Archivos

- `RosverSac/server/src/lib/catalog-products.ts`
- `RosverSac/server/sql/015_product_tech_specs_seed.sql`
- `RosverSac/src/features/catalog/ui/ProductPage.tsx`
- `RosverSac/src/features/catalog/model/mocks.ts`
- `RosverSac/src/features/catalog/model/catalog-search.ts`
- `docs/changes/0165-codigo-interno-specs-tecnicas.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API si hace falta; abrir `/producto/lampara-escritorio-led` (o SKU RS-5402)
- [ ] En «Especificaciones de tienda» aparece **Código interno** (número serial, p. ej. `2`)
- [ ] En «Especificaciones técnicas» hay filas zebra: Dimensiones, Peso, Potencia, Material, Temperatura de color
- [ ] Mismo estilo visual (bordes redondeados, filas alternadas) en ambos bloques
- [ ] _(Si UI)_ Se ve y usa bien en **móvil** (&lt;768px)
- [ ] _(Si UI)_ Se ve y usa bien en **tablet** (768–1023px)
- [ ] _(Si UI)_ Se ve y usa bien en **desktop** (≥1024px)
- [ ] _(Si UI)_ Percepción de carga aceptable; sin assets/anims innecesariamente pesados
