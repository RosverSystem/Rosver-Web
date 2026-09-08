# Pendientes — Rosver Web

Última actualización: 2026-09-08 (pasada de recomendaciones post-auditoría, 0126–0132)

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P01 | Google OAuth (Client ID + Secret) | Auth completo | bloqueado | Falta credenciales Google Cloud |
| P02 | Facebook login | UI login/registro | pendiente | Botón placeholder |
| P03 | Pedidos / cotizaciones reales en `/cuenta` | Auth + cuenta | parcial | Local desde carrito (v0.1.32); falta API Postgres |
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
| P05 | Recuperación de contraseña | Auth | hecho | `/recuperar` + `POST /api/auth/reset-password`; revoca sesiones viejas (0125) |
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
| P37 | CRUD completo presentaciones/precios/tipos + AdminSelect | Pedido reglas 14/16 | hecho | v0.1.26 |
| P38 | Formularios ERP solo en AdminModal (regla 17) | Pedido UX ERP | hecho | v0.1.27 |
| P39 | Vista previa tienda en producto/categoría ERP | Pedido UX | hecho | v0.1.28 |
| P40 | Almacenamiento «Todos» vacío (Delimiter R2) | Bug ERP | hecho | v0.1.29 |
| P41 | Lógica carrito (persistencia + sync catálogo) | Pedido lógica | hecho | v0.1.30 localStorage |
| P42 | Continuar pedido: PDF cotización + WhatsApp | Pedido UX | hecho | v0.1.31 jspdf; WA sin adjunto auto |
| P43 | Badge carrito fantasma + pedido ligado a sesión | Bug + lógica | hecho | v0.1.32 visibleCount + local orders |
| P44 | Login sin protección contra fuerza bruta | Auditoría seguridad | hecho | Rate limit por email+IP (0125), ver R01 |
| P45 | IDs con formato inválido en API admin → 500 sin controlar | Auditoría seguridad | hecho | Middleware `validateUuidParams` (0125) |
| P46 | URL sin match (typo, link roto) → pantalla en blanco total | Auditoría QA | hecho | Catch-all `NotFoundPage` (0125) |
| P47 | Carrito se vacía en cada carga completa de página | Auditoría QA (bug crítico) | hecho | Race mocks vs API real en `CartCatalogSync` (0125) |
| P48 | Registro se rompe (500) si falla el envío del OTP por correo | Auditoría QA (bug crítico) | hecho | `mail.ts` degrada a consola en vez de tumbar el request (0125) |
| P49 | Cuenta sin verificar tras fallo de OTP queda bloqueada (409 para siempre) | Auditoría QA | hecho | `/register` retoma cuentas no verificadas (0125) |
| P50 | Google OAuth callback sin validar `state` (CSRF) | Auditoría seguridad | hecho | Compara cookie vs query param (0125) |
| P51 | `server/src` sin typecheck (no está en ningún `tsconfig`) | Auditoría calidad | hecho | `server/tsconfig.json` + `npm run typecheck:server` (0125) |
| P52 | Admin: gestión de usuarios (listar/cambiar rol/estado) | Auditoría seguridad (refina P04) | hecho | API `admin-users.ts` (listar, cambiar rol, activar/desactivar con revocación de sesiones) + UI `/admin/usuarios` (0126) |
| P53 | Pedidos / Leads / Cotizaciones / Contenido: permisos RBAC existen, sin rutas API ni tablas | Auditoría (refina P03) | pendiente | `admin.orders`, `admin.leads`, `admin.quotes`, `admin.content` sin backend; páginas admin son mocks locales; formulario de contacto no persiste lead |
| P54 | Orden destacado/tendencia a mano + tipo precio confuso | Pedido UX precios | hecho | v0.1.35 orden auto + combobox unidad + solo oferta extra (0133) |
| P55 | Quitar «Agregar otro producto a la lista» en /cotizar | Pedido UX | hecho | v0.1.36 / 0134 |
| P56 | PDF cotización: logo + pie web + QR personalizado | Pedido UX | hecho | v0.1.37 / 0135; rediseño comercial (no factura) v0.1.38 / 0136 |

## Hechos recientes

- PDF cotización comercial (no factura): total estimado, logo, pie web, QR (v0.1.38 / 0136)
- PDF cotización: logo `logo_sinfondo.png`, pie visita web, QR con `?ref=` (v0.1.37 / 0135)
- Cotizar: sin botón «Agregar otro producto a la lista» (v0.1.36 / 0134)
- Precios ERP: orden auto, unidad escribir/elegir, oferta sin “tipo de precio” (v0.1.35 / 0133)
- Recomendaciones post-auditoría: E2E Playwright (0132), historial de precios (0131), sesión deslizante (0130), code-split bundle (0129), audit log de logins (0128), rate limiter en Redis (0127)
- Admin: gestión de usuarios real (listar/rol/activar-desactivar) (0126)
- Auditoría E2E + seguridad: carrito, OTP, reset password, rate limit, 404 (v0.1.33 / 0125)
- Badge carrito solo catálogo + Continuar pedido con sesión/prefill + pedidos locales (v0.1.32)
- Continuar pedido: modal PDF estilo factura + WhatsApp (v0.1.31)
- Lógica carrito: localStorage, sync catálogo, sin seed fantasma (v0.1.30)
- Fix listado R2 «Todos» sin Delimiter (v0.1.29)
- Preview ProductCard / CategoryHomeCard en modales ERP (v0.1.28)
- Regla 17 + Ofertas/Categorías/Productos/Precios/Unidades en `AdminModal` (v0.1.27)
- CRUD C/R/U/D presentaciones, precios y tipos de unidad + AdminSelect (v0.1.26)
- Presentación: tipo + cantidad + precio en un paso (v0.1.25)
- Listado precios: presentación (tipo+cantidad) → varios precios (v0.1.24)
- Marcas en modal + selector R2 con búsqueda y nombre al subir (v0.1.23)
- Almacenamiento R2: grid + modal preview (v0.1.22)
- Unidades dentro de Listado de precios; sin menú aparte (v0.1.21)
- Listado precios: presentaciones con N unidades + precios (v0.1.20)
- Productos por fases (Odoo) + specs libres + sin reseñas admin (v0.1.19)
- Ofertas DB + seed 3 ejemplos + ERP publicar (v0.1.18)
- ERP shell fijo + Productos / Listado de precios (v0.1.17)
- Subir imagen botón primario (v0.1.16)
