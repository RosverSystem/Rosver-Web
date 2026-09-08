# Cambio: Credenciales R2 S3 guardadas y verificadas

**Fecha:** 2026-09-08  
**Tipo:** chore

## Qué cambió

- `.env`: `CLOUDFLARE_R2_ACCOUNT_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, endpoint.
- Verificación S3: list buckets + put `_healthcheck/rosver.txt` en `rosver-public-media`.
- Doc `08` actualizado (ya no pendiente el paso S3).

## Archivos

- `.env` (local, gitignored)
- `docs/architecture/08-despliegue-y-almacenamiento.md`
- `docs/changes/0085-r2-s3-credentials.md`

## Cómo verificar

- [ ] `.env` tiene las 3 vars S3 + endpoint
- [ ] Objeto healthcheck visible en dashboard R2 → `rosver-public-media`
