# Cambio: Auditoría E2E + seguridad del Ecommerce/ERP — bugs críticos corregidos

**Fecha:** 2026-09-08
**Tipo:** fix

## Qué cambió

Auditoría completa (QA + seguridad + full-stack) del Ecommerce + ERP: se mapeó la arquitectura real (Hono + Postgres + Redis opcional + R2, RBAC completo, sesiones server-side), se probaron los flujos reales (registro, login, 2FA, recuperación, catálogo, carrito, admin) y se corrigieron los bugs reales encontrados. Detalle completo en el informe de auditoría entregado en el chat (no se duplica aquí para no desactualizarse).

**Bugs críticos corregidos:**

1. **Carrito se vacía en cada carga completa de página.** `CatalogProvider` inicializa `products` con los mocks estáticos de forma síncrona (antes de que resuelva `/api/catalog`); `CartCatalogSync` sincronizaba contra esa lista mock — que tiene slugs distintos a los reales en DB — y borraba cualquier línea real del carrito antes de que llegaran los datos verdaderos. Se agregó `hasLoadedOnce` al `CatalogProvider` y `CartCatalogSync` espera a que el primer fetch real haya resuelto antes de podar el carrito.
2. **Registro se rompe con 500 si el envío del OTP por correo falla.** `sendOtpEmail` no capturaba errores de `nodemailer` (ej. SMTP con credenciales inválidas); un fallo de SMTP tumbaba todo `POST /api/auth/register` con 500. Ahora degrada a modo consola (igual que cuando no hay SMTP configurado) y el registro completa igual.
3. **Cuenta que falló en el paso anterior queda bloqueada para siempre.** Como el usuario ya se había insertado en `users` antes del fallo de correo, un segundo intento de registro con el mismo correo devolvía 409 sin forma de completar la verificación. `POST /api/auth/register` ahora retoma el registro si la cuenta existente no está verificada (actualiza contraseña/datos y reenvía OTP); si ya está verificada, sigue bloqueando como corresponde.
4. **Cualquier URL sin match (typo, link roto, sub-ruta inválida de `/admin` o `/cuenta`) mostraba una pantalla en blanco total** — sin header, footer ni mensaje. No existía ninguna ruta catch-all en React Router. Se agregó `NotFoundPage` como `<Route path="*">`.
5. **Un `id` con formato inválido en las rutas admin (`/api/admin/products/:id`, etc.) devolvía 500** en vez de un error controlado — Postgres rechaza el UUID malformado y el error no controlado subía hasta el handler genérico. Se agregó middleware `validateUuidParams` aplicado a las ~15 rutas afectadas en `admin-catalog.ts` y `admin.ts`.
6. **Login sin protección contra fuerza bruta.** No había límite de intentos. Se agregó un rate limiter en memoria (por email y por IP, 5 fallos/10min → bloqueo 5min) — ver `server/src/lib/rate-limit.ts`.
7. **CSRF en el callback de Google OAuth.** `/api/auth/google/start` generaba un `state` y lo guardaba en cookie, pero `/api/auth/google/callback` nunca lo comparaba contra el `state` devuelto por Google. Se agregó la validación.
8. **`<div>` (ícono de `cssvg-icons`) anidado dentro de un `<p>` en `PublicNavbar`** — HTML inválido, generaba error de hidratación en cada carga. Corregido a `<div>`.
9. **`server/src` nunca se typechequeaba** (no estaba en ningún `tsconfig`, solo corre vía `tsx` sin chequeo de tipos). Se agregó `server/tsconfig.json` + script `npm run typecheck:server`; se corrigieron los 2 errores de tipos reales que aparecieron (`mail.ts`, `redis.ts`).

**Flujo faltante implementado:** recuperación de contraseña completa — `POST /api/auth/reset-password` (valida OTP `purpose=reset_password`, actualiza `password_hash`, revoca sesiones anteriores del usuario, loguea) + página `/recuperar` (2 pasos: pedir código → código + contraseña nueva). El link "¿Olvidaste tu clave?" en `LoginPage` apuntaba a `/contacto`; ahora apunta a `/recuperar`.

**Verificado y sin cambios (no son bugs):** SQL injection (queries parametrizadas en todo el proyecto), XSS almacenado (sin `dangerouslySetInnerHTML`, React escapa todo), mass assignment en `/register` (zod strippea campos no declarados como `roleCode`), autorización RBAC (403 tanto en UI como en API para rutas `/admin/*` con usuario no-admin), rutas privadas sin sesión (401/redirect a `/login`), path traversal en `admin-storage`/`media` (rechaza `..` en la key).

