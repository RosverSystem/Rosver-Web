# Productos en tendencia + calificaciones — lógica 100%

**Estado:** implementado (+ calificaciones públicas / ranking v0.1.44)  
**UI:** `TrendingProducts` + `ProductCard` (rating) · ficha interactiva · `/ranking`  
**APIs:** trending · `GET/POST …/products/:slug/rating` · `GET /api/catalog/ranking`

---

## 1. Qué ve el usuario

Sección **Top picks → Productos en tendencia**:

1. **Pills de categoría** (solo raíces con productos visibles / en tendencia).
2. Click en pill → filtra el carrusel a esa categoría.
3. Cards iguales a Destacados **más estrellas + N reseñas**.
4. Enlace **Ver ranking** → `/ranking` (mejores calificados).

| Elemento | Origen |
| --- | --- |
| Tabs | Categorías raíz con ≥1 producto en el set tendencia |
| Productos del carrusel | `trending = true` **o** top por score |
| Orden | `trending_sort ASC`, luego `rating DESC`, `review_count DESC` |
| Estrellas (cards) | `products.rating` (promedio) |
| “(N)” | `products.review_count` |

Límite por tab: **12**.

### Ficha producto — calificar

- Estrellas **clicables** (1–5).
- **Sin registro** o **con sesión**: una sola calificación por producto.
- Invitado: clave `guest_key` en `localStorage` (`rosver_rating_guest_key`).
- Logueado: vínculo a `user_id` (cookie de sesión).
- Tras votar: toast éxito; no se puede cambiar ni volver a votar.
- Promedio y conteo se actualizan al instante.

### Ranking `/ranking`

Lista productos con al menos 1 voto, ordenados por score (mismo que fallback de tendencia).

---

## 2. Base de datos

### Productos (ampliación `005`)

| Columna | Uso |
| --- | --- |
| `trending` / `trending_sort` | Carrusel home |
| `rating` | Promedio 0–5 desnormalizado |
| `review_count` | Cantidad de reseñas visibles |

### Reseñas `product_reviews` (+ `037`)

| Columna | Uso |
| --- | --- |
| `product_id` | FK producto |
| `user_id` | Usuario logueado (nullable) |
| `guest_key` | Invitado anónimo (nullable) |
| `rating` | 1–5 |
| `title` / `body` | Opcional (voto rápido: vacíos) |
| `visible` | Soft-hide |

**Unicidad (037):**

- `(product_id, user_id)` donde `user_id IS NOT NULL`
- `(product_id, guest_key)` donde `guest_key` no vacío

**Agregación** al crear/editar/borrar reseña visible → `recalculateProductRating` + invalidar cachés home.

---

## 3. Score (tendencia fallback + ranking)

```
score = rating * LN(review_count + 1)
ORDER BY score DESC, rating DESC, review_count DESC
```

---

## 4. Redis

Igual que antes: claves `rosver:catalog:trending:v1:*` (TTL ~90 s). Invalidación al cambiar rating/reseñas.

---

## 5. APIs

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/catalog/trending?category=` | Tendencia + tabs |
| `GET` | `/api/catalog/ranking?limit=` | Mejores calificados |
| `GET` | `/api/catalog/products/:slug/rating?guestKey=` | Mi voto + promedio |
| `POST` | `/api/catalog/products/:slug/rating` | Body `{ rating, guestKey? }` → 409 si ya votó |
| `GET/POST` | `/api/admin/products/:id/reviews` | Admin reseñas |
| `PATCH/DELETE` | `/api/admin/reviews/:id` | Admin |

---

## 6. Admin

Calificación agregada en producto; reseñas CRUD admin (texto). La tienda ya no depende de reseñas solo-admin para votar.

---

## 7. Tienda — degradación

| Caso | Comportamiento |
| --- | --- |
| Sin votos | Estrellas vacías + «Sé el primero…» |
| API caído al votar | Toast error; cards siguen con datos del catálogo |
| Ranking vacío | Empty state + CTA catálogo |
| Ranking API falla | Fallback: orden local del catálogo cargado |

---

## 8. Pendientes relacionados

- P30: reseñas con texto desde `/cuenta` (opcional; el **voto** ya es público).
