# Cambio: Scroll de selects — lista primero, luego página

**Fecha:** 2026-09-10  
**Tipo:** fix

## Qué cambió

- Con el select abierto (dep/prov/dist, etc.): la rueda mueve la **lista**.
- Al llegar al tope o al final de la lista, la rueda **sigue moviendo la página**.
- Helper compartido `attachNestedScrollWheel` (también en sugerencias de dirección).

## Por qué

Lenis capturaba la rueda y la página se movía sin scrollear el dropdown (o al revés quedaba bloqueada).

## Cómo

- Listener `wheel` en capture: si la lista aún puede scrollear → `preventDefault` + scroll manual.
- Si ya está al límite → no interceptar → Lenis/página.

## Archivos

- `RosverSac/src/shared/lib/nested-scroll-wheel.ts`
- `RosverSac/src/shared/ui/select-combobox.tsx`
- `RosverSac/src/shared/ui/peru-address-suggest.tsx`

## Cómo verificar

- [ ] `/cotizar` → Elegir a mano → abrir Departamento → rueda baja la lista
- [ ] Al final de la lista, seguir con la rueda → baja la página
- [ ] Móvil / tablet / desktop
