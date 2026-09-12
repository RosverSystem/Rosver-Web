# Pendientes — Rosver Web

Última actualización: 2026-09-12 (0240 auditoría técnica · v0.1.48)

## Cómo leer esta tabla

| Estado | Significado |
| --- | --- |
| **hecho** | Entregado en código + change |
| **parcial** | Arrancado; falta un pedazo concreto |
| **pendiente** | No empezado / no pedido a fondo |
| **bloqueado** | Falta clave, cuenta o decisión externa |
| **recomendado** | Idea de infra, no bloquea producto |

### PENDIENTES REALES DE IMPLEMENTACIÓN: 0

### BLOQUEADO EXTERNO (solo ops humano)

| ID | Cómo |
| --- | --- |
| **P01** | Google Cloud → OAuth Client ID/Secret → vars `GOOGLE_*` Railway/`.env` → probar login |
| **P99** | Cloudflare DNS apex+www → Railway custom domain + SSL (`08` §4) |
| **P130-ops** | Tras deploy prod: `npm run db:migrate-offers-to-combos -- --apply` |

### Hecho reciente (sesión)

| ID | Change |
| --- | --- |
| P101 analítica | 0233–0234 |
| P102 clientes | 0235 |
| Inicio ERP | 0236 |
| Cierre pendientes prod | 0237 |
| Auditoría técnica (IDOR PDF pedidos/cotizaciones + cortina de intro colgada) | 0240 |

### Pendiente de auditoría 0240 (no crítico, para siguiente sesión)

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P131 | Code-split real de `quotes`/`complaints-book` (hoy importados estático + dinámico a la vez, el lazy no separa el chunk) | Auditoría 0240 (`INEFFECTIVE_DYNAMIC_IMPORT` en build) | pendiente | Bundle principal 634 KB; decidir si quitar el import estático en `App.tsx` |
| P132 | Validar magic bytes reales (no solo MIME del cliente) en subida de avatar (`profile.ts`) y evidencias de pedido | Auditoría 0240 | pendiente | Riesgo bajo, mismo patrón que se corrigió en PDFs de pedidos/cotizaciones |
| P133 | Tests E2E nuevos (Playwright) + `npm audit` de dependencias | Pedido original de auditoría completa | pendiente | Fuera del alcance del pase priorizado elegido en 0240 |

