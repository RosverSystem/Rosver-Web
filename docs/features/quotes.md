# Feature: Cotizaciones

**Slug:** `features/quotes/`  
**Estado:** activa (pipeline admin + cotizar público)

## Propósito

Solicitar cotizaciones desde `/cotizar` y gestionarlas en backoffice con pipeline comercial.

## Pantallas / rutas

| Ruta | Notas |
| --- | --- |
| `/cotizar` | Formulario público |
| `/c/:slug` | Link público 15 días |
| `/cuenta/cotizaciones` | Listado cliente (mocks alineados al pipeline) |
| `/admin/cotizaciones` | Tabla + CRUD iconos + búsqueda |
| `/admin/cotizaciones/vista?codigo-cotizacion=` | Pipeline + productos + evidencias |

## Pipeline

`recibida` → `en_revision` → `respondida` → `aceptada` → `cerrada`

Evidencias R2: `quotes/evidence/{id}/` (aparte de pedidos y catálogo).

## API admin

- `GET /api/admin/quotes` (+ `?code=`)
- `PATCH /api/admin/quotes/:id`
- `DELETE /api/admin/quotes/:id`
- `POST /api/admin/quotes/:id/evidence`

## Verificación

- [x] Admin tabla + vista pipeline
- [x] Migración `027`
- [ ] Cuenta cliente conectada a API real (aún mocks)
