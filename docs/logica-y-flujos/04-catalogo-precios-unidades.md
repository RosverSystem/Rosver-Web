# Catálogo Rosver — precios, unidades, categorías, marcas, specs

**Estado:** modelo v1 documentado + tablas Postgres `002_catalog_core`  
**Referencia UX tienda:** cards / ficha / filtros / topbar categorías (Saga-like B2B)

## Cascada de precios (como “ubigeo”)

```
Producto
  └─ Tipo de unidad (personalizado): Unidad | Paquete | Caja | …
       └─ Contenido / factor: Paquete×10 | Paquete×100 | Caja×24
            └─ Precio(s) por tramo de cantidad de ese empaque
                 · lista / mayorista / oferta / custom
                 · editable → “Guardar” (update) o “Guardar como nuevo”
```

### Reglas

1. **Tipos de unidad** (`unit_types`): nombres libres por empresa (no solo enum fijo).
2. **Empaque** (`product_packagings`): `producto + unit_type + content_qty` (ej. paquete de 100).
3. **Precio** (`product_prices`): siempre ligado a un empaque (+ `min_qty`/`max_qty` del empaque).
4. Al editar un precio:
   - **Modificar** → `UPDATE` del registro activo.
   - **Guardar como nuevo** (o si no existe fila) → `INSERT`; el anterior puede marcarse `is_active=false` y `replaced_by` / `replaces_price_id`.
5. En tienda, el precio mostrado en card/ficha es el **listado activo** del empaque default (o el de menor `min_qty`); mayorista/oferta son filas `price_kind` distintas o `compare_at_amount`.

## Marcas

| Campo | Uso |
| --- | --- |
| `code` | Auto-incremento interno |
| `sku` | Código personalizado empresa (prefijo / clave marca) |
| `name`, `slug`, `logo_url`, `visible` | Catálogo / filtros / topbar |

## Categorías / subcategorías

- Árbol con `parent_id` (null = raíz).
- Topbar “Ver categorías”: raíces; hover/click → hijos.
- Filtro lateral: raíces (y opcionalmente hojas); contadores por productos en esa rama.

## Productos

- `sku` personalizado único; `code` auto-incremento interno.
- `brand_id`, `category_id` (preferir hoja), `availability`, rating, MOQ, imagen, specs.

## Especificaciones

- Catálogo de atributos reutilizables (`spec_attributes`): key, nombre, tipo (`text`/`number`/`measure`), `unit_hint`.
- Valores por producto (`product_spec_values`) con **unidad real** (`unit`) que puede diferir del hint (mm vs cm).
- Misma key “dimensiones” / “medida” en muchos productos; el valor y la unidad cambian.

## Filtros tienda (objetivo)

| Filtro | Fuente |
| --- | --- |
| Categoría | `categories` (+ hijos) |
| Marca | `brands` / `vendor` |
| Rango de precio | precio lista activo |
| Disponibilidad | `availability` + con precio / solo cotizar |
| Valoración | `rating` / `minRating` |
| En oferta | `compare_at` o `price_kind=offer` |

## Carrito

- Línea = `product` + **`packaging_id`** + cantidad de ese empaque + `unit_price` congelado al agregar.
- Ficha (0155): selector **Precio por presentación** (todas las presentaciones con precio); al agregar usa la elegida.
- Card de catálogo: sigue usando empaque default (sin selector en card).

## APIs

| Método | Ruta | Uso |
| --- | --- | --- |
| GET/POST | `/api/admin/brands` | Marcas |
| GET/POST/PATCH | `/api/admin/categories` | Categorías |
| GET/POST | `/api/admin/unit-types` | Tipos de unidad |
| GET/POST/PATCH | `/api/admin/products` | Productos |
| POST | `/api/admin/products/:id/packagings` | Empaques |
| POST | `/api/admin/products/:id/prices` | Upsert / guardar como nuevo |
| GET | `/api/catalog` | Tienda (`live: true` si hay filas) |

## Seed demo multi-presentación

- Migración `013_product_pack_prices_seed.sql`: RS-5402 con Unidad + Paquete×6 + Caja×12 y precios lista/mayorista.

## Qué falta (pendientes)

- Selector de presentación en card/carrito (opcional).
- Cotización: mapear `packagingId` en vez de presentation mock.

Ver `docs/pendientes/PENDIENTES.md` (P10, P16–P22): selector empaque en carrito, specs UI completa, ofertas ERP, import CSV, stock real, topbar mega-menú con todos los hijos, etc.