| ID | Ítem | Origen | Estado | Notas / bloqueo |
| --- | --- | --- | --- | --- |
| P01 | Google OAuth (Client ID + Secret) | Auth completo | bloqueado | Falta credenciales Google Cloud |
| P02 | Facebook login | UI login/registro | cancelado | Eliminado de UI (0144); no se implementará |
| P05 | Recuperación de contraseña | Auth | hecho | OTP + TOTP-first si autenticador (0144) |
| P07 | 2FA UI perfil | Auth | hecho | Vincular/desvincular en `/cuenta/perfil` (0144) |
| P03 | Pedidos / cotizaciones reales en `/cuenta` | Auth + cuenta | hecho | 0214; `GET /api/orders|quotes/mine` |
| P04 | UI admin roles/permisos | Auth RBAC | pendiente | API lista |
| P10 | CRUD Productos ERP + API | Pedido ERP | hecho | v0.1.15 ficha + imagen R2 + specs |
| P15 | Catálogo vivo en tienda (sin F5) | Pedido UX SPA | hecho | Poll + live taxonomía/productos |
| P16 | Selector empaque + precio en carrito/ficha | Precios unidades | hecho | v0.1.15 packagingId en carrito |
| P17 | Specs UI (atributos + unidades variables) | Specs | hecho | v0.1.19 tipo+valor libres en wizard |
| P18 | Filtro categoría incluye subcategorías | Filtros | hecho | v0.1.15 árbol en filtro |
| P19 | Módulo Ofertas ERP (vincular price_kind=offer) | Ofertas | hecho | v0.1.18 seed + alta ERP + tienda DB |
| P20 | Tipos de unidad UI dedicada | Unidades | hecho | Integrado en Presentaciones (0216); `/admin/unidades` redirige |
| P21 | Mega-menú topbar con imágenes / columnas | Topbar cats | hecho | v0.1.15 |
| P22 | Import CSV / sync ERP externo | Catálogo | pendiente | Excel ELFA ya existe (0223+); falta sync genérico |
| P13 | ERP perfil solo sidebar | Pedido UX | hecho | v0.1.7 |
| P06 | Avatar R2 | Perfil | hecho | |
| P08 | Header sesión | Login UX | hecho | |
| P09 | CLI railway login | Deploy | hecho | Account token `RipWolfx-Laptop` vía `RAILWAY_API_TOKEN`; proyecto `rosver-web` linked; CLI 5.50.2 |
| P14 | Force commitSha deploy | Deploy | **hecho** | Scripts ps1/sh + boot.ts + /api/health (0237) |
| P23 | UX ERP catálogo (cards + selects claros) | Pedido UX | hecho | v0.1.10; regla 14 |
| P24 | Regla migraciones DB en cada cambio | Pedido reglas | hecho | Regla `15` |
| P25 | Regla CRUD + vínculo inicio/menú | Pedido usuario | hecho | Regla 16 + v0.1.11 |
| P26 | Subir imagen categoría a R2 (no solo URL) | Categorías home | hecho | v0.1.15–0.1.16 botón Subir imagen |
| P27 | Destacados home Postgres + Redis | Pedido lógica | hecho | Doc 05 + v0.1.12 + Redis Railway |
| P28 | Volumen persistente Redis / Redis oficial template | Infra | recomendado | Hoy imagen `redis:7-alpine` sin volume |
| P29 | Tendencia + calificaciones / reseñas | Pedido lógica | hecho | Doc 06 + v0.1.13 |
| P30 | Reseñas con texto desde cuenta cliente | Calificaciones | **hecho** | Comentarios en `/cuenta/reseñas` + PATCH API + sanitización (0237) |
| P101a | Analítica demanda (vistas/pedidos/cotiz.) + panel gráficas | Pedido tendencia/analítica | hecho | 0233 · `/admin/analitica` · mig 038 |
| P102a | Módulo Clientes + interés productos + contacto oferta | Pedido CRM liviano | hecho | 0235 · mig 039 · flujo 09 |
| P132 | Inicio ERP dashboard operativo | Pedido UX | hecho | 0236 · `GET /api/admin/dashboard` |
| P31 | Slider marcas ↔ módulo marcas + seed | Pedido UI | hecho | v0.1.14 · migración `006` |
| P36 | Listado precios: tipo→cantidad→varios precios por presentación | Pedido UX | hecho | v0.1.24 flujo tipo ubicación |
| P37 | CRUD completo presentaciones/precios/tipos + AdminSelect | Pedido reglas 14/16 | hecho | v0.1.26 |
| P38 | Formularios ERP solo en AdminModal (regla 17) | Pedido UX ERP | hecho | v0.1.27; **excepción Productos** → ficha CRM (0218) |
| P39 | Vista previa tienda en producto/categoría ERP | Pedido UX | hecho | v0.1.28 |
| P40 | Almacenamiento «Todos» vacío (Delimiter R2) | Bug ERP | hecho | v0.1.29 |
| P41 | Lógica carrito (persistencia + sync catálogo) | Pedido lógica | hecho | v0.1.30 localStorage |
| P42 | Continuar pedido: PDF cotización + WhatsApp | Pedido UX | hecho | 0183: pedido DB + `/p/` 15d; WA corto |
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
| P53 | Pedidos / Leads / Cotizaciones / Contenido: permisos RBAC existen, sin rutas API ni tablas | Auditoría (refina P03) | hecho | 0237: leads + site_content; quotes/orders ya OK |
| P54 | Orden destacado/tendencia a mano + tipo precio confuso | Pedido UX precios | hecho | v0.1.35 orden auto + combobox unidad + solo oferta extra (0133) |
| P55 | Quitar «Agregar otro producto a la lista» en /cotizar | Pedido UX | hecho | v0.1.36 / 0134 |
| P56 | PDF cotización: logo + pie web + QR personalizado | Pedido UX | hecho | v0.1.37 / 0135; rediseño comercial (no factura) v0.1.38 / 0136 |

| P57 | Deploy Railway FAILED (EBUSY npm cache + commit viejo) | Ops | hecho | v0.1.39 nixpacks sin npm ci en build + deploy con commitSha (0137) |

