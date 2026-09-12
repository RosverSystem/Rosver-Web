# Cambio: Footer limpio — sin categorías, sin sesión, Maps

**Fecha:** 2026-09-09  
**Tipo:** fix

## Qué cambió

- Quitada la lista **Categorías** del footer.
- Quitado el menú de cuenta (nombre de sesión, ej. “Wilson”) de Navegación.
- Quitados badges ACTIVO / HABIDO.
- Dirección pública: **Jirón Cusco 774, Lima 15001**, enlace a Google Maps.

## Por qué

Pedido de Rosa: footer sin categorías ni cuenta; dirección usable en Maps.

## Cómo

- `ROSVER_COMPANY.localAddress` + `mapsUrl`.
- Footer solo: marca · Navegación · Datos empresa · Contacto.

## Archivos

- `RosverSac/src/shared/lib/company.ts`
- `RosverSac/src/app/layout/Footer.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`

## Cómo verificar

- [ ] Footer sin “Categorías” ni nombre de usuario
- [ ] Clic en dirección abre Google Maps
- [ ] Sin ACTIVO/HABIDO
- [ ] _(UI)_ Móvil / tablet / desktop OK
