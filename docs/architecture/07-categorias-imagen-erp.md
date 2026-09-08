# Categorías en Home — imagen + preparación ERP

Cómo se muestran las categorías en `CategoryGrid` y qué campos esperamos del ERP / admin.

## Diseño visual

Cada tarjeta puede tener:

1. **`imageUrl`** — foto a full bleed (`object-cover`), overlay degradado oscuro abajo para texto legible, badge rojo con ícono, hover con zoom suave.
2. **Sin imagen** — fallback al diseño anterior (fondo rojo/negro sólido + ícono marca de agua).

Así el ERP puede ir poblando fotos de a poco sin romper el layout.

## Contrato de datos (fase visual → ERP)

| Campo | Tipo | Origen futuro | Uso UI |
| --- | --- | --- | --- |
| `id` | string | Código categoría ERP | Key estable, sync |
| `slug` | string | Generado o ERP | Rutas `/catalogo/:slug` |
| `name` | string | ERP / admin | Título en tarjeta |
| `imageUrl` | string? | CDN / storage del ERP | Foto; opcional |
| `visible` | boolean? | Admin / ERP | Filtrar en Home |
| `sortOrder` | number? | Admin / ERP | Orden en grilla |
| `icon` | componente (hoy) | En lógica: `iconKey` mapeado | Fallback si no hay foto |

Mocks actuales: `features/catalog/model/mocks.ts` (fotos Unsplash solo para preview).

## Responsive

- Móvil: 2 columnas
- Tablet (`md`): 3 columnas
- Desktop (`lg`): 4 columnas
- `aspect-[4/3]`, `loading="lazy"`, `width`/`height` en `<img>`

## Productos (listado / ficha)

Mismo principio que categorías: `imageUrl` opcional desde ERP.

| Campo | Uso |
| --- | --- |
| `id` | Código producto ERP |
| `imageUrl` | Foto principal (CDN) |
| `visible` | Filtrar en catálogo público |
| precio / SKU / MOQ | Datos de negocio del ERP |

UI: `ProductImage` (`features/catalog/ui/ProductImage.tsx`) — con foto o placeholder.
