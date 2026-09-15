# Cambio: Política de devoluciones pública

**Fecha:** 2026-09-14  
**Tipo:** feature

## Qué cambió

- Nueva página pública `/politica-de-devoluciones` con política de devoluciones/cambios de ROSVER S.A.C. (plazo 7 días, condiciones, costos, reembolsos, contacto).
- Alias `/return-policy` → redirect.
- Enlace en el footer (bloque Contacto).
- Feature `features/legal/`. Versión `0.1.72`.

## Por qué

Google Merchant Center exige una URL de política de devoluciones para verificar la tienda.

## Cómo

Página estática React con datos de `ROSVER_COMPANY`; sin API.

## Archivos

- `RosverSac/src/features/legal/`
- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/Footer.tsx`
- `docs/features/legal.md`

## Cómo verificar

- [ ] Abrir https://rosversac.com/politica-de-devoluciones
- [ ] Pegar esa URL en Merchant Center → Devoluciones
- [ ] Footer muestra el enlace
- [ ] Móvil / tablet / desktop: texto legible
