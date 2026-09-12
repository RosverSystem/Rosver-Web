# Feature: Libro de reclamaciones

**Slug:** `features/complaints-book/`  
**Estado:** activa

## Propósito

Libro de reclamaciones digital (Perú) para consumidores: registrar reclamos/quejas con constancia (`REC-AAAA-######`) y gestión en ERP.

## Alcance

- Incluido: formulario público `/libro-reclamaciones`, guardado Postgres, footer con logo, admin `/admin/reclamaciones` (listar / responder / archivar).
- Fuera de alcance: adjuntos R2, notificación email automática al consumidor, integración INDECOPI.

## API pública

Exports desde `@/features/complaints-book`:

| Export | Tipo | Descripción |
| --- | --- | --- |
| `ComplaintsBookPage` | page | Formulario público |
| `AdminComplaintsPage` | page | Bandeja ERP |

## Dependencias

- `shared/`: api, toasts, company, admin-modal/field
- Otras features: ninguna

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/libro-reclamaciones` | `ComplaintsBookPage` | Público |
| `/admin/reclamaciones` | `AdminComplaintsPage` | Admin |

## API HTTP

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/complaints` | Alta pública |
| GET | `/api/complaints/:code` | Consulta estado por código |
| GET | `/api/admin/complaints` | Listado admin |
| PATCH | `/api/admin/complaints/:id` | Respuesta / estado |

## Verificación

- [ ] Footer muestra logo y abre el formulario
- [ ] Envío crea fila y muestra código REC-…
- [ ] Admin ve la hoja y puede responder
