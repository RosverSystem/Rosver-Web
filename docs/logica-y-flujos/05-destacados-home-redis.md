# Destacados para ti (Home) — lógica 100%

**Estado:** implementado (v0.1.12) · Postgres fuente de verdad · Redis caché opcional  
**UI:** `ProductCarousel` en `HomePage` · badge/precio en `ProductCard`  
**APIs:** `GET /api/catalog` (`featured`) · `GET /api/catalog/featured` · admin `PATCH /api/admin/products/:id`

---

## 1. Qué ve el usuario

Sección **Top picks → Destacados para ti**: carrusel horizontal de cards.

| Elemento card | Origen de dato |
| --- | --- |
| Badge **COTIZAR** | `availability = quote_only` **o** sin precio lista activo |
| Badge **¡OFERTA!** + **-N%** | precio lista con `compare_at_amount` > `amount` |
| Imagen | `products.image_url` (R2 / URL) |
| Línea marca | `brands.name` (vendor) |
| Nombre / SKU | `products.name` / `products.sku` |
| Precio **S/ …** o **Consultar** | precio lista activo del empaque default |
| **Mayorista: S/ … · MOQ n** | precio `wholesale` activo + `products.moq` |
| CTA Agregar / cotizar | UI carrito (misma card) |

Solo entran productos con **`featured = true`**, **`visible = true`**, ordenados por **`featured_sort` ASC** luego `updated_at DESC`. Límite home: **12**.

---

## 2. Base de datos (Postgres)

Tabla `products` (ya en `002`) + ampliación `004`:

| Columna | Tipo | Uso |
| --- | --- | --- |
| `featured` | `BOOLEAN NOT NULL DEFAULT false` | Aparece en Destacados |
| `featured_sort` | `INTEGER NOT NULL DEFAULT 0` | Orden en el carrusel (menor = primero) |
| `visible` | boolean | Soft-hide |
| `availability` | `in_stock` \| `quote_only` \| `out_of_stock` | Badge cotizar |
| `moq` | numeric | Texto mayorista |
| `image_url` | text | Foto card |
| `brand_id` / `category_id` | FK | Marca / categoría slug |

Precios (cascada doc `04`):

```
product → packaging (default) → product_prices (is_active, price_kind)
  list       → precio publicado
  wholesale  → línea “Mayorista”
  offer      → alternativa a compare_at (misma card usa compare_at del list)
```

**Consulta canónica (fuente de verdad):**

```sql
SELECT … FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.visible = true AND p.featured = true
ORDER BY p.featured_sort ASC, p.updated_at DESC
LIMIT 12;
-- + subselects de list_price / compare_at / wholesale (igual que /api/catalog)
```

---

## 3. Redis (Railway) — caché, no fuente de verdad

| Qué | Valor |
| --- | --- |
| Servicio | Redis en el mismo proyecto Railway |
| Variable | `REDIS_URL` (o `REDIS_PRIVATE_URL`) en el servicio web |
| Librería | `ioredis` |
| Clave | `rosver:catalog:featured:v1` |
| TTL | **90 s** |
| Payload | JSON `{ updatedAt, products: [...] }` |

### Flujo lectura

```
GET /api/catalog/featured  (o bloque featured de GET /api/catalog)
        │
        ├─ Redis GET clave ──hit──► devolver JSON
        │
        └─ miss / Redis caído
                 │
                 ├─ Postgres query canónica
                 ├─ Redis SETEX (best-effort)
                 └─ respuesta
```

Si **no hay `REDIS_URL`**: solo Postgres (local / degradado). La app **nunca** falla por Redis.

### Invalidación (escribir)

Tras cualquier cambio que afecte la lista destacada:

- `POST/PATCH` producto (`featured`, `featured_sort`, `visible`, `image_url`, marca, …)
- `POST` precios / empaques del producto

→ `DEL rosver:catalog:featured:v1` (y opcionalmente bump de versión de clave).

---

## 4. Stack / tecnologías

| Capa | Tecnología | Rol |
| --- | --- | --- |
| Persistencia | Postgres (`pg`) | Fuente de verdad |
| Caché | Redis (`ioredis`) | Lecturas home / featured |
| API | Hono | Rutas `/api/catalog*` y admin |
| Validación | Zod | Body admin |
| Front | React + `CatalogProvider` | Hidrata productos; filtra `featured` |
| Media | Cloudflare R2 | Imágenes producto |
| Deploy | Railway | Web+API + Postgres + Redis |

**No** usamos React Query para esto: el provider ya hace refresh en focus/ruta/poll.

---

## 5. Admin (SystemRSV)

En **Productos**:

1. Al crear: checkbox **Destacado en el inicio** (+ orden opcional).
2. En el detalle: toggle Destacado + campo **Orden** → `PATCH`.
3. Badge “Inicio” en el listado si `featured`.

Regla CRUD (`16`): create/list/patch (featured) + soft-delete (`visible=false`) vía PATCH.

---

## 6. Tienda — degradación

| Situación | Comportamiento |
| --- | --- |
| Hay productos live con `featured` | Carrusel = esos (orden `featured_sort`) |
| Live sin ninguno `featured` | Sección vacía (admin debe marcar) |
| Sin productos en DB (`liveProducts=false`) | Mocks del bundle con `featured: true` |

---

## 7. APIs

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/catalog` | Incluye `featured: Product[]` + flags live |
| `GET` | `/api/catalog/featured` | Solo destacados (Redis → Postgres) |
| `PATCH` | `/api/admin/products/:id` | `featured`, `featuredSort`, `visible`, … + invalida Redis |
| `DELETE` | `/api/admin/products/:id` | Soft: `visible=false` + invalida Redis |

---

## 8. Checklist verificación

- [ ] Redis Online en Railway; `REDIS_URL` en servicio web
- [ ] Migración `004_featured_home` aplicada en boot
- [ ] Marcar producto destacado en admin → aparece en inicio (tras refresh catálogo)
- [ ] Cambiar orden → reordena cards
- [ ] Quitar destacado → sale del carrusel
- [ ] Sin Redis: sigue funcionando vía Postgres
- [ ] Card: oferta / cotizar / mayorista coherentes con precios
- [ ] Móvil / tablet / desktop: carrusel usable
