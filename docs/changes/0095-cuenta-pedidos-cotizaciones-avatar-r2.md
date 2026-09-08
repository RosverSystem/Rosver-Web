# Cambio: pedidos/cotizaciones estilo marketplace + avatar R2

**Fecha:** 2026-09-08  
**Tipo:** feature | fix  
**Versión:** 0.1.4  
**Deploy:** https://rosver-web-production.up.railway.app

## Qué cambió

- Pedidos y cotizaciones con fotos de ítems, cards y **tracker de estados** (tipo Falabella).
- Resumen de cuenta con miniaturas.
- Perfil: **subir foto personalizada** → Cloudflare R2 (`POST /api/profile/avatar`); lectura vía `/api/media/…` si no hay `R2_PUBLIC_BASE_URL`.
- Seed ya no pisa avatares custom.
- Dependencia `@aws-sdk/client-s3`.

## Por qué

Las listas demo se veían planas; el perfil solo tenía avatares SVG.

## Archivos

- `features/account/*`, `features/quotes/*`, `shared/ui/status-stepper.tsx`
- `server/src/lib/r2.ts`, `routes/profile.ts`, `routes/media.ts`, `config.ts`, `seed.ts`
- Docs `04`, `08`, pendientes, change

## Cómo verificar

- [ ] `/cuenta/pedidos` muestra fotos + barra de estados
- [ ] `/cuenta/cotizaciones` igual
- [ ] Perfil → Subir foto → aparece en header tras guardar/refresh
- [ ] Móvil / tablet / desktop OK
- [ ] Railway tiene vars R2 (si no, upload responde 503)
