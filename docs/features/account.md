# Feature: Área cliente

**Slug:** `features/account/`  
**Estado:** activa

## Propósito

Espacio del cliente autenticado: resumen, pedidos, cotizaciones, perfil personal y datos de empresa (DNI/RUC).

## Rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/cuenta` | `AccountOverviewPage` | Resumen |
| `/cuenta/pedidos` | `AccountOrdersPage` | |
| `/cuenta/pedidos/:id` | `AccountOrderDetailPage` | |
| `/cuenta/cotizaciones` | `ClientQuotesPage` (quotes) | Montada en App |
| `/cuenta/perfil` | `AccountProfilePage` | Nombre, teléfono, avatar, 2FA |
| `/cuenta/empresa` | `AccountCompanyPage` | DNI/RUC + razón social (Decolecta blur) |

## Menú sesión

Solo **Mi perfil** y **Mi empresa** (más SystemRSV si admin). Pedidos/resumen siguen en tabs del layout.

## API pública

| Export | Tipo | Descripción |
| --- | --- | --- |
| `AccountLayout` | layout | Tabs + banner |
| `AccountOverviewPage` | página | |
| `AccountOrdersPage` | página | |
| `AccountOrderDetailPage` | página | |
| `AccountProfilePage` | página | |
| `AccountCompanyPage` | página | Datos fiscales |

## Prefill

Datos de `Mi empresa` (`documentType`, `documentNumber`, `companyName`, `fullName`) + teléfono del perfil alimentan Contacto y Cotizar sin reconsultar Decolecta.

## Verificación

- [x] Layout cuenta con tabs (incl. Mi empresa)
- [x] Menú dropdown reducido
- [x] Guardado vía `PATCH /api/profile`
- [ ] Persistencia de pedidos en Postgres (sigue pendiente)
