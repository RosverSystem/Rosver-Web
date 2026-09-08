# Pendientes — Rosver Web

Última actualización: 2026-09-08

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P01 | Google OAuth (Client ID + Secret) | Auth completo | bloqueado | Falta credenciales Google Cloud |
| P02 | Facebook login | UI login/registro | pendiente | Botón placeholder |
| P03 | Pedidos / cotizaciones reales en `/cuenta` | Auth + cuenta | pendiente | Siguen mocks |
| P04 | UI admin roles/permisos | Auth RBAC | pendiente | API lista |
| P10 | CRUD Productos ERP + API | Pedido ERP | parcial | Destacado PATCH/DELETE OK (v0.1.12). Falta ficha completa + R2 |
| P15 | Catálogo vivo en tienda (sin F5) | Pedido UX SPA | parcial | Taxonomía + featured Redis; productos live si hay filas |
| P16 | Selector empaque + precio en carrito/ficha | Precios unidades | pendiente | Carrito aún por slug; falta packagingId |
| P17 | Specs UI (atributos + unidades variables) | Specs | pendiente | Tablas `spec_*` listas; falta pantallas ERP/ficha dinámica |
| P18 | Filtro categoría incluye subcategorías | Filtros | pendiente | Hoy filtra solo por slug exacto |
| P19 | Módulo Ofertas ERP (vincular price_kind=offer) | Ofertas | pendiente | Página admin aún vacía |
| P20 | Tipos de unidad UI dedicada | Unidades | pendiente | API POST lista; se crean desde listado o seed |
| P21 | Mega-menú topbar con imágenes / columnas | Topbar cats | pendiente | Hoy lista raíz + hijos |
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
| P26 | Subir imagen categoría a R2 (no solo URL) | Categorías home | pendiente | Hoy pide URL |
| P27 | Destacados home Postgres + Redis | Pedido lógica | hecho | Doc 05 + v0.1.12 + Redis Railway |
| P28 | Volumen persistente Redis / Redis oficial template | Infra | recomendado | Hoy imagen `redis:7-alpine` sin volume |

## Hechos recientes

- Destacados para ti: lógica 100% + Redis Railway (v0.1.12)
- CRUD categorías/marcas + campos home + live taxonomía (v0.1.11)
