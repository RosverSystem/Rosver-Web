# Cambio: Meta Google site verification (Merchant Center)

**Fecha:** 2026-09-14  
**Tipo:** chore

## Qué cambió

- Se añadió en `index.html` (`<head>`) la etiqueta HTML de verificación de Google Merchant Center / Search Console:
  `google-site-verification` con content `o1M4LucbYyLuIM9__jBgawHSV_wg_-cZO2-exVjxEg8`.
- Versión app `0.1.71`.

## Por qué

Rosa necesita verificar la tienda online de Rosver SAC en Google Merchant Center.

## Cómo

Meta estática en el HTML raíz de Vite (sirve en `/` y en todas las rutas SPA porque el shell es el mismo `index.html`).

## Archivos

- `RosverSac/index.html`
- `RosverSac/package.json`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Tras deploy: ver código fuente de https://rosversac.com/ y buscar `google-site-verification`
- [ ] En Merchant Center → Verificar tienda → confirmar
- [ ] No quitar la meta después de verificar
