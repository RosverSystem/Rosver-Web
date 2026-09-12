# Features

Índice de módulos de producto. Cada feature tiene ficha en esta carpeta.

| Feature | Descripción | Estado |
| --- | --- | --- |
| [catalog](./catalog.md) | Catálogo público, listados y ficha | activa (wireframe) |
| [cart](./cart.md) | Carrito → cotizar / pedir (pedido DB + `/p/`) | activa |
| [quotes](./quotes.md) | Cotizaciones (público + admin) | activa (cotizar + carrito) |
| [contact](./contact.md) | Contacto / WhatsApp / leads | activa (wireframe) |
| [complaints-book](./complaints-book.md) | Libro de reclamaciones (Perú) | activa (API + UI) |
| [auth](./auth.md) | Login, registro, roles | activa (diseño visual) |
| [account](./account.md) | Área cliente | activa (wireframe) |
| [admin-catalog](./admin-catalog.md) | Productos, precios, marcas, categorías ERP | activa (v1 API+UI) |
| [admin-media](./admin-media.md) | Almacenamiento R2 (grid + modal) | activa |
| [admin-content](./admin-content.md) | Contenido de la web | activa (wireframe) |
| [admin-leads](./admin-leads.md) | Bandeja de leads | activa (wireframe) |
| [admin-orders](./admin-orders.md) | Pedidos en backoffice | activa (API `order_requests`) |
| [admin-users](./admin-users.md) | Usuarios y roles | activa (wireframe) |
| [admin-analytics](./admin-analytics.md) | KPIs, tops y gráficas de demanda | activa |
| [admin-clients](./admin-clients.md) | Clientes, interés y contacto oferta | activa |

Todas las features están en fase visual: estructura y ruteo reales, datos mock, sin API ni auth real. Ver `docs/changes/0009-wireframe-todas-las-vistas.md`.

Producto y flujos: `docs/architecture/02-producto-rosver-sac.md`, `03-vistas-y-flujos.md`.
