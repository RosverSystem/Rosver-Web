# Cambio: Contacto — mapa + badge de sesión

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Quitado el badge fijo **“Sin cuenta”** (confundía si había sesión). Si hay login muestra “Hola, {nombre}”.
- Frame de Google Maps en `/contacto` para **Jirón Cusco 774, Lima 15001** + botón “Abrir en Google Maps”.

## Por qué

Rosa estaba logueada y veía “Sin cuenta”; también pidió el iframe de ubicación.

## Cómo

- Badge según `useAuth().user`.
- Embed vía `ROSVER_COMPANY.mapsEmbedUrl` (sin API key).

## Archivos

- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/src/shared/lib/company.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Logueada: badge “Hola, …” (no “Sin cuenta”)
- [ ] Sin sesión: sin badge
- [ ] Mapa visible bajo el formulario; enlace abre Maps
- [ ] _(UI)_ Móvil / tablet / desktop
