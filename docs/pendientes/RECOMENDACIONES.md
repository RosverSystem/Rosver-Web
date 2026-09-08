# Recomendaciones — Rosver Web

Ideas útiles **no pedidas** aún. No implementar solas; esperar OK del usuario.

| ID | Recomendación | Por qué | Prioridad sugerida |
| --- | --- | --- | --- |
| R01 | Rate limit login / OTP en API | Mitigar fuerza bruta | alta |
| R02 | Refresh de sesión / rotación cookie | Seguridad sesiones largas | media |
| R03 | Code-split del bundle JS (>500 kB) | Lighthouse / móvil | media |
| R04 | Página “Olvidé mi clave” + OTP email | Completar auth | alta |
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