| P58 | Redis WRONGPASS (user `default` vs requirepass) | Ops logs | hecho | v0.1.40 URL sin username + var Railway (0138) |
| P59 | Redis WRONGPASS residual (`$REDISPASSWORD` sin expandir en start) | Ops logs | hecho | startCommand `sh -c` + cliente host/pass (0139 / v0.1.41) |
| P60 | PDF cotización igual a factura impresa + pie web/QR | Pedido UX | hecho | v0.1.42 / 0140 |
| P61 | Postgres local para desarrollo (sin Railway) | Pedido setup | hecho | DB `rosver_local` + migrate/seed + `.env` (0141) |
| P62 | Login/registro responsive + sin scrollbar | Pedido UI | hecho | AuthSplitShell + auth-lock-scroll (0142) |
| P63 | Regla responsive todas las resoluciones (ancho+alto) | Pedido reglas | hecho | Regla `03` Cursor+Claude (0143) |
| P64 | Env local híbrido: Redis Railway + R2 (+ SMTP) | Pedido setup | hecho | `.env` + TCP proxy Redis (0143); Postgres local |
| P65 | Auth OTP autenticador + passwordless + pending 24h | Pedido auth | hecho | v0.1.43 / 0144 |
| P66 | OTP no llega + toasts + reenvío 30s / máx 3 | Pedido auth UX | hecho | SMTP 587 local; toasts; límite envíos (0145). Railway SMTP pendiente verificar |
| P67 | Login key + separador o; 2FA modal; Mis pedidos | Pedido UI | hecho | 0146 |
| P68 | OTP 5 min + email branded + assets R2 | Pedido UX/mail | hecho | 0147; logo/heroes en `brand/` R2 |
| P69 | OTP pegado con espacios + email centrado | Pedido UX | hecho | 0148 |
| P70 | Límite OTP se reinicia al login OK | Pedido auth | hecho | 0149 |
| P71 | Toasts tipados success/error/info/warning | Pedido UX | hecho | 0150 + regla 10 |
| P72 | Buscador universal + salto por SKU | Pedido UX | hecho | 0151 |
| P73 | Buscador: sugerencias + filtro en vivo (“no funciona”) | Pedido UX | hecho | 0152 |
| P74 | Toasts en cada guardado + animación Motion global | Pedido UX | hecho | 0153 |
| P75 | WhatsApp dual (980/960) + redes FB/TikTok/IG | Pedido UX | hecho | 0154; confirmar URL Instagram si no es @rosver.sac |
| P76 | Precio por unidad/paquete/caja en ficha + carrito | Pedido UX | hecho | 0155; seed RS-5402; ERP = listado precios |
| P77 | Footer por vistas + datos empresa SUNAT | Pedido UX | hecho | 0156–0157; sin categorías/sesión; Maps Jr Cusco 774 |
| P78 | Contacto: mapa + quitar “Sin cuenta” si hay sesión | Pedido UX | hecho | 0158 |
| P79 | Libro de reclamaciones (form + DB + footer) | Pedido legal/UX | hecho | 0159; falta email auto al consumidor (ver R26) |
| P80 | Mega-menú categorías: clic fuera + layout grid | Pedido UX | hecho | 0160 |
| P81 | Contacto: quitar mapa grande + FAQ | Pedido UX | hecho | 0161–0163 |
| P82 | Contacto: DNI/RUC + Decolecta razón social/nombre | Pedido UX | hecho | 0164; key en `.env` server |
| P83 | Ficha: código interno + specs técnicas ejemplo | Pedido UX | hecho | 0165; seed `015` RS-5402 |
| P84 | Código interno 8 dígitos (00000002) + contacto lookup UX | Pedido UX | hecho | 0166; seq `016`; phone/email separados |
| P85 | Menú Mi perfil + Mi empresa; prefill contacto/cotizar | Pedido UX | hecho | 0167; `/cuenta/empresa` |
| P86 | Footer: Libro de reclamaciones más visible | Pedido UX | hecho | 0168 |
| P87 | Footer ancho y menos alto | Pedido UX | corregido | 0169 malinterpretó; restaurado en 0170 (solo badge libro) |
| P88 | Menú: devolver Mis pedidos | Pedido UX | hecho | Junto a Mi perfil + Mi empresa |
| P89 | Selects/combobox diseño Rosver unificado | Pedido UX | hecho | 0171; `SelectCombobox` |
| P90 | Cotizar: quitar lista escrita / libre | Pedido UX | hecho | Solo catálogo |
| P91 | Contacto: guardar mensaje + email confirmación + WA 980 | Pedido UX | hecho | 0172; tabla `017` |
| P92 | Cotizar: ubigeo Perú + agencia + guardar DB | Pedido UX | hecho | 0174; `018_quote_requests` |
| P93 | Cotizar: ubigeo mal mapeado (Lima×3) + manual + seed DB | Pedido UX | hecho | 0178; `020_peru_ubigeo` + `db:seed-ubigeo` |
| P94 | Scroll nested todos los dropdowns + ubigeo 2026 + tablas Bootstrap | Pedido UX | hecho | 0180; Lenis `allowNestedScroll` |
| P95 | Cotizar: persistir dirección/ubigeo/agencia + admin real | Pedido UX | hecho | 0181; `GET /api/admin/quotes` |
| P96 | Cotizar: modal PDF + link público 15d + WhatsApp | Pedido UX | hecho | 0182; `/c/:slug` |
| P97 | Pedido carrito ≠ cotización; WA corto; destino+agencia | Pedido UX | hecho | 0183–0184; `/p/:slug` |
| P98 | Catálogo PDF flotante (carátula + índice + productos) | Pedido UX | hecho | 0186; FAB + react-pdf + pdf-lib |
| P99 | Cutover dominio **rosversac.com** + CDN Cloudflare → Railway | Pedido deploy | pendiente | Docs 0190 / `08` §4; por ahora local |
| P100 | Pedidos admin: pipeline CRM 5 fases | Pedido UX | hecho | 0191; `025_order_pipeline_status` |
| P101 | Pedidos admin: tabla Bootstrap + buscar/paginar + detalle/CRUD | Pedido UX | hecho | 0197; Kanban retirado; DELETE API; alta sigue desde carrito |
| P102 | Pedidos: columnas compactas + iconos CRUD + filtro en vivo | Pedido UX | hecho | 0198 |
| P103 | Pedidos: colores sólidos por fase | Pedido UX | hecho | 0199 |
| P104 | Pedidos: modal editar grande + datos arriba | Pedido UX | hecho | 0200 |
| P105 | Pedidos: vista full en blanco + URL query + FAB ERP | Pedido UX | hecho | 0201→0202 pipeline; FAB vuelve atrás |
| P106 | Pedidos: pipeline en vista workspace + Avanzar | Pedido UX | hecho | 0202 |
| P107 | Pedidos: productos + evidencias por fase (R2 aparte) | Pedido UX | hecho | 0203; migración `026` |
| P108 | Pedidos: SKU + modal al avanzar fase | Pedido UX | hecho | 0205 |
| P109 | Cotizaciones: mismo diseño admin que pedidos (pipeline) | Pedido UX | hecho | 0206; migración `027` |
| P110 | Reclamaciones: tabla Bootstrap + CRUD iconos | Pedido UX | hecho | 0207 |
| P111 | Productos: tabla Bootstrap + buscar/filtrar/paginar | Pedido UX | hecho | 0208; listado separado de ficha (0218) |
| P112 | Listado precios: tabla Bootstrap + buscar/paginar | Pedido UX | hecho | 0209; detalle presentaciones intacto |
| P113 | Admin: logo Rosver + pestaña «System» | Pedido UX | hecho | 0210 |
| P114 | System tipografía sidebar + código interno preview | Pedido UX | hecho | 0211; reiniciar API si hace falta |
| P115 | Productos: restaurar tabla + código interno + cat/sub + drag foto | Recover overwrite | hecho | 0213; listado en AdminProductsPage |
| P116 | Productos: ficha CRM página completa (sin modal) | Pedido UX | hecho | 0218; `/admin/productos/nuevo|:id` |
| P117 | Precios: elegir presentación guardada + oferta con fechas | Pedido UX | hecho | 0219; `031_product_price_validity` |
| P118 | Módulo Especificaciones (tipos ficha técnica) | Pedido UX | hecho | 0220; `/admin/especificaciones`; `032` |
| P119 | Specs: SKU = código 00000000 (preview al crear) | Pedido UX | hecho | 0221; `034_spec_attributes_internal_code` |
| P120 | Producto Fase 4: tipo+desc, sin unidad, drag orden | Pedido UX | hecho | 0222 |
| P121 | Import Excel ELFA + consola GSAP + JSON R2 privado | Pedido UX | hecho | 0223; catálogo vaciado previo |
| P122 | Formato JSON base + parser S/ y stretch film | Pedido UX | hecho | 0224; plantillas en Downloads |
| P123 | Import: sobrescribir si SKU/código coincide + advertencia | Pedido UX | hecho | 0225; previa lista + updatedCount |
| P124 | Import: F5 al llegar a «formato: PRODUCTOS ELFA PACK» | Bug UX | hecho | 0226; writeFile disparaba Vite HMR |
| P125 | IntroTransition: no saltar con sessionStorage (F5) | Pedido UX | hecho | 0227; corre en cada carga real |
| P126 | Import: plantilla Excel + errores en 1ª consola | Pedido UX | hecho | 0228; parse-issues + upsert SKU |
| P127 | Plantilla Excel: 2 hojas + colores + merges | Pedido UX | hecho | 0229; exceljs; compatible ELFA |
| P128 | Ofertas = combos ERP → tienda → pedido/cotización | Pedido UX | hecho | 0230; `035_offer_combos`; carrito lineKind=combo |
| P129 | Motor auto 2x1 sin agregar combo explícito | Ofertas | pendiente | Fuera de alcance 0230 |
| P130 | Migrar ofertas markdown viejas a combos | Ofertas | pendiente | Siguen vía price_kind=offer en ficha producto |
| P131 | Límite compra por usuario en combos + estrellas en pack/ficha | Pedido UX | hecho | 0231; `036_max_per_user`; ProductPage stars |

