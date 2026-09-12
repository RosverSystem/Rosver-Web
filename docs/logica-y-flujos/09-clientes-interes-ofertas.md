# Clientes — interés y ofertas (flujo)

**Estado:** implementado (v0.1.46)  
**UI:** `/admin/clientes` · `/admin/clientes/:id`  
**Tabla:** `user_product_views` (migración `039`)

---

## 1. Qué ve el admin

1. **Listado** de usuarios con rol `client` (nombre, correo, empresa, vistas, pedidos).
2. Botón **Ver detalles** → ficha del cliente.
3. En la ficha:
   - Datos de contacto (teléfono, email, RUC/DNI, empresa).
   - **Más frecuentes:** productos que más abrió.
   - **Últimos vistos:** por fecha.
   - Pedidos y cotizaciones recientes ligados a su `user_id`.
   - **WhatsApp oferta** / **Email oferta**: mensaje precargado con los productos de interés.

---

## 2. Cómo se guarda el interés

```
Cliente logueado → abre /producto/:slug
  → POST /api/catalog/products/:slug/view (cookie sesión)
  → products.view_count += 1  (global)
  → user_product_views upsert (user_id, product_id, view_count++, last_viewed_at)
```

Sin sesión: solo contador global (analítica), **no** aparece en ficha de cliente.

Anti-spam front: 1 registro por producto por pestaña (`sessionStorage`).

---

## 3. Flujo comercial sugerido

```
Admin abre Clientes
  → busca cliente activo / con vistas recientes
  → Ver detalles
  → revisa frecuentes + últimos vistos
  → WhatsApp oferta (o email)
  → conversa y crea cotización / combo en ERP
```

---

## 4. APIs

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/admin/clients?q=` | Listado |
| `GET` | `/api/admin/clients/:id` | Detalle + interés |
| `POST` | `/api/catalog/products/:slug/view` | Track (público; user si hay sesión) |

---

## 5. Degradación

| Caso | Comportamiento |
| --- | --- |
| Cliente sin vistas | Empty state en interés |
| Sin teléfono | WhatsApp deshabilitado; email si hay |
| Cotización con slug huérfano | No afecta interés (solo vistas de ficha) |
