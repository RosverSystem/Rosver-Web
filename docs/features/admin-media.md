# Feature: admin-media (Almacenamiento R2)

**Slug:** `features/admin-media/`  
**Estado:** activa

## Propósito

Biblioteca de medios en Cloudflare R2 desde el ERP: ver carpetas, previsualizar en modal, subir y borrar.

## Alcance

- Incluido: listado por carpeta (productos, categorías, marcas, avatares), grid, modal preview, subir imagen, copiar URL, eliminar.
- Fuera de alcance: bucket privado, edición de imágenes, CDN cache purge.

## API pública

Exports desde `@/features/admin-media`:

| Export | Tipo | Descripción |
| --- | --- | --- |
| `AdminStoragePage` | page | `/admin/almacenamiento` |

## API HTTP

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/api/admin/storage` | Lista objetos (`prefix`, `q`, `cursor`) |
| DELETE | `/api/admin/storage` | Body `{ key }` |
| POST | `/api/admin/storage/upload` | FormData file + folder |

## Dependencias

- `shared/`: `AdminModal`, `AdminField`, toasts, `api`
- R2: `server/src/lib/r2.ts`

## Pantallas / rutas

| Ruta | Componente | Notas |
| --- | --- | --- |
| `/admin/almacenamiento` | `AdminStoragePage` | ERP SystemRSV |

## Verificación

- [ ] Sidebar muestra Almacenamiento
- [ ] Grid de imágenes por carpeta
- [ ] Clic abre modal con preview
- [ ] Subir / eliminar / copiar URL
- [ ] Móvil / tablet / desktop
