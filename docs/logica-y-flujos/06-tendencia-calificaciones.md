# Productos en tendencia + calificaciones — lógica 100%

**Estado:** implementado (v0.1.13) · Postgres + Redis · UI tabs + estrellas en card  
**UI:** `TrendingProducts` + `ProductCard` (rating) · Home  
**APIs:** `GET /api/catalog/trending?category=` · reviews admin · `PATCH` producto (trending/rating)

---

## 1. Qué ve el usuario

Sección **Top picks → Productos en tendencia**:

1. **Pills de categoría** (solo raíces con productos visibles / en tendencia).
2. Click en pill → filtra el carrusel a esa categoría.
3. Cards iguales a Destacados (oferta / destacado / cotizar / precio / mayorista / MOQ) **más estrellas + N reseñas**.

| Elemento | Origen |
| --- | --- |
| Tabs | Categorías raíz (`parent_id IS NULL`) que tengan ≥1 producto en el set tendencia |
| Productos del carrusel | `trending = true` **o** (si ninguno marcado) top por score de calificación |
| Orden | `trending_sort ASC`, luego `rating DESC`, `review_count DESC` |
| Estrellas | `products.rating` (0–5, agregada) |
| “(N)” reseñas | `products.review_count` |

Límite por tab: **12**.

---

## 2. Base de datos

### Productos (ampliación `005`)

| Columna | Uso |
| --- | --- |
| `trending` | Incluir en «Productos en tendencia» |
| `trending_sort` | Orden manual en el carrusel (menor = primero) |
| `rating` | Promedio 0–5 (desnormalizado) |
| `review_count` | Cantidad de reseñas visibles |

### Reseñas `product_reviews`

| Columna | Uso |
| --- | --- |
| `product_id` | FK producto |
| `user_id` | FK usuario (nullable: reseña importada / admin) |
| `rating` | 1–5 entero |
| `title` / `body` | Texto opcional |
| `visible` | Soft-hide |
| `created_at` | Orden |

**Regla de agregación:** al crear/editar/borrar (soft) una reseña visible →

```sql
UPDATE products SET
  rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM product_reviews
                     WHERE product_id = $1 AND visible), 0),
  review_count = (SELECT COUNT(*) FROM product_reviews
                  WHERE product_id = $1 AND visible)
WHERE id = $1;
```

Invalidar caché Redis de trending (+ featured si aplica).

---

## 3. Score de tendencia (fallback automático)

Si **no hay** productos con `trending = true` en una categoría:

```
score = rating * LN(review_count + 1)   -- favorece bien valorados con reseñas
ORDER BY score DESC, updated_at DESC
LIMIT 12
```

Si hay marcados `trending`, **solo** esos (más orden manual).

---

## 4. Redis

| Clave | TTL |
| --- | --- |
| `rosver:catalog:trending:v1:all` | 90 s |
| `rosver:catalog:trending:v1:{categorySlug}` | 90 s |

Payload: `{ updatedAt, category, products[], tabs[] }`.

Invalidación: patrón / delete de claves `rosver:catalog:trending:v1:*` (SCAN o lista conocida) al cambiar producto trending/rating/precios/reseñas.

---

## 5. APIs

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/catalog/trending?category=slug` | Lista + tabs (Redis→Postgres) |
| `GET` | `/api/catalog` | Incluye `trending` (all / meta) |
| `GET/POST` | `/api/admin/products/:id/reviews` | Listar / crear reseña |
| `PATCH/DELETE` | `/api/admin/reviews/:id` | Editar visible/rating · soft-delete |
| `PATCH` | `/api/admin/products/:id` | `trending`, `trendingSort`, `rating`, `reviewCount` (override admin) |

Override admin de `rating`/`reviewCount` permitido cuando aún no hay reseñas reales; si hay reseñas, el promedio de reseñas gana al recalcular.

---

## 6. Admin

En detalle de producto:

- Checkbox **En tendencia (inicio)** + orden.
- Bloque **Calificación**: estrellas / número + conteo (o listado de reseñas + «Agregar reseña»).

---

## 7. Tienda — degradación

| Caso | Comportamiento |
| --- | --- |
| Live + trending/rating | Tabs y cards desde DB |
| Live sin trending | Fallback score por rating |
| Sin productos DB | Mocks; tabs por categorías con productos mock |

---

## 8. Checklist

- [ ] Migración `005` aplicada
- [ ] Marcar producto «En tendencia» → aparece en tab de su categoría
- [ ] Agregar reseña → rating/review_count se actualizan y se ven estrellas
- [ ] Redis hit en `/api/catalog/trending`
- [ ] Sin Redis sigue Postgres
- [ ] Móvil / tablet / desktop: pills + carrusel + estrellas legibles
