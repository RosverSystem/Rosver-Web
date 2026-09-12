# Cambio: Postgres local + arranque dev

**Fecha:** 2026-09-09  
**Tipo:** chore

## Qué cambió

- Creada base local PostgreSQL 18: DB `rosver_local`, usuario `rosver`.
- `RosverSac/.env` (gitignored) con `DATABASE_URL` apuntando a localhost.
- Aplicadas migraciones `001`–`011` + seed RBAC (admin/cliente).
- Fix SSL en `server/src/db.ts`: también trata `127.0.0.1` / `::1` como local (sin SSL).
- Arrancados `npm run dev` (:5173) y `npm run dev:api` (:8787).

## Por qué

Hacer desarrollo local con Postgres propio, sin depender del TCP proxy de Railway.

## Cómo

- Postgres Windows `postgresql-x64-18` ya instalado.
- Rol/DB creados con `psql`; auth local SCRAM.
- `npm run db:setup` → migrate + seed.
- Redis no obligatorio en local (API degrada a Postgres / memoria).

## Archivos

- `RosverSac/.env` (local, no commit)
- `RosverSac/server/src/db.ts`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `RosverSac/.env.example`
- `docs/pendientes/PENDIENTES.md`
- `docs/changes/0141-postgres-local-setup.md`

## Cómo verificar

- [x] `psql -U rosver -h localhost -d rosver_local` conecta
- [x] `npm run db:setup` aplica 11 migraciones + seed
- [x] `GET http://localhost:8787/api/health` → `{"ok":true,...}`
- [x] `http://localhost:5173` responde 200
- [ ] Login admin con seed local (ver `.env` / defaults en `config.ts`)
