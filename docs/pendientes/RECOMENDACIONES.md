# Recomendaciones — Rosver Web

Ideas útiles **no pedidas** aún. No implementar solas; esperar OK del usuario.

| ID | Recomendación | Por qué | Prioridad sugerida |
| --- | --- | --- | --- |
| R01 | Rate limit login / OTP en API | Mitigar fuerza bruta | hecho (0125, 5 fallos/10min → bloqueo 5min por email+IP, en memoria) |
| R02 | Refresh de sesión / rotación cookie | Seguridad sesiones largas | hecho (0130, expiración deslizante: si a la sesión le queda menos de la mitad de su vida útil, se extiende sola en vez de forzar login) |
| R03 | Code-split del bundle JS (>500 kB) | Lighthouse / móvil | hecho (0129, lazy-load de `/admin/*` + jsPDF diferido a la descarga; el aviso de chunk >500kB desapareció) |
| R04 | Página “Olvidé mi clave” + OTP email | Completar auth | hecho (0125, ver P05) |
| R05 | Menú cuenta en header (perfil, logout, admin) | UX sesión | hecho (con P08) |
| R06 | Audit log de logins | ERP / compliance | hecho (0128, tabla `login_audit` + panel en `/admin/usuarios`) |
| R07 | Tests e2e login (Playwright) | Regresión auth | hecho (0132, `npm run test:e2e`, 9 tests de humo: home/catálogo/404 + login inválido/redirects/registro) |
| R08 | Separar servicio API si el tráfico crece | Escala | no accionable hoy — nota de arquitectura para si el tráfico crece, no hay nada concreto que implementar ahora |
| R09 | Widgets KPIs en dashboard ERP | Valor gestión | media — diferida junto con R21: sin Pedidos/Ventas reales no hay datos verdaderos que mostrar como KPI (evitar KPIs con datos falsos) |
| R10 | Command palette (⌘K) en top bar ERP | Productividad | parcial | Ya hay search ⌘K funcional en el top bar; el palette completo (acciones, no solo navegar) queda opcional/baja, no se tocó en esta pasada |
| R11 | Tooltips en sidebar colapsada | Accesibilidad iconos | hecho | Ya existía `title` nativo en cada ícono/enlace colapsado (`AdminSidebar.tsx`); no requirió cambio de código, solo verificación |
| R12 | Historial de precios (auditoría) en ERP | Compliance / márgenes | hecho (0131, tabla `price_audit` + panel en «Listado de precios» por producto) |
| R14 | Seed categorías demo con tagline/puntos/imagen | Arranque tienda sin mocks | hecho | Migración `007` |
| R15 | Logo marca en admin (upload R2) | Filtro + marquee con logo real | hecho | v0.1.15 |
| R17 | Categorías / productos: mismos modales + media picker | Paridad UX con marcas | hecho | Cats/unidades/marcas en AdminModal; **productos** → ficha CRM (0218) |
| R18 | Rate limiter de login en Redis (no en memoria) | Si el API corre en >1 instancia, el límite actual es por proceso | hecho (0127, usa Redis si está configurado — hoy deshabilitado en este entorno — y sigue degradando a memoria si Redis no está o falla) |
| R19 | Revisar SMTP en entornos (local ya OK con 587; Railway) | Local: 465 ETIMEDOUT → 587 STARTTLS entrega OK (0145). Confirmar mismas vars en Railway prod | media |
| R20 | Implementar `admin.users` (listar/editar rol/estado) | RBAC ya soporta el permiso; falta ruta + UI (ver P52) | hecho (0126) |
| R21 | Definir e implementar Pedidos/Leads/Cotizaciones reales (tablas + API) | Cotizaciones + pedidos carrito OK (0181–0183); leads/contenido aún mock (P53) | media — leads/content pendientes |
| R22 | Actualizar `@types/nodemailer` (v8) a una versión acorde a `nodemailer` v10 instalado | Desalineación de versiones entre tipos y runtime; no causó error hoy pero es frágil | bloqueada — 8.0.1 ya es la versión más reciente publicada de `@types/nodemailer`; no hay nada más nuevo que instalar (verificado con `npm view`) |
| R23 | Revisar/limpiar productos y unidades de prueba visibles en catálogo público (ej. "asdasd", "fsfds", "asdas") | Encontrados durante la auditoría navegando `/catalogo`; no son bug de código, es dato de prueba real ya en la DB | hecho (0126, borrados de Postgres) |
| R24 | Documentar en README el flujo `db:setup` + Postgres local | Hoy vive en `08` §1.1; README aún dice “no hay backend” | baja |
| R25 | Confirmar URL exacta de Instagram Rosver | Se usó `instagram.com/rosver.sac` alineado a TikTok; Rosa puede corregir el handle | media |
| R26 | Email automático al registrar/responder hoja del libro de reclamaciones | Hoy solo constancia en pantalla + bandeja admin (0159) | media |
| R27 | Guardar mensajes de contacto (incl. DNI/RUC) en Postgres | Cubierto en 0172 / P91 | hecho |
| R28 | Chromium en Railway para `GET /api/catalog/pdf` (Puppeteer) | Local OK; prod puede fallar sin Chrome | alta — al desplegar |
| R29 | Volver Kanban de pedidos como vista alternativa (toggle tabla/tablero) | Tabla es la vista activa (0197); Kanban quedó documentado en 0192–0194 | baja |
| R30 | Alta de pedido desde admin (hoy solo desde carrito / link público) | Completar Create en ERP si lo piden | baja |
| R31 | Diseñar contenido de `/admin/pedidos/vista` (detalle completo del pedido) | Cubierto en 0202–0203 (pipeline + productos + evidencias) | hecho |
| R32 | Cupones / stacking de varias promociones sobre combos | Pedido en plan combos (fuera de 0230) | baja |
| R33 | Comentario escrito al calificar (opcional) o desde `/cuenta` | Voto 1–5 ya público (0232); texto sigue en P30 | baja |
| R34 | Notas internas / historial de contactos en ficha cliente | CRM liviano (0235); útil para seguimiento comercial | baja |
| R35 | Habilitar dominio público R2 (`r2.dev` o custom) y set `R2_PUBLIC_BASE_URL` | Hoy logos de mail usan CDN del sitio; media R2 seguiría vía `/api/media` | baja |



