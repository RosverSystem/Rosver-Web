# Vistas y flujos — Rosver Sac

Mapa de pantallas (fase visual) y comportamiento esperado (fase lógica).  
Fuente de verdad para el agente al implementar UI y, después, lógica.

---

## 1. Mapa de rutas

### Catálogo / marketing (público)

| Ruta | Vista | Feature |
| --- | --- | --- |
| `/` | Home (hero, destacados, categorías, CTA contacto/cotizar) | `catalog` + `admin-content` (datos) |
| `/catalogo` | Listado con filtros / búsqueda | `catalog` |
| `/catalogo/:categorySlug` | Listado filtrado por categoría | `catalog` |
| `/ofertas` | Ofertas — **implementado:** cards horizontales + volumen (`OffersPage`) | `catalog` |
| `/ranking` | Ranking — mejores calificados (`RankingPage`) | `catalog` |
| `/producto/:slug` | Ficha — **implementado:** hero + specs + relacionados (`ProductPage`) | `catalog` |
| `/carrito` | Carrito — **implementado:** lista + buscador + CTAs duales (`CartPage`) | `cart` |
| `/contacto` | Contacto / WhatsApp — **implementado:** banner + info + form (`ContactPage`) | `contact` |
| `/cotizar` | Solicitud de cotización — **implementado:** datos negocio + ítems (carrito/buscador) + WhatsApp (`QuoteRequestPage`) | `quotes` + `cart` |
| `/login` | Acceso — **implementado:** full `dvh` + ilustración (`AuthLayout` + `LoginPage`) | `auth` |
| `/registro` | Registro — **implementado:** full `dvh` + ilustración + form ampliado (`AuthLayout` + `RegisterPage`) | `auth` |

### Área cliente

| Ruta | Vista | Feature |
| --- | --- | --- |
| `/cuenta` | Resumen (pedidos, cotizaciones) | `account` |
| `/cuenta/pedidos` | Historial de pedidos | `account` |
| `/cuenta/pedidos/:id` | Detalle pedido | `account` |
| `/cuenta/cotizaciones` | Cotizaciones propias | `account` / `quotes` |
| `/cuenta/perfil` | Datos de cuenta | `account` |

### Gestión (`/admin`) — SystemRSV

Shell SaaS soft (sidebar blanca + top bar). UX: `docs/architecture/09-erp-systemrsv-ux.md` · skill `erp-systemrsv-saas-ux`.

| Ruta | Vista | Roles | Feature |
| --- | --- | --- | --- |
| `/admin` | Inicio (vacío) | admin | shell |
| `/admin/analitica` | Analítica tops + gráficas | admin | `admin-analytics` |
| `/admin/clientes` | Clientes e interés | admin | `admin-clients` |
| `/admin/clientes/:id` | Detalle cliente + oferta | admin | `admin-clients` |
| `/admin/productos` | Listado productos (vacío) | admin | `admin-catalog` |
| `/admin/categorias` | Categorías (vacío) | admin | `admin-catalog` |
| `/admin/ofertas` | Ofertas (vacío) | admin | `admin-catalog` |

---

## 2. Flujos de usuario (lógica futura)

### F1 — Explorar catálogo

```
Visitante → Home / Catálogo → filtro o búsqueda → Ficha producto
```

- **Visual:** grid, filtros UI, ficha con galería y CTAs.
- **Lógica:** leer productos visibles; filtros por categoría, texto, atributos.

### F2 — Contactar

```
Cualquier página (CTA) → /contacto → envío formulario
                     ↘ WhatsApp (deeplink con mensaje)
```

- **Visual:** formulario + botón WhatsApp.
- **Lógica:** crear Lead; opcional notificación; WhatsApp no requiere backend.

### F3 — Solicitar cotización

```
Ficha o Carrito o /cotizar → formulario (datos + ítems) → confirmación
```

- **Visual:** datos de negocio; si hay carrito se precargan ítems, si no hay buscador/lista libre; total + TC ref.; WhatsApp y pasar a carrito; beneficios 24h abajo.
- **Lógica:** `QuoteRequest`; si hay sesión cliente, asociar a User; comercial ve en `/admin/cotizaciones`.

### F4 — Carrito → pedido o cotización

```
Ficha → Añadir al carrito → /carrito → (A) Solicitar cotización
                                    → (B) Continuar pedido
```

- **(A)** reutiliza F3 con ítems del carrito.
- **(B)** si no hay login → login/registro → confirmar pedido → `Order` pendiente.
- **Visual:** carrito, botones A/B, pantallas de confirmación mock.
- **Lógica:** carrito en `localStorage` + sync con catálogo vivo (`07-carrito.md`); pedido/API pendiente.