## Hechos recientes

- Inicio ERP: dashboard KPIs + pipeline + pendientes + atajos (0236 / v0.1.47)
- Módulo Especificaciones: CRUD tipos técnicos; defaults sistema no se borran (0220)
- Specs SKU numérico 00000000 con preview al crear (0221)
- Producto Fase 4: Agregar especificación, tipo+desc, sin unidad, drag orden (0222)
- Import productos Excel ELFA: modal consola GSAP, preview, R2 privado (0223)
- Precios en ficha: presentaciones del catálogo + oferta con inicio/fin (0219)
- Productos: alta/edición en ficha CRM (cabecera + fases + tabs + preview); listado solo navega (0218)
- Cuenta: pedidos y cotizaciones reales vía `/api/orders|quotes/mine` (0214)
- Productos admin restaurado: BootstrapTable + código interno + categoría/subcategoría + drag-drop foto verificado (0213)
- System con diseño (Oswald + acento) + código interno automático solo lectura (0211)
- Admin sidebar logo Rosver + título pestaña System (0210)
- Listado de precios: tabla Bootstrap + thumb + paginación (0209)
- Productos admin: tabla Bootstrap + thumb + filtro visibilidad + iconos editar/ocultar (0208)
- Reclamaciones admin: tabla Bootstrap + ver/responder/eliminar (0207)
- Cotizaciones admin: tabla + vista pipeline + evidencias (igual patrón pedidos) (0206)
- Pedidos: SKU/código en ítems + modal evidencias al Avanzar (0205)
- Pedidos: productos detallados + captura pago / datos envío / voucher / prueba entrega (0203)
- Pedidos: pipeline en `/admin/pedidos/vista` + FAB vuelve al listado (0202)
- Pedidos: botón ver → `/admin/pedidos/vista?codigo-pedido&codcliente` + FAB al ERP (0201)
- Pedidos: modal ver/editar XL con datos principales arriba (0200)
- Pedidos: badges de fase con color Rosver (azul / amarillo / negro / rojo / verde) (0199)
- Pedidos: Código/Cliente/Fecha/Fase + iconos ver/editar/borrar + buscador en vivo (0198)
- Pedidos admin: tabla Bootstrap + búsqueda + paginación + Ver detalles + eliminar (0197)
- Pedidos admin pipeline CRM (confirmación pedido/pago → envío → enviado → entregado) (0191)
- Pedidos Kanban UI estilo CRM (cabeceras color + total por fase) (0192)
- Sidebar colapsada: sin letras P/L/C del catálogo (0193)
- Pedidos Kanban estilo tablero limpio (Todo/In Progress) (0194)
- Sidebar colapsada: iconos catálogo (sin letras P/L/C) (0195)
- Sidebar fija sin colapsar + scroll invisible (0196)
- Sidebar: CSS forzado para ocultar scrollbar Windows (0196b)
- Dominio canónico **rosversac.com** documentado; cutover CDN pendiente; local activo (0190)
- Pedido: PDF título PEDIDO vs cotización COTIZACIÓN (0185)
- Catálogo PDF flotante profesional (carátula + índice + productos) (0186)
- Catálogo PDF sin índice: portada por categoría + grilla productos (0187)
- Catálogo PDF Puppeteer A4 completo (0188)
- Catálogo PDF: carátula unida + banda de marcas (no chip suelto) (0189)
- Pedido: destino + agencia en Continuar pedido; fix 404 API orders (0184)
- Pedido carrito: `order_requests`, link `/p/…` 15 días, WA corto, sin copy/agencia en modal (0183)
- Cotizar: ubigeo correcto (distrito/provincia), elegir a mano, seed Postgres 25/196/1892 (0178)
- Select: rueda scrollea lista y al límite sigue la página (0179)
- Scroll nested global + ubigeo padrón 2026 (25/196/1873) + tablas Bootstrap admin (0180)
- Cotizar: dirección/ubigeo/agencia en Postgres + admin real (0181)
- Cotizar: modal PDF, link `/c/nombre-qt-…` 15 días, WhatsApp con mensaje (0182)
- Contacto: persistencia DB, email confirmación, WA fijo 980 + mensaje cotizar (0172)
- Cotizar: eliminada pestaña «Pegar lista escrita / libre»
- Menú cuenta: Mi perfil + Mi empresa; Decolecta en empresa; prefill contacto/cotizar (0167)
- Código interno 8 dígitos + contacto: combobox, lupa, blur, phone/email (0166)
- Ficha producto: código interno (`products.code`) + specs técnicas demo (0165)
- Contacto: select DNI/RUC + lookup Decolecta (0164)
- FAQ contacto: estilo limpio Rosver (sin fondo/contorno Meta) + GSAP (0163)
- FAQ contacto: acordeón numerado + GSAP (0162)
- Contacto: FAQ en lugar del bloque ubicación grande (0161)
- Mega-menú categorías: cierra afuera/Escape; grid de columnas (0160)
- Libro de reclamaciones digital: form, Postgres, footer, admin (0159)
- Contacto: iframe Maps + badge según sesión (0158)
- Footer: sin Categorías ni “Wilson”; dirección Maps; sin ACTIVO/HABIDO (0157)
- Footer: Navegación · Datos empresa (SUNAT) · Contacto (0156)
- Ficha: selector presentación con precios; seed Paquete/Caja RS-5402; scroll búsqueda solo Enter (0155)
- WhatsApp secuencia 980202591 ↔ 960106901; redes FB/TikTok/IG (0154)
- Toasts animados (Motion) + ToastProvider global; éxito en CRUD/carrito/perfil/contacto (0153)
- Buscador: sugerencias al tipear + filtro en vivo en `/catalogo` (0152)
- Buscador header: coincidencia parcial + SKU abre ficha (0151)
- Toasts tipados Rosver (éxito/error/info/aviso) en toda la web (0150)
- OTP: tope de envíos se reinicia si entras bien (0149)
- OTP: limpia espacios al pegar; correo centrado y más cuidado (0148)
- OTP 5 min, correo con logo R2 estilo PayPal, heroes auth vía `/api/media/brand/` (0147)
- Login llave + «o»; 2FA en modal; vista Mis pedidos o compras (0146)
- OTP: correo real vía SMTP 587, toasts sin copy de “máx intentos”, reenvío 30s + tope 3 (0145)
- Auth: passwordless, TOTP vs email OTP, pending 24h, modal verify, 2FA perfil, reset TOTP-first, sin Facebook (v0.1.43 / 0144)
- Regla resoluciones (alto/ancho) + `.env` híbrido Redis/R2/SMTP (0143)
- Auth login/registro: viewport fijo, fluido por altura, sin scrollbar (0142)
- Postgres local `rosver_local` + API/Vite en marcha (0141)
- PDF cotización: layout factura Rosver + pie visita web/QR (v0.1.42 / 0140)
- Fix Redis requirepass: startCommand con shell + ioredis host/password (v0.1.41 / 0139)
- Fix Redis WRONGPASS: URL sin usuario `default` (v0.1.40 / 0138)
- Fix Railway EBUSY + redeploy con commit correcto (v0.1.39 / 0137)
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
