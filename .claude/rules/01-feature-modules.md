---
paths:
  - "RosverSac/src/features/**"
---

# Feature modules

Cada feature vive en `RosverSac/src/features/<nombre>/`:

```
index.ts    ← único export público
ui/
model/
api/
lib/
```

## Imports

```ts
// ✅
import { LoginPage } from '@/features/auth'

// ❌
import { mapUser } from '@/features/auth/api/mappers'
```

## Reglas

- Montar features desde `app/`, no desde otra feature.
- Una feature por archivo; no mezclar dos dominios.
- Código usado solo por esta feature → dentro de la feature.
- Código genérico reutilizable → `shared/`.
- Feature nueva: skill **create-feature** + ficha en `docs/features/`.
- UI de la feature: responsive móvil / tablet / desktop.
