# Producto — Rosver Sac (catálogo + gestión)

## Qué es

Sistema web para **Rosver Sac** (importaciones) con dos caras:

| Cara | Quién | Para qué |
| --- | --- | --- |
| **Catálogo web (público / cliente)** | Visitantes, clientes con cuenta | Ver productos, contactar, cotizar, armar pedido |
| **Gestión (backoffice)** | Admin interno, equipo comercial | Contenido web, catálogo, leads, cotizaciones, pedidos |

## Audiencias

| Rol | Acceso | Objetivo |
| --- | --- | --- |
| **Visitante** | Sin login | Explorar catálogo, contactar, solicitar cotización, armar carrito (según reglas) |
| **Cliente** | Cuenta | Ver precios/condiciones de cliente, historial de cotizaciones/pedidos, checkout |
| **Admin** | Backoffice | CRUD productos/categorías/contenido web, usuarios, configuración |
| **Comercial** | Backoffice (alcance limitado) | Leads, cotizaciones, seguimiento de pedidos, datos de contacto |

## Enfoque de trabajo (obligatorio)

1. **Fase visual** — pantallas, layout, componentes, navegación; datos **mock** o estáticos.
2. **Fase lógica** — auth, API, persistencia, reglas de negocio, integraciones.
3. Mientras se hace lo visual, **esta documentación** es la fuente de verdad de flujos y lógica futura.

No implementar backend real hasta cerrar la base visual acordada.

## Superficies / apps en UI

Misma app React (`RosverSac/`), dos zonas de rutas:

```
/                    → catálogo público (marketing + productos)
/cuenta/*            → área cliente (login requerido)
/admin/*             → gestión (admin + comercial; permisos por rol)
```

Detalle de pantallas → `docs/architecture/03-vistas-y-flujos.md`.

## Features previstas (módulos)

| Feature | Cara | Responsabilidad |
| --- | --- | --- |
| `catalog` | Pública | Listado, filtros, ficha de producto, categorías |
| `cart` | Pública / cliente | Carrito, cantidades, pasar a pedido/cotización |
| `quotes` | Pública / cliente / comercial | Solicitud y gestión de cotizaciones |
| `contact` | Pública | Formulario / WhatsApp / leads de contacto |
| `auth` | Todas | Login, sesión, roles (cliente, admin, comercial) |
| `account` | Cliente | Perfil, pedidos, cotizaciones propias |
| `admin-catalog` | Admin | CRUD productos, categorías, imágenes, visibilidad |
| `admin-content` | Admin | Páginas/home, banners, datos de empresa |
| `admin-leads` | Comercial / admin | Inbox de contactos y solicitudes |
| `admin-orders` | Comercial / admin | Pedidos y seguimiento |
| `admin-users` | Admin | Usuarios y roles |

Las fichas viven en `docs/features/`. En fase visual se crean shells UI; la lógica se cablea después según este doc.

## Dominio (importaciones) — entidades lógicas

| Entidad | Notas |
| --- | --- |
| **Category** | Árbol o lista; filtra el catálogo. Campos previstos para ERP: `id` (código externo), `slug`, `name`, `imageUrl`, `visible`, `sortOrder`. Si no hay imagen → UI usa ícono fallback. |
| **Product** | SKU, nombre, descripción, `imageUrl` (foto ERP/CDN), categoría, flags (`visible`, destacado), atributos de importación (origen, unidad, MOQ). Si no hay imagen → placeholder. `id` = código externo ERP. |
| **Price** | Precio público vs precio cliente (lógica futura); en visual puede mostrarse mock o “consultar” |
| **Cart** | Ítems + cantidades; puede convertirse en pedido o cotización |
| **QuoteRequest** | Solicitud de cotización (lead o cliente) |
| **Quote** | Respuesta comercial (montos, validez) |
| **Order** | Pedido confirmado / en proceso |
| **Lead / ContactMessage** | Contacto o solicitud sin cuenta |
| **User** | Roles: `visitor` (sin cuenta), `client`, `sales`, `admin` |
| **ContentBlock** | Home, banners, textos institucionales |

## Reglas de negocio (para fase lógica)

Documentadas para no improvisar después. Ajustables con el cliente.

1. **Visibilidad:** solo productos `visible=true` en el catálogo público.
2. **Precios:** visitante puede ver precio público o “Consultar”; cliente autenticado puede ver precio cliente si existe.
3. **Carrito:** visitante y cliente pueden armar carrito; al checkout sin login → pedir registro/login o enviar como cotización/lead.
4. **Cotización:** desde ficha, carrito o formulario; genera `QuoteRequest` visible a comercial.
5. **Contacto:** genera `Lead` / mensaje; opcional enlace WhatsApp con texto prearmado.
6. **Roles:** `admin` todo; `sales` leads/cotizaciones/pedidos (sin config global ni usuarios); `client` solo su cuenta.
7. **Pedidos:** confirman stock/condiciones en lógica futura; en visual solo UI de estados.

## Datos en fase visual

- JSON mock en `features/*/model` o `shared/lib/mocks`.
- Sin API real; componentes preparados para sustituir mock por `api/` después.
- Textos e imágenes placeholder aceptables; estructura de campos = la del dominio arriba.

## Stack (recordatorio)

- App: `RosverSac/` (React 19 + TypeScript + Vite).
- Alias `@` → `RosverSac/src`.
- Docs de flujos detallados: `03-vistas-y-flujos.md`.
