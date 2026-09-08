# Cambio: Token Cloudflare + buckets R2 creados

**Fecha:** 2026-09-07  
**Tipo:** chore

## Qué cambió

- `CLOUDFLARE_API_TOKEN` guardado en `.env` (gitignored); verify → **active**.
- Account ID detectado y guardado.
- Buckets creados: `rosver-public-media` (CORS GET/HEAD), `rosver-private-docs`.
- Bucket legacy existente: `rosverimg`.
- Docs `08` actualizados con estado real.

## Limitación

No se pueden generar Access Key / Secret S3 solo con el API Token de perfil (API 404/403). Hace falta un **R2 API Token** del dashboard (un paso) para upload/download S3 automático.

## Archivos

- `.env` (local)
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/changes/0084-cloudflare-r2-buckets.md`
- `.gitignore` (`.r2-token-response.json`)

## Cómo verificar

- [ ] Dashboard R2: aparecen los 3 buckets
- [ ] `.env` tiene `CLOUDFLARE_*` y nombres de bucket
- [ ] Crear R2 S3 keys en dashboard y pegar en `.env` para uploads
