# Feature: Catálogo público

**Slug:** `features/catalog/`  
**Estado:** activa — Home marketplace; catálogo + ofertas

## Propósito

Mostrar el catálogo de importaciones de Rosver Sac a visitantes y clientes: home destacados, listados, categorías, ofertas y ficha de producto.

## Alcance

- Incluido: home, `/catalogo`, `/ofertas`, `/ranking`, filtros UI, ficha `/producto/:slug` con calificación.
- **Catálogo PDF:** FAB flotante (arriba de WhatsApp) genera PDF automático: carátula + índice + productos por categoría/subcategoría (`@react-pdf/renderer` + `pdf-lib`).
- Cards: vendor, SKU, precio, mayorista (`wholesalePrice` / estimado), CTA carrito.
- Ofertas: productos con `originalPrice` > `price` (fase visual mock).
- Categorías: foto opcional (`imageUrl`); ver `docs/architecture/07-categorias-imagen-erp.md`.
- Fuera de alcance (otras features): carrito, cotización, contacto, admin CRUD completo.

## API pública (prevista)

| Export | Tipo | Descripción |
| --- | --- | --- |
| `HomePage` | página | Home marketing + destacados |
| `CatalogPage` | página | Listado / filtros |
| `OffersPage` | página | Combos / ofertas |
| `RankingPage` | página | Mejores calificados |
| `ProductPage` | página | Ficha + estrellas interactivas |
| `CATEGORIES` / `Category` | mock / tipo | Incluye `id`, `imageUrl?`, `visible?`, `sortOrder?` |

## Dependencias

- `shared/`: layout UI, cards, inputs
- `cart`: CTA “añadir” (fase visual puede ser stub)
- `quotes` / `contact`: CTAs en ficha

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/` | `HomePage` | |
| `/catalogo` | `CatalogPage` | |
| `/catalogo/:categorySlug` | `CatalogPage` | |
| `/ofertas` | `OffersPage` | Combos ERP |
| `/ranking` | `RankingPage` | Mejores calificados |
| `/producto/:slug` | `ProductPage` | Hero, calificar 1 vez, mayorista, WhatsApp, specs |

## Flujos relacionados

Ver `docs/architecture/03-vistas-y-flujos.md` → F1.

## Verificación

- [x] Home muestra destacados mock
- [x] Listado filtra por categoría (mock)
- [x] Ficha muestra galería, specs y CTAs
- [x] `/ofertas` lista solo productos con descuento
- [x] Cards horizontales (badge, ahorro, añadir + WhatsApp)
- [ ] Reemplazar URLs Unsplash por assets propios / ERP
