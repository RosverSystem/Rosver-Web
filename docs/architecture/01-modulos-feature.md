# Módulos por feature

Cada dominio de producto vive en `RosverSac/src/features/<nombre>/`.

## Anatomía

```
src/features/<nombre>/
  index.ts    ← ÚNICO export público
  ui/         ← páginas, formularios, componentes de la feature
  model/      ← hooks, providers, estado
  api/        ← llamadas HTTP de esta feature
  lib/        ← helpers solo de esta feature
```

## Imports

```ts
// ✅ desde app u otra capa
import { LoginPage } from '@/features/auth'

// ❌ acoplamiento
import { mapUser } from '@/features/auth/api/mappers'
```

## Dónde poner código nuevo

| Pregunta | Destino |
| --- | --- |
| ¿Solo esta feature lo usa? | Dentro de la feature |
| ¿Dos+ features y sin negocio? | `shared/` |
| ¿Contexto global (sesión, theme)? | `app/providers` o model de la feature dueña |
| ¿Mezclar dos features en un archivo? | **No** — partir o subir a shared con cuidado |

## Nacer una feature

Usar skill **create-feature**:

1. Carpetas + `index.ts`.
2. Ficha `docs/features/<nombre>.md` (plantilla).
3. Fila en `docs/features/README.md`.
4. Montar desde `app/` (no desde otra feature).
5. Documentar en `docs/changes/`.
