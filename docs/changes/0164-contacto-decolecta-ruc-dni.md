# Cambio: Contacto — DNI/RUC con Decolecta

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Formulario de contacto: select **DNI / RUC**, número, botón Buscar.
- Si RUC: campo **Razón social** (opcional, auto con Decolecta).
- Si DNI: auto **nombre y apellidos**.
- Proxy server `POST /api/peru/lookup` (key solo en `DECOLECTA_API_KEY`, nunca `VITE_*`).

## Por qué

Pedido de Rosa: completar datos desde Decolecta al elegir documento.

## Cómo

- Auth Decolecta: `Authorization: Bearer …`
- DNI → `GET /v1/reniec/dni?numero=`
- RUC → `GET /v1/sunat/ruc?numero=`

## Archivos

- `RosverSac/server/src/routes/peru.ts`
- `RosverSac/server/src/config.ts`, `index.ts`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/.env.example`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Reiniciar API para cargar `DECOLECTA_API_KEY`
- [ ] DNI 8 dígitos → Buscar → nombre
- [ ] RUC 11 dígitos → Buscar → razón social
- [ ] Key no aparece en el bundle del front
- [ ] _(UI)_ Móvil / tablet / desktop
