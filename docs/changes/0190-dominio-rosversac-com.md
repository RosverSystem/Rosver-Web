# Cambio: Dominio canónico rosversac.com (docs despliegue)

**Fecha:** 2026-09-10  
**Tipo:** docs

## Qué cambió

- Se documentó **rosversac.com** como dominio canónico de producción.
- Stack acordado: Railway (web/API/Postgres/Redis) + Cloudflare CDN Free + R2.
- Checklist de cutover DNS/CDN/SSL/`APP_URL` en `08` §4.
- Trabajo diario sigue en **local** (`localhost:5173` / `:8787`); cutover pendiente.
- `.env.example` con comentarios `APP_URL` / `CORS_ORIGIN` local vs `https://rosversac.com`.

## Por qué

Rosa definió el dominio de producto y el enfoque de despliegue fácil; aún no se activa DNS/CDN.

## Cómo

Solo documentación y ejemplo de env. Sin cambios de runtime ni deploy.

## Archivos

- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `RosverSac/.env.example`
- `docs/changes/0190-dominio-rosversac-com.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] En `08` aparece `rosversac.com` y §4 con checklist cutover
- [ ] Pendiente P99 refleja cutover no hecho
- [ ] Local sigue siendo el entorno de trabajo diario
