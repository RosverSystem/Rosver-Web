# Ofertas — combos ERP → tienda → pedidos/cotizaciones

**Estado:** vivo (Postgres) · migración `035_offer_combos.sql`  
**Vista tienda:** `/ofertas`  
**ERP:** `/admin/ofertas`

## Flujo

```
Admin /admin/ofertas
  · Alta/edición de COMBO (AdminModal)
  · Tipos: bogo (2x1/NxM) | bundle_fixed | qty_pack
        ↓
offer_combos + offer_combo_items
        ↓
GET /api/catalog → offerCombos[]
GET /api/catalog/offers → combos (+ products markdown legacy)
        ↓
OffersPage → OfferCard → carrito (1 línea kind=combo)
        ↓
Pedido / cotización → items JSONB con lineKind + comboSnapshot
```

## Reglas

1. **`/admin/ofertas` solo crea combos**, no productos ni descuentos sueltos.
2. Precios oferta por SKU (markdown) siguen en **ficha Producto → Precios** (`price_kind=offer`).
3. En carrito un combo = **una línea** con `unitPrice` = precio del pack; los ítems internos van en `comboItems` / `comboSnapshot`.
4. Al crear pedido o cotización se guarda snapshot para no romper historial si el combo cambia después.
5. Motor automático “si llevas 2 del mismo SKU aplica 2x1” **fuera de alcance** (solo combo explícito al carrito).
6. **`max_per_user`** (opcional): tope de packs del combo por usuario. Se aplica en carrito y en `POST /api/orders` (suma pedidos previos si hay sesión). Vacío = sin límite.
7. **Estrellas / ranking**: cada producto del combo expone `rating` + `reviewCount` del catálogo; la card de oferta también muestra promedio del pack. `/ofertas` ordena por rating.
8. **UI admin**: un solo formulario (título, descripción, precio, imagen, productos). Sin selector de tipo 2x1/pack; siempre se guarda como pack a precio fijo (`bundle_fixed`).

## Tipos de combo

| kind | Uso | Precio |
| --- | --- | --- |
| `bogo` | Llevas N, pagas M | Calculado desde lista × `pay_qty` |
| `bundle_fixed` | Varios productos a un precio | `fixed_price` |
| `qty_pack` | Un SKU × cantidad a un precio | `fixed_price` |

## API

| Método | Ruta | Uso |
| --- | --- | --- |
| GET/POST | `/api/admin/offer-combos` | Listar / crear |
| GET/PATCH/DELETE | `/api/admin/offer-combos/:id` | Detalle / editar / soft-hide |
| GET | `/api/catalog/offers` | Combos públicos + ofertas markdown |
| GET | `/api/catalog` | Incluye `offerCombos[]` |

## Cómo agregar un combo

1. ERP → Ofertas → Nuevo combo.
2. Elegir tipo, productos y cantidades, precio o regla 2x1.
3. Visible → aparece en `/ofertas` (refresh o ~45s).
4. Cliente: «Agregar combo» → carrito → pedido o cotización.
