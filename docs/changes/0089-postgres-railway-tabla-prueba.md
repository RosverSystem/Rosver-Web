# Cambio: Postgres Railway online + tabla de prueba

**Fecha:** 2026-09-08  
**Tipo:** chore | docs

## Qué cambió

- Eliminado Postgres roto (imagen sin template / fallos de deploy) y servicios basura (`web`, `humorous-enchantment`).
- Desplegado Postgres oficial vía `templateDeployV2` (`template(code: "postgres")`) → servicio **Online** (`d07bb6a5-…`).
- TCP proxy público: `altaria.proxy.rlwy.net:17586` → `5432`.
- `DATABASE_URL` referenciado en `Rosver-Web` como `${{Postgres.DATABASE_URL}}`.
- Credenciales + `DATABASE_PUBLIC_URL` en `.env` local (gitignored).
- Tabla temporal `rosver_test_ping` creada e insert de prueba (se borrará cuando se defina el esquema).

## Por qué

Hacer disponible la base para la fase lógica; verificar conectividad con una tabla desechable.

## Cómo

Template oficial Railway (volumen + vars `POSTGRES_*` / `DATABASE_URL`). Conexión local por TCP proxy + `pg` (Node). No cablear a la SPA (`VITE_*`).

## Archivos

- `.env` (local, no commit)
- `RosverSac/.env.example`
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/changes/0089-postgres-railway-tabla-prueba.md`

## Cómo verificar

- [x] Servicio `Postgres` Online en Railway
- [x] Solo quedan `Rosver-Web` + `Postgres` en el proyecto
- [x] `SELECT` sobre `rosver_test_ping` OK vía TCP proxy
- [ ] Cuando el usuario defina el esquema: `DROP TABLE rosver_test_ping;`
- [ ] Backend futuro usa `DATABASE_URL` interno (no el proxy público en producción de app)