### F5 — Cliente autenticado

```
Login → /cuenta → ver pedidos / cotizaciones / perfil
```

- Precios cliente en ficha/listado si aplica.
- Pedidos y cotizaciones filtrados por `userId`.

### F6 — Comercial: lead → cotización

```
Lead o QuoteRequest en /admin → revisar → crear/actualizar Quote → notificar cliente (futuro)
```

### F7 — Admin: publicar producto

```
/admin/productos/nuevo → datos + imágenes + categoría + visible → Guardar → aparece en catálogo
```

### F8 — Admin: contenido de la web

```
/admin/contenido → editar home/banners/textos → Guardar → Home refleja cambios
```

---

## 3. Wireframes lógicos por vista (fase visual)

Cada vista debe construirse con estos bloques (aunque el dato sea mock).

### Home

- Header (logo, nav, carrito, login) — **implementado:** `PublicNavbar` (marketplace 3 niveles)
- Hero — **implementado:** `HeroWaveSlider` (full-bleed rojo + producto sin caja + ola blanca; datos `HOME_HERO_SLIDES`)
- Marcas — **implementado:** `BrandCarousel` (franja sin cajas)
- Cinta de valor — **implementado:** `ValueRibbon`
- Categorías — **implementado:** `CategoryCarousel` (cards suaves + flechas + autoplay)
- Destacados / tendencia — **implementado:** `ProductCarousel` (+ tabs en `TrendingProducts`)
- Promo — **implementado:** `PromoBanners` (banner oferta ancho)
- Cómo comprar / industrias / CTA — círculos y cards suaves estilo landing
- Productos destacados
- CTA contacto / cotizar
- Footer (datos empresa, links)

### Listado ofertas

- Banner “Ofertas activas” (Memphis rojo) — **implementado:** `OffersPage`
- Criterio mock: `price` + `originalPrice` con descuento real
- Misma grilla 3×6 / paginación / scroll al paginar que catálogo

### Listado catálogo

- Banner “Nuestros productos” — **implementado:** `CatalogBanner` Memphis Rosver (CSS/SVG + Motion; sin bitmap)
- Sidebar filtros — **implementado:** `FiltersPanel` (categorías, promo, stock, rating, vendor + drawer móvil)
- Toolbar resultados + orden + chips de filtros activos
- Grid de cards — **implementado:** `ProductGrid` + `ProductCard` (hover actions, Motion stagger)
- Paginación circular — **implementado:** `CatalogPagination` (6 ítems/página en mock)

### Ficha producto

- Imagen grande + badges (destacado / oferta)
- Marca, título, SKU, stock, precio lista + caja mayorista
- CTAs: Agregar al carrito / Cotizar WhatsApp
- Descripción + especificaciones (tabla)
- Productos relacionados + CTA cotización B2B

### Carrito

- Banner + lista de ítems (thumb, cantidad editable, quitar)
- Buscador para agregar (también en vacío)
- Resumen con TC referencial
- Botones: Cotizar / Pedir / Seguir comprando
- Beneficios 24 h / TC abajo

### Admin shell

- Sidebar por rol
- Topbar (usuario, logout)
- Contenido de la ruta

### CRUD producto (admin)

- Formulario: datos básicos, precios, categoría, imágenes, flags
- Listado con buscar / filtros / estado visible

---

## 4. Estados de UI a diseñar (aunque la lógica venga después)

| Contexto | Estados |
| --- | --- |
| Listados | loading, vacío, error, con datos |
| Formularios | idle, validación, enviando, éxito, error |
| Carrito | vacío, con ítems |
| Auth | no autenticado, autenticado, sin permiso (403 UI) |
| Pedido / cotización | borrador, enviada, en revisión, respondida, cerrada (badges) |

---

## 5. Orden sugerido de construcción visual

1. Shell público (layout, header, footer) + Home mock  
2. Catálogo listado + ficha  
3. Carrito + pantallas de confirmación mock  
4. Contacto + cotizar (formularios)  
5. Auth (login/registro UI) + área cuenta  
6. Shell admin + dashboard  
7. Admin catálogo (CRUD UI)  
8. Admin leads / cotizaciones / pedidos  
9. Admin contenido + usuarios  

Tras cada bloque visual relevante → `docs/changes/` + actualizar esta ficha si cambian rutas o flujos.

---

## 6. Qué NO hacer en fase visual

- No API real ni base de datos.
- No auth real (puede simularse con mock de sesión).
- No pagos ni pasarelas.
- Sí: componentes listos para enchufar `api/` y roles después.