## Por qué

Pedido explícito del usuario: auditoría completa QA + seguridad + full-stack del Ecommerce + ERP, con instrucción de no solo reportar sino probar, corregir y volver a probar.

## Cómo

- Se probó contra la base de datos Postgres real de Railway (no hay entorno local separado); se usaron cuentas de prueba con prefijo `audit-` y se limpiaron al cerrar (usuarios de prueba borrados, categorías con payloads de SQLi/XSS borradas).
- Nunca se expusieron credenciales reales: la cuenta admin sembrada se usó solo vía variables de entorno en scripts server-side (nunca impresas), y para pruebas de UI se creó una cuenta admin de prueba nueva (contraseña elegida por el auditor, no una real) directamente en la DB con el mismo hash argon2 del proyecto.
- El middleware de validación de UUID no exige versión/variante RFC4122 (solo la forma 8-4-4-4-12 hex) porque Postgres acepta cualquier UUID con esa forma; validar de más habría rechazado valores que la DB sí acepta (se detectó y corrigió en el mismo cambio, antes de dejarlo).

## Archivos

- `RosverSac/server/src/lib/mail.ts`, `redis.ts`, `session.ts`, `validation.ts` (nuevo `resetPasswordSchema`)
- `RosverSac/server/src/lib/rate-limit.ts` (nuevo)
- `RosverSac/server/src/middleware/validate-params.ts` (nuevo)
- `RosverSac/server/src/routes/auth.ts`, `admin.ts`, `admin-catalog.ts`, `admin-users.ts` (nuevo), `catalog.ts`
- `RosverSac/src/features/admin-users/ui/AdminUsersPage.tsx` + nav admin (CRUD usuarios real)
- `RosverSac/server/tsconfig.json` (nuevo)
- `RosverSac/src/app/App.tsx`, `RosverSac/src/app/pages/NotFoundPage.tsx` (nuevo)
- `RosverSac/src/app/layout/PublicNavbar.tsx`
- `RosverSac/src/features/auth/index.ts`, `model/auth-context.tsx`, `ui/LoginPage.tsx`, `ui/RegisterPage.tsx`, `ui/ResetPasswordPage.tsx` (nuevo)
- `RosverSac/src/features/cart/ui/CartCatalogSync.tsx`
- `RosverSac/src/features/catalog/model/catalog-store.tsx`
- `RosverSac/src/shared/lib/password-rules.ts` (nuevo, extraído de `RegisterPage` para reusar en `ResetPasswordPage`)
- `RosverSac/package.json` (nuevo script `typecheck:server`, versión 0.1.33)

## Cómo verificar

- [x] `npm run lint`, `npm run typecheck:server`, `npm run build` sin errores.
- [x] Registro → OTP (consola, SMTP caído) → verificar → sesión activa: funciona de punta a punta.
- [x] Reintentar registro con correo ya usado-pero-no-verificado: retoma en vez de bloquear.
- [x] Login: credenciales inválidas → mensaje genérico; 5 fallos → 429 con tiempo de espera.
- [x] `/recuperar`: pedir código → código + contraseña nueva → sesión activa, contraseña vieja ya no sirve.
- [x] Cliente autenticado contra `/admin` y contra `/api/admin/*`: 403/redirect en ambos casos.
- [x] Sin sesión contra `/cuenta` y `/api/profile`: redirect/401.
- [x] Agregar producto al carrito → recargar la página completa → el producto sigue ahí (antes se vaciaba).
- [x] URL inexistente (`/esta-pagina-no-existe`, `/admin/productos/id-invalido`): página 404 real, no pantalla en blanco.
- [x] `id` con formato inválido en API admin: 400 claro, no 500.
- [x] Panel admin probado con cuenta de prueba vía UI real (no solo API): Productos, Categorías, Ofertas cargan y funcionan; sin errores de consola.
- [x] _(UI)_ Verificado en móvil (375px) y desktop: Home, catálogo, carrito, admin.

## Pendiente (fuera de este cambio, ver `docs/pendientes/`)

La brecha más grande sigue siendo Pedidos/Leads/Cotizaciones/Contenido: los permisos RBAC existen pero no hay tablas ni rutas API — las pantallas admin correspondientes son mocks locales. No implementado en esta pasada porque requiere decisiones de modelo de datos (qué es un "Pedido", cómo se relaciona con el carrito/checkout) que valen una conversación aparte, no un fix de bug. Ver P53/R21.
