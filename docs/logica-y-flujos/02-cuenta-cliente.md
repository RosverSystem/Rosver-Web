# Flujo — Área cuenta cliente

## Rutas

| Ruta | Contenido hoy | Lógica |
| --- | --- | --- |
| `/cuenta` | Resumen | Requiere sesión; saludo con `user.fullName` |
| `/cuenta/pedidos` | Historial | Mock hasta API pedidos |
| `/cuenta/cotizaciones` | Lista | Mock hasta API quotes |
| `/cuenta/perfil` | Datos + avatar | `GET/PATCH /api/profile`; teléfono obligatorio |

## Header “Mi cuenta”

| Estado | UI |
| --- | --- |
| Visitante | Icono genérico → `/login` |
| Logueado | Avatar + **primer nombre** → menú: Mi cuenta, Perfil, Cerrar sesión (+ Admin si admin). Logout **solo** en el menú. |

## Datos obligatorios perfil ecommerce

- Nombre, email (solo lectura), **teléfono**, avatar (default SVG o futuro R2).
- Opcional: empresa, tipo/nº documento.
