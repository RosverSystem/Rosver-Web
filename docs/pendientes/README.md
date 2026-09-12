# Pendientes — mapa del proyecto Rosver

**Última actualización:** 2026-09-12 · App `rosver-sac` **v0.1.48**  
**Repo:** [RosverSystem/Rosver-Web](https://github.com/RosverSystem/Rosver-Web) · ERP interno **SystemRSV**

Registro vivo entre pedidos (regla `12-pendientes-recomendaciones`).  
Detalle histórico: [PENDIENTES.md](./PENDIENTES.md) · ideas: [RECOMENDACIONES.md](./RECOMENDACIONES.md).

---

## Auditoría técnica 0240 (2026-09-12) — pase priorizado

Pedido del usuario: auditoría técnica completa con pruebas reales (no solo lectura de código). Alcance elegido explícitamente por el usuario entre 3 opciones: **pase priorizado** — build/lint/typecheck/tests reales, flujos críticos probados con HTTP real y en navegador, revisión de seguridad enfocada (auth, IDOR, inputs, secrets), arreglo inmediato de lo CRÍTICO/ALTO encontrado. El resto (tests E2E nuevos exhaustivos por cada edge case del pedido original, cobertura de BD/rendimiento a fondo) queda pendiente abajo para siguientes sesiones. Detalle completo: [`docs/changes/0240-auditoria-tecnica-fixes-idor-pdf-intro-colgada.md`](../changes/0240-auditoria-tecnica-fixes-idor-pdf-intro-colgada.md).

### Comandos ejecutados

```bash
cd RosverSac
npx tsc -b                    # OK, 0 errores
npm run typecheck:server      # OK, 0 errores
npm run lint                  # OK, solo warnings preexistentes (react-hooks/set-state-in-effect)
npm run build                 # OK
npm run db:migrate            # OK, 42/42 migraciones contra Postgres local
npm run test:security         # OK, 13/13 aserciones
npm run test:oauth-state      # OK, 7/7 aserciones
npm run test:promo-calc       # OK, 16/16 aserciones
npm run start                 # server real (build + API) en :8787 para pruebas HTTP y de navegador
```

Total: **36/36 aserciones automatizadas existentes pasaron** (0 fallos). No se crearon tests nuevos en este pase (fuera del alcance elegido).

### Pruebas manuales reales ejecutadas (curl + navegador)

| Prueba | Resultado |
| --- | --- |
| `POST /api/auth/login` con credenciales inválidas, body vacío, JSON malformado, intento de SQLi en el campo email, payload de 200KB | Todos devuelven `400`/`401` controlados, sin stack traces ni crash |
| Fuerza bruta: 10 intentos de login seguidos | `429` a partir del 6.º intento (rate limit activo); confirmado que también bloquea el intento válido subsiguiente durante la ventana (comportamiento esperado, no bug) |
| `GET /api/admin/users` sin sesión | `401` |
| Los 10 archivos `admin*.ts` de rutas | Todos aplican `requireAuth + requireRole('admin')` a nivel de router (`.use('*', ...)`) — sin rutas admin huérfanas sin guardia |
| `GET /api/orders/mine` y `/mine/:code` | Filtran por `user_id` de la sesión — sin IDOR |
| **`PUT /api/orders/:id/pdf` y `/api/quotes/:id/pdf` sin sesión** | **IDOR confirmado y corregido** (ver tabla de hallazgos) |
| Cookies de sesión | `HttpOnly`, `SameSite=Lax`, `Secure` en producción (`config.isProd`) |
| CORS con `credentials:true` | No refleja orígenes arbitrarios; fallback seguro a la lista configurada |
| Login admin en navegador real (Chrome vía Browser pane) hasta OTP | Login válido dispara correctamente el paso de código OTP por correo (2FA); no se completó el código por no tener acceso al buzón SMTP real en este sandbox |
| Homepage, catálogo, guardas de ruta (`/admin` sin sesión → redirige a login) | Sin errores de consola, renderizan correctamente |

### Hallazgos

| Problema | Severidad | Evidencia | Solución | Estado |
| --- | --- | --- | --- | --- |
| IDOR en `PUT /api/orders/:id/pdf` y `PUT /api/quotes/:id/pdf`: sin control de propiedad, cualquiera con el UUID interno podía **sobrescribir** el PDF ya guardado de un pedido/cotización ajeno, y el endpoint aceptaba cualquier binario etiquetado como PDF sin validar la cabecera real | **ALTO** | Reproducido con curl: se creó un pedido real, se subió un PDF, y una segunda llamada anónima al mismo endpoint lo sobrescribía sin error (`200`) | Verificación de magic bytes `%PDF-` + regla "una sola subida" (`409` si ya existe `pdf_bytes`/`pdf_r2_key`) en ambos endpoints | **RESUELTO** |
| Cortina de intro (`IntroTransition.tsx`) podía quedar colgada indefinidamente si el timeline de GSAP no completaba (pestaña en 2.º plano, jank), dejando un overlay `fixed inset-0 z-[100]` que bloquea **todos los clics** de la página, incluido el login | **ALTO** (bloquea el uso completo del sitio si ocurre) | Reproducido en dev y en build de producción (`npm run start`): overlay seguía en el DOM (`document.querySelectorAll('.fixed.inset-0.z-[100]').length === 1`) pasados 10+s; el clic en "Empezar" no disparaba `POST /api/auth/login` porque caía sobre el overlay | Tope de seguridad de 4000ms que fuerza el cierre de la cortina sin tocar la animación normal | **RESUELTO** |
| Bundle principal (`index-*.js`) pesa 634 KB (152 KB gzip); `quote-pdf` 430 KB, `floating-toasts` 286 KB, `html2canvas` 199 KB. Vite avisa de `INEFFECTIVE_DYNAMIC_IMPORT` en `quotes/index.ts` y `complaints-book/index.ts`: se importan estático **y** dinámico a la vez en `App.tsx`, así que el `React.lazy` no separa el chunk como se esperaba | **MEDIO** (rendimiento, regla `06-performance`) | Salida real de `npm run build` (warnings de rolldown/vite) | No corregido en este pase — requiere decidir si esas features deben ser lazy de verdad (quitar el import estático) o aceptarse como parte del bundle inicial | **PENDIENTE** |
| Rate limit de login bloquea también el intento **correcto** una vez se gatilla por intentos fallidos previos (mismo email) | **BAJO** (comportamiento esperado de la mayoría de sistemas anti-bruteforce, pero puede confundir a un admin real que erró la clave un par de veces) | Confirmado con curl: tras 5 fallos, un 6.º intento con la contraseña correcta también devuelve `429` | No es un bug de seguridad; queda como nota de UX si se quiere un mensaje más claro ("espera Xs") — ya lo devuelve (`Vuelve a intentar en 14s`) | **NO ACCIONABLE** (funciona como se espera) |
| Perfil de avatar (`profile.ts POST /avatar`) valida el tipo de archivo por `file.type` (MIME declarado por el cliente), no por los bytes reales | **BAJO** | Lectura de código: `ALLOWED_TYPES.has(file.type)` sin chequeo de magic bytes | Recomendado para un pase futuro: validar cabecera real de imagen antes de subir a R2 | **PENDIENTE** |

### Qué NO se cubrió en este pase (queda para siguientes sesiones)

Por elección explícita de alcance (pase priorizado, no el barrido exhaustivo de cada punto del pedido original):

- Tests unitarios/integración/E2E **nuevos** (Playwright ya está instalado — `test:e2e` — pero no se ejecutó ni se agregaron specs nuevos en este pase).
- Revisión exhaustiva de N+1 queries, índices y constraints en las 42 migraciones.
- Fuzzing sistemático de cada endpoint con inputs límite (strings gigantes, unicode, tipos incorrectos) más allá de auth/orders/quotes.
- Auditoría de dependencias vulnerables (`npm audit` no se corrió).
- Revisión de accesibilidad (a11y) y de cada breakpoint responsive.
- Medición de rendimiento real (Lighthouse / tiempos de respuesta bajo carga).
- Completar el flujo de login con OTP real (requiere buzón de correo, no disponible en este sandbox).

### Riesgos que siguen abiertos

- El bundle de 634 KB puede afectar el LCP en conexiones móviles lentas (regla `06-performance`) — ver hallazgo MEDIO arriba.
- No hay `npm audit` reciente documentado; dependencias como `xlsx`, `puppeteer`, `pdf-lib` conviene revisarlas periódicamente por CVEs conocidos del ecosistema.
- Validación de archivos subidos (avatar, evidencias de pedido) confía en el MIME declarado por el cliente, no en los bytes reales.

---

## Cómo usar esta carpeta

| Archivo | Contenido |
| --- | --- |
| **Este README** | Inventario + estado real de deudas |
| [PENDIENTES.md](./PENDIENTES.md) | Tabla P01… historial |
| [RECOMENDACIONES.md](./RECOMENDACIONES.md) | Ideas no pedidas |

---

## Estado de cierre (evidencia 0237)

### PENDIENTES REALES DE IMPLEMENTACIÓN: 0

Todo lo que se podía cerrar en código quedó implementado y verificado con tests/build donde aplica.

### BLOQUEADO EXTERNO (no son deudas de código)

| ID | Qué falta | Acción humana |
| --- | --- | --- |
| **P01-ops** | Credenciales Google Cloud OAuth | Crear Client ID/Secret → `GOOGLE_*` en Railway + `.env` → probar login Google |
| **P99-ops** | DNS `rosversac.com` → Railway | Cloudflare A/CNAME + SSL + custom domain Railway (checklist en `docs/architecture/08` §4) |

El código OAuth y la prep de dominio/CORS/cookies **sí están listos**; sin keys/DNS no se puede afirmar “en producción con Google / dominio canónico”.

---

## 1. Qué es el proyecto

**Rosver SAC** — web de **importaciones** + ERP **SystemRSV** (`RosverSac/`).

**Stack:** React 19 + Vite + Tailwind v4 · Hono · Postgres · Redis (caché) · R2 · Railway.  
**Local:** UI `:5173` · API `:8787`.

---

## 2. Inventario ERP (resumen)

| Módulo | Ruta | Estado |
| --- | --- | --- |
| Inicio | `/admin` | Dashboard KPIs |
| Analítica | `/admin/analitica` | Demanda + gráficas |
| Roles | `/admin/roles` | Matriz permisos (P04) |
| Usuarios | `/admin/usuarios` | Rol/estado |
| Contactos | `/admin/leads` | `contact_messages` real (P53) |
| Contenido | `/admin/contenido` | `site_content` hero (P53) |
| Clientes / Pedidos / Cotizaciones / Catálogo / … | `/admin/…` | Operativos |

Cuenta: `/cuenta/resenas` comentarios de calificación (P30).

---

## 3. Qué se resolvió en 0237

| ID | Resultado | Evidencia |
| --- | --- | --- |
| P01 | Código OAuth completo + tests sin keys | `test:oauth-state`; Secure cookie; `.env.example` |
| P04 | UI Roles + DELETE no-sistema | `/admin/roles` |
| P14 | Deploy fuerza SHA | `railway-deploy.ps1` + health `commitSha` |
| P22 | CSV `rosver-csv-v1` | Parser + modal accept `.csv` |
| P28 | Arquitectura: sin volumen Redis | `08` §P28 |
| P30 | Comentarios reseña | API + `/cuenta/resenas` |
| P53 | Leads + contenido DB | mig `040` |
| P129 | Auto 2×1 server-side | mig `041` + orders/quotes |
| P130 | Migrate offers→combos | script + apply local 3 |
| P99 | Prep CORS/www/cookies/docs | DNS = bloqueo externo |

---

## 4. Cómo verificar (comandos)

```bash
cd RosverSac
npm run test:security
npm run test:oauth-state
npm run db:migrate
npx tsc -b
npm run build
# opcional local:
npx tsx server/scripts/migrate-offer-prices-to-combos.ts        # dry-run
npx tsx server/scripts/migrate-offer-prices-to-combos.ts --apply
```

---

## 5. Checklist al cerrar un pedido

- [ ] Filas en `PENDIENTES.md`
- [ ] `docs/changes/NNNN-slug.md`
- [ ] Migración SQL si hubo datos
- [ ] Actualizar **este README**
- [ ] Push + deploy solo si el usuario lo pide
