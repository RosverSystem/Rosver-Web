# Recomendaciones — Rosver Web

Ideas útiles **no pedidas** aún. No implementar solas; esperar OK del usuario.

| ID | Recomendación | Por qué | Prioridad sugerida |
| --- | --- | --- | --- |
| R01 | Rate limit login / OTP en API | Mitigar fuerza bruta | hecho (0125, 5 fallos/10min → bloqueo 5min por email+IP, en memoria) |
| R02 | Refresh de sesión / rotación cookie | Seguridad sesiones largas | media |
| R03 | Code-split del bundle JS (>500 kB) | Lighthouse / móvil | media |
| R04 | Página “Olvidé mi clave” + OTP email | Completar auth | hecho (0125, ver P05) |
| R05 | Menú cuenta en header (perfil, logout, admin) | UX sesión | hecho (con P08) |
| R06 | Audit log de logins | ERP / compliance | baja |
| R07 | Tests e2e login (Playwright) | Regresión auth | media |
| R08 | Separar servicio API si el tráfico crece | Escala | baja |
| R09 | Widgets KPIs en dashboard ERP | Valor gestión | media |
| R10 | Command palette (⌘K) en top bar ERP | Productividad | parcial | Hay search ⌘K; palette full opcional |
| R11 | Tooltips en sidebar colapsada | Accesibilidad iconos | baja |
| R12 | Historial de precios (auditoría) en ERP | Compliance / márgenes | media |
| R14 | Seed categorías demo con tagline/puntos/imagen | Arranque tienda sin mocks | hecho | Migración `007` |
| R15 | Logo marca en admin (upload R2) | Filtro + marquee con logo real | hecho | v0.1.15 |
| R17 | Categorías / productos: mismos modales + media picker | Paridad UX con marcas | hecho | Catálogo admin en AdminModal (0119: cats, unidades, productos wizard, precios) |
| R18 | Rate limiter de login en Redis (no en memoria) | Si el API corre en >1 instancia, el límite actual es por proceso | media |
| R19 | Revisar credenciales SMTP en el entorno (falla con `535 auth failed` hoy) | El código ya degrada sin romper el flujo (P48), pero el correo real no está saliendo | alta |
| R20 | Implementar `admin.users` (listar/editar rol/estado) | RBAC ya soporta el permiso; falta ruta + UI (ver P52) | hecho (0125) |
| R21 | Definir e implementar Pedidos/Leads/Cotizaciones reales (tablas + API) | Hoy son mocks locales sin persistencia server-side (ver P53); es la brecha más grande para un ERP funcional | alta |
| R22 | Actualizar `@types/nodemailer` (v8) a una versión acorde a `nodemailer` v10 instalado | Desalineación de versiones entre tipos y runtime; no causó error hoy pero es frágil | baja |
| R23 | Revisar/limpiar productos y unidades de prueba visibles en catálogo público (ej. "asdasd", "fsfds", "asdas") | Encontrados durante la auditoría navegando `/catalogo`; no son bug de código, es dato de prueba real ya en la DB | media |

