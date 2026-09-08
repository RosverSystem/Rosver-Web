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
| R17 | Categorías / productos: mismos modales + media picker | Paridad UX con marcas | hecho | Catálogo admin en AdminModal (0119: cats, unidades, productos wizard, precios) |
| R18 | Rate limiter de login en Redis (no en memoria) | Si el API corre en >1 instancia, el límite actual es por proceso | hecho (0127, usa Redis si está configurado — hoy deshabilitado en este entorno — y sigue degradando a memoria si Redis no está o falla) |
| R19 | Revisar credenciales SMTP en el entorno (falla con `535 auth failed` hoy) | El código ya degrada sin romper el flujo (P48), pero el correo real no está saliendo | alta |
| R20 | Implementar `admin.users` (listar/editar rol/estado) | RBAC ya soporta el permiso; falta ruta + UI (ver P52) | hecho (0126) |
| R21 | Definir e implementar Pedidos/Leads/Cotizaciones reales (tablas + API) | Hoy son mocks locales sin persistencia server-side (ver P53); es la brecha más grande para un ERP funcional | alta — diferida a pedido explícito del usuario (fuera de esta pasada) |
| R22 | Actualizar `@types/nodemailer` (v8) a una versión acorde a `nodemailer` v10 instalado | Desalineación de versiones entre tipos y runtime; no causó error hoy pero es frágil | bloqueada — 8.0.1 ya es la versión más reciente publicada de `@types/nodemailer`; no hay nada más nuevo que instalar (verificado con `npm view`) |
| R23 | Revisar/limpiar productos y unidades de prueba visibles en catálogo público (ej. "asdasd", "fsfds", "asdas") | Encontrados durante la auditoría navegando `/catalogo`; no son bug de código, es dato de prueba real ya en la DB | hecho (0126, borrados de Postgres) |

