---
name: fullstack-erp-structure
description: Estructura fullstack del ERP SystemRSV (React+Vite front, Hono API, Postgres, R2). Usar al crear módulos admin, endpoints o capas nuevas del panel.
---

# fullstack-erp-structure

Leer esta skill **antes** de ampliar el ERP o añadir un módulo backend.

## Monorepo mental (carpeta `RosverSac/`)

```
RosverSac/
  src/                 # Front React (Vite) — tienda + /admin
    app/               # Shell, routing, providers
      layout/admin/    # SystemRSV chrome (sidebar, topbar)
      pages/           # Páginas app-level (dashboard)
    features/          # Dominios UI (admin-catalog, auth, …)
    shared/            # UI/hooks/lib sin negocio de un solo módulo
  server/              # API Hono + SQL
    src/
      routes/          # /api/auth, /api/admin, …
      lib/             # db, session, mail, …
      sql/             # migraciones numeradas
    sql/
  public/              # Assets estáticos
```

## Capas (no saltar)

```
UI (features/admin-*) → shared/lib/api → HTTP /api/* → server routes → Postgres
                                                      ↘ R2 (media)
```

- Front **no** importa `server/`.
- Features admin **no** importan internos de otra feature; solo `@/features/<x>`.
- `shared/` no conoce admin ni catálogo de negocio.

## Nuevo módulo ERP (checklist)

1. Feature en `src/features/admin-<nombre>/` (o ampliar existente) + `index.ts` público.
2. Ruta en `App.tsx` bajo `/admin` + item en `admin-nav.ts`.
3. Página con **shell heredado** (regla UX `13-erp-systemrsv-ux`); puede empezar vacía.
4. Si hay datos reales: migración `server/sql/00N_*.sql`, route Hono, tipos Zod.
5. Docs: `docs/features/`, `docs/logica-y-flujos/`, `docs/changes/`, `docs/pendientes/`.
6. Deploy: push `main` + Railway (web+api unificado).

## API admin

- Prefijo `/api/admin/*` protegido por sesión + rol/permiso.
- Cookies httpOnly misma origen (prod Railway).
- Errores JSON consistentes; validación Zod en server.

## UI ERP

- No mezclar estilos de la tienda pública.
- Iconos: `cssvg-icons`.
- Forms: toasts flotantes (regla `10`).

## Anti-patrones

- Segundo framework o carpeta API paralela sin documentar.
- Lógica SQL en el front.
- Módulo admin con navbar rojo de ecommerce.
- Secrets en `VITE_*`.
