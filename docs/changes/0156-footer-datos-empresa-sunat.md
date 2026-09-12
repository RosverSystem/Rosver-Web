# Cambio: Footer por vistas + datos empresa SUNAT

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Footer reorganizado en **Navegación** (links + categorías vivas), **Datos empresa** (SUNAT) y **Contacto**.
- `ROSVER_COMPANY` alineado a consulta SUNAT: razón social `ROSVER S.A.C.`, RUC `20609530902`, domicilio Jr. Cusco 774 Int. 101 Barrios Altos, estado ACTIVO / HABIDO.
- Página `/contacto`: panel con correo, domicilio fiscal y bloque RUC.

## Por qué

Rosa pidió organizar por vistas (navegación, datos empresa —foto SUNAT— y contacto).

## Cómo

- Fuente única `shared/lib/company.ts` para footer, contacto y PDF.
- Categorías del footer desde `useCatalog()` (no solo mocks).

## Archivos

- `RosverSac/src/shared/lib/company.ts`
- `RosverSac/src/app/layout/Footer.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Pie: columnas Navegación / Datos empresa / Contacto
- [ ] RUC y dirección Int. 101 visibles en footer y `/contacto`
- [ ] Links de navegación y WhatsApp siguen OK
- [ ] _(UI)_ Móvil: grid 2 cols; desktop 4 cols
- [ ] _(UI)_ Sin assets nuevos
