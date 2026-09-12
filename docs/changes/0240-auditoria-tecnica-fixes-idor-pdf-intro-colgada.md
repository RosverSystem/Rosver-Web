# Cambio: Auditoría técnica priorizada — fix IDOR PDF pedidos/cotizaciones + cortina de intro que podía colgarse

**Fecha:** 2026-09-12
**Tipo:** fix

## Qué cambió

- **IDOR en `PUT /api/orders/:id/pdf` y `PUT /api/quotes/:id/pdf`** (sin auth por diseño, ya que el pedido/cotización puede crearse sin sesión): cualquiera que obtuviera el UUID interno podía **sobrescribir** el PDF ya guardado de un pedido/cotización ajeno con contenido arbitrario, y el endpoint aceptaba cualquier binario etiquetado como PDF sin verificar la cabecera real. Se agregó:
  - Verificación de magic bytes (`%PDF-`) antes de aceptar el archivo.
  - Regla "una sola subida": si el pedido/cotización ya tiene `pdf_bytes`/`pdf_r2_key`, el endpoint responde `409` en vez de sobrescribir.
- **Cortina de intro (`IntroTransition.tsx`) podía quedar colgada indefinidamente**, bloqueando todos los clics de la página (overlay `fixed inset-0 z-[100]`) si el timeline de GSAP no llegaba a completar `onComplete` (pestaña en segundo plano, jank, etc.). Reproducido en dev (`vite`) y en build de producción servido por `boot.ts`: el overlay permanecía en el DOM más de 10s y el intento de login no llegaba a disparar el `POST /api/auth/login` porque el clic caía sobre el overlay. Se agregó un tope de seguridad (`setTimeout` 4000ms) que fuerza `setDone(true)` si el timeline no terminó solo, sin tocar la animación normal.
- Verificado (sin cambios de código, todo en verde): `tsc -b`, `typecheck:server`, `oxlint` (solo warnings preexistentes), `npm run build`, `npm run db:migrate` (42 migraciones, local), `test:security` (13/13), `test:oauth-state` (7/7), `test:promo-calc` (16/16). Total 36 aserciones automatizadas, 0 fallos.
- Confirmado con pruebas HTTP reales (curl) contra el server local: rate limit de login (429 tras 5 intentos fallidos), 401 en `/api/admin/*` sin sesión, todos los routers `admin*.ts` aplican `requireAuth + requireRole('admin')` a nivel de router, `/orders/mine` y `/orders/mine/:code` filtran por `user_id` de sesión (sin IDOR), CORS no refleja orígenes arbitrarios con `credentials:true`, cookies de sesión `HttpOnly` + `SameSite=Lax` + `Secure` en prod.

## Por qué

Pedido del usuario: auditoría técnica con pruebas reales (no solo lectura de código) de todo el proyecto, priorizando hallazgos CRÍTICO/ALTO con evidencia y arreglándolos en la misma sesión.

## Cómo

- El fix de PDF evita tocar el flujo legítimo (el cliente sube el PDF una sola vez, justo tras crear el pedido/cotización, sin sesión) — solo bloquea la **segunda** escritura sobre el mismo id, que es el escenario de abuso.
- El fix de la cortina no cambia la animación (`REGLA DE PRODUCTO — NO TOCAR` en el propio archivo se respeta): solo agrega una salida de emergencia si algo impide que el timeline termine solo.
- Alcance de esta sesión: pase priorizado (elegido explícitamente por el usuario) — no cobertura exhaustiva de cada punto del pedido original (ver `docs/pendientes/README.md` para lo que queda para próximas sesiones).

## Archivos

- `RosverSac/server/src/routes/orders.ts`
- `RosverSac/server/src/routes/quotes.ts`
- `RosverSac/src/app/layout/IntroTransition.tsx`
- `docs/pendientes/README.md` (informe de auditoría)

## Cómo verificar

- [x] `cd RosverSac && npx tsc -b` — sin errores
- [x] `npm run typecheck:server` — sin errores
- [x] `npm run lint` — solo warnings preexistentes (sin errores)
- [x] `npm run build` — build OK
- [x] `npm run db:migrate` — 42/42 migraciones OK contra Postgres local
- [x] `npm run test:security && npm run test:oauth-state && npm run test:promo-calc` — 36/36 OK
- [x] Repro IDOR PDF: crear pedido → `PUT /api/orders/:id/pdf` (200) → segunda subida al mismo id → ahora `409` (antes: `200`, sobrescribía)
- [x] Repro magic bytes: `PUT /api/orders/:id/pdf` con base64 que no empieza en `%PDF-` → `400` (antes: `200`, lo guardaba igual)
- [x] Repro cortina colgada: `document.querySelectorAll('.fixed.inset-0.z-[100]').length` seguía en `1` pasados 10s en build de producción (`npm run start`) → tras el fix, `0` a los ~4s como máximo
- [x] Login admin real (browser) hasta el paso de OTP por correo (no se completó el OTP: requiere buzón SMTP real, fuera del alcance de este sandbox)
- [ ] _(No UI nueva — sin checklist de breakpoints)_
