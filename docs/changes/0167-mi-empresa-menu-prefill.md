# Cambio: Menú Mi perfil + Mi empresa (prefill contacto/cotizar)

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Dropdown de sesión: solo **Mi perfil** y **Mi empresa** (más SystemRSV si admin).
- Nueva vista `/cuenta/empresa`: DNI/RUC con búsqueda al blur o lupa; guarda razón social / nombre completo.
- Perfil personal ya no edita RUC/empresa (enlace a Mi empresa).
- Contacto y Cotizar rellenan desde el perfil guardado y **no vuelven a llamar Decolecta** si el documento ya está configurado.

## Por qué

Pedido UX: un solo acceso a perfil, datos fiscales en un solo lugar, reutilizar en formularios públicos.

## Cómo

- Persistencia existente: `users.company_name`, `document_type`, `document_number`, `full_name`.
- Helper compartido `peru-doc.ts` (validación DNI 8 / RUC 10|20…).
- Prefill en Contacto con `lastLookupRef` para saltar Decolecta.

## Archivos

- `RosverSac/src/features/account/ui/AccountCompanyPage.tsx`
- `RosverSac/src/features/account/ui/AccountProfilePage.tsx`
- `RosverSac/src/features/account/ui/AccountLayout.tsx`
- `RosverSac/src/features/auth/ui/SessionAccountMenu.tsx`
- `RosverSac/src/features/contact/ui/ContactPage.tsx`
- `RosverSac/src/features/quotes/ui/QuoteRequestPage.tsx`
- `RosverSac/src/shared/lib/peru-doc.ts`
- `RosverSac/src/app/App.tsx`
- `docs/changes/0167-mi-empresa-menu-prefill.md`
- `docs/features/account-empresa.md`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Menú cuenta: solo Mi perfil + Mi empresa (+ admin)
- [ ] `/cuenta/empresa`: RUC → blur → razón social; DNI → nombre; Guardar
- [ ] Con sesión: `/contacto` trae RUC/nombre/teléfono/correo sin consultar Decolecta
- [ ] `/cotizar` trae razón social / documento / teléfono
- [ ] Sin teléfono en perfil: aviso al guardar empresa
- [ ] _(Si UI)_ móvil / tablet / desktop OK
