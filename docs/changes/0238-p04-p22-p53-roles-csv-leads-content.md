# 0238 — P04 Roles UI · P22 CSV import · P53 Leads + Contenido web

**Fecha:** 2026-09-12  
**Sesión:** Cursor

---

## Qué cambió

### P04 — Admin Roles UI

**Backend**
- `server/src/routes/admin.ts` — nuevo `DELETE /api/admin/roles/:id`; rechaza roles con `is_system = true` con HTTP 403; reasigna usuarios al rol `client` antes de borrar; limpia `role_permissions` antes de eliminar la fila.

**Frontend**
- `src/features/admin-users/ui/AdminRolesPage.tsx` — nueva página ERP:
  - Cards de roles con chips de permisos (máx 12 visibles + "+N más")
  - Badge "sistema" en roles protegidos
  - `AdminModal` "Nuevo rol" con campos código, nombre, descripción y matriz de permisos iniciales
  - `AdminModal` "Editar permisos" (size xl) con checkboxes agrupados por módulo + toggle por módulo (indeterminate)
  - Botón eliminar deshabilitado en roles `is_system`; confirmación + `DELETE /api/admin/roles/:id`
- `src/features/admin-users/index.ts` — exporta `AdminRolesPage`
- `src/app/layout/admin/admin-nav.ts` — nueva entrada "Roles" con icono `Crown` entre Usuarios y Clientes; `adminPageTitle` cubre `/admin/roles`, `/admin/leads`, `/admin/contenido`
- `src/app/App.tsx` — lazy import `AdminRolesPage` + `<Route path="roles" ...>`

---

### P22 — CSV import

**Backend**
- `server/src/lib/elfa-excel-import.ts` — función `parseRosverCsv` (nuevo); cabeceras mapeadas: `sku, name, brandName, code, contentPerBox, unidad_list, unidad_wholesale, docena_list, docena_wholesale, caja_list, caja_wholesale`; produce `ImportProductDraft[]` idéntico al path Excel/JSON; formato `rosver-csv-v1`; tipo `ElfaParseResult.format` extendido.
- `server/src/routes/admin-product-import.ts` — endpoint `/imports/products/parse` acepta `.csv`

**Frontend**
- `src/features/admin-catalog/ui/ProductImportModal.tsx` — `accept` ampliado a `.csv / text/csv`; validación `isImportFile` incluye `.csv`; mensaje de error actualizado; detecta `fmt = 'rosver-csv-v1'`

**Plantilla**
- `server/data/import-templates/rosver-productos-importacion-plantilla.csv` — ejemplo con 4 productos y columnas documentadas

---

### P53 — Leads (contact_messages admin) + Contenido web

**Migración**
- `server/sql/040_contact_leads_content.sql`:
  - `ALTER TABLE contact_messages ADD COLUMN status TEXT DEFAULT 'nuevo' CHECK (...)`, `admin_note TEXT`, `updated_at TIMESTAMPTZ`
  - `CREATE TABLE site_content (key TEXT PRIMARY KEY, value JSONB, updated_at)`

**Backend**
- `server/src/routes/admin-leads.ts` — nuevo router:
  - `GET /api/admin/leads` — lista paginada (max 500); filtra por `?status=`
  - `GET /api/admin/leads/:id` — detalle
  - `PATCH /api/admin/leads/:id` — actualiza `status` y/o `admin_note`
  - `DELETE /api/admin/leads/:id` — elimina fila
- `server/src/routes/admin-content.ts` — nuevo router:
  - `GET /api/content/:key` — público; auto-seed de `home_hero` con slides por defecto en primer GET
  - `GET /api/admin/content` — lista todas las entradas
  - `GET /api/admin/content/:key` — por clave (con auto-seed `home_hero`)
  - `PATCH /api/admin/content/:key` — upsert valor JSONB
- `server/src/index.ts` — registra los 3 nuevos routers (`adminLeadsRoutes`, `adminContentRoutes`, `contentPublicRoutes`)

**Frontend**
- `src/features/admin-leads/ui/AdminLeadsPage.tsx` — reemplaza mocks por API real: tabla de contactos, filtros por estado, modal detalle con edición de estado y nota interna, eliminación con confirmación
- `src/features/admin-content/ui/AdminContentPage.tsx` — reemplaza wireframe por editor real: carga `home_hero` de la API, edita slides (tag, título, subtítulo, botón, enlace), agrega/elimina/reordena slides; `PATCH` al guardar
- `src/app/layout/admin/admin-nav.ts` — nueva entrada "Contactos" (`/admin/leads`)
- `src/app/App.tsx` — lazy imports `AdminLeadsPage`, `AdminContentPage`; rutas `/admin/leads` y `/admin/contenido`

---

## Cómo verificar

| Check | Paso |
| --- | --- |
| Roles UI | Ir a `/admin/roles` → ver tarjetas de roles → crear rol personalizado → editar permisos → eliminar |
| Roles protegidos | Intentar eliminar `admin` o `client` → debe aparecer error 403 |
| CSV import | Ir a `/admin/productos` → Importar → subir `rosver-productos-importacion-plantilla.csv` → debe parsear 4 productos |
| Leads | Enviar formulario de contacto en `/contacto` → ir a `/admin/leads` → ver mensaje → cambiar estado → guardar |
| Contenido | Ir a `/admin/contenido` → editar slides del hero → guardar → verificar en `/` que el hero refleja cambios (requiere que el Home consuma `/api/content/home_hero`) |
| Migración | Railway boot debe correr `040_contact_leads_content.sql` sin error |

---

## Archivos modificados / creados

**Nuevos**
- `server/sql/040_contact_leads_content.sql`
- `server/src/routes/admin-leads.ts`
- `server/src/routes/admin-content.ts`
- `server/data/import-templates/rosver-productos-importacion-plantilla.csv`
- `src/features/admin-users/ui/AdminRolesPage.tsx`

**Modificados**
- `server/src/routes/admin.ts` (DELETE /roles/:id)
- `server/src/routes/admin-product-import.ts` (acepta .csv)
- `server/src/lib/elfa-excel-import.ts` (parseRosverCsv + tipo format)
- `server/src/index.ts` (registra 3 nuevos routers)
- `src/features/admin-users/index.ts`
- `src/features/admin-leads/ui/AdminLeadsPage.tsx`
- `src/features/admin-content/ui/AdminContentPage.tsx`
- `src/app/layout/admin/admin-nav.ts`
- `src/app/App.tsx`

---

## Responsive

- `AdminRolesPage`: grid de cards `sm:grid-cols-2 xl:grid-cols-3`; modal bottom-sheet en móvil vía `AdminModal`
- `AdminLeadsPage`: tabla con columnas ocultas en móvil (`hidden sm:table-cell`, `hidden md:table-cell`); modal scroll interno
- `AdminContentPage`: grid `sm:grid-cols-2` en campos de slide; formulario sin scroll horizontal

---

## Pendientes actualizados

- P04 → **hecho** (0238)
- P22 → **hecho** (0238)
- P53 → **hecho parcial**: Leads + site_content hero → API + UI completos; queda pendiente conectar el Home React a `/api/content/home_hero` en lugar de la constante local `HOME_HERO_SLIDES`.
