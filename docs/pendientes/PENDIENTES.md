# Pendientes — Rosver Web

Última actualización: 2026-09-08

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P01 | Google OAuth (Client ID + Secret) | Auth completo | bloqueado | Falta credenciales Google Cloud |
| P02 | Facebook login | UI login/registro | pendiente | Botón placeholder |
| P03 | Pedidos / cotizaciones reales en `/cuenta` | Auth + cuenta | pendiente | Siguen mocks |
| P04 | UI admin roles/permisos | Auth RBAC | pendiente | API lista |
| P10 | CRUD Productos ERP + API | Pedido ERP | hecho | v0.1.15 ficha + imagen R2 + specs |
| P15 | Catálogo vivo en tienda (sin F5) | Pedido UX SPA | hecho | Poll + live taxonomía/productos |
| P16 | Selector empaque + precio en carrito/ficha | Precios unidades | hecho | v0.1.15 packagingId en carrito |
| P17 | Specs UI (atributos + unidades variables) | Specs | hecho | v0.1.19 tipo+valor libres en wizard |
| P18 | Filtro categoría incluye subcategorías | Filtros | hecho | v0.1.15 árbol en filtro |
| P19 | Módulo Ofertas ERP (vincular price_kind=offer) | Ofertas | hecho | v0.1.18 seed + alta ERP + tienda DB |
| P20 | Tipos de unidad UI dedicada | Unidades | hecho | Integrado en Listado de precios (v0.1.21); `/admin/unidades` redirige |
| P21 | Mega-menú topbar con imágenes / columnas | Topbar cats | hecho | v0.1.15 |
| P22 | Import CSV / sync ERP externo | Catálogo | pendiente | |
| P13 | ERP perfil solo sidebar | Pedido UX | hecho | v0.1.7 |
| P05 | Recuperación de contraseña | Auth | pendiente | |
| P06 | Avatar R2 | Perfil | hecho | |
| P07 | 2FA UI perfil | Auth | pendiente | |
| P08 | Header sesión | Login UX | hecho | |
| P09 | CLI railway login | Deploy | pendiente | Deploy GraphQL OK |
| P14 | Force commitSha deploy | Deploy | parcial | |
| P23 | UX ERP catálogo (cards + selects claros) | Pedido UX | hecho | v0.1.10; regla 14 |
| P24 | Regla migraciones DB en cada cambio | Pedido reglas | hecho | Regla `15` |
| P25 | Regla CRUD + vínculo inicio/menú | Pedido usuario | hecho | Regla 16 + v0.1.11 |
| P26 | Subir imagen categoría a R2 (no solo URL) | Categorías home | hecho | v0.1.15–0.1.16 botón Subir imagen |
| P27 | Destacados home Postgres + Redis | Pedido lógica | hecho | Doc 05 + v0.1.12 + Redis Railway |
| P28 | Volumen persistente Redis / Redis oficial template | Infra | recomendado | Hoy imagen `redis:7-alpine` sin volume |
| P29 | Tendencia + calificaciones / reseñas | Pedido lógica | hecho | Doc 06 + v0.1.13 |
| P30 | Reseñas desde cuenta cliente (no solo admin) | Calificaciones | pendiente | Admin ya no carga reseñas en producto; falta UI `/cuenta` |
| P31 | Slider marcas ↔ módulo marcas + seed | Pedido UI | hecho | v0.1.14 · migración `006` |
| P36 | Listado precios: tipo→cantidad→varios precios por presentación | Pedido UX | hecho | v0.1.24 flujo tipo ubicación |

## Hechos recientes

- Listado precios: presentación (tipo+cantidad) → varios precios (v0.1.24)
- Marcas en modal + selector R2 con búsqueda y nombre al subir (v0.1.23)
- Almacenamiento R2: grid + modal preview (v0.1.22)
- Unidades dentro de Listado de precios; sin menú aparte (v0.1.21)
- Listado precios: presentaciones con N unidades + precios (v0.1.20)
- Productos por fases (Odoo) + specs libres + sin reseñas admin (v0.1.19)
- Ofertas DB + seed 3 ejemplos + ERP publicar (v0.1.18)
- ERP shell fijo + Productos / Listado de precios (v0.1.17)
- Subir imagen botón primario (v0.1.16)
