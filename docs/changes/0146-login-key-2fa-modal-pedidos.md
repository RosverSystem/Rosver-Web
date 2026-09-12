# Cambio: login key + separador o, 2FA modal, Mis pedidos

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Login: icono teléfono → **llave**; separador de línea con **o** entre «Empezar» y los botones circulares.
- Perfil: vincular / desvincular autenticador abre **modal** (QR + separador «o» + clave manual).
- Cuenta: pestaña y vista **Mis pedidos o compras** (filtros por estado, totales, vacío con CTA al catálogo).
- Menú del header (Andrés): enlace **Mis pedidos** → `/cuenta/pedidos`.
- Menú cuenta desktop/móvil: iconos junto a cada ítem (casa, bolsa, grupo, monitor, salir) + avatar en cabecera.

## Por qué

Pedido de UX en login, flujo 2FA más limpio en modal, y claridad en pedidos/compras del área cliente.

## Cómo

- Key SVG inline en login (cssvg no tiene icono Key).
- Modal estilo overlay blur como verificación OTP.
- Listado de pedidos con chips de filtro y empty state.

## Archivos

- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/account/ui/AccountProfilePage.tsx`
- `RosverSac/src/features/auth/ui/SessionAccountMenu.tsx`
- `RosverSac/src/features/account/ui/AccountOrdersPage.tsx`
- `RosverSac/src/features/account/ui/AccountLayout.tsx`
- `RosverSac/src/features/account/ui/AccountOverviewPage.tsx`
- `RosverSac/src/features/account/ui/AccountOrderDetailPage.tsx`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Menú Andrés (header): aparece **Mis pedidos** entre Mi cuenta y Perfil
- [ ] `/login`: separador «o» + icono llave junto a Google
- [ ] `/cuenta/perfil`: «Vincular autenticador» abre modal con QR
- [ ] `/cuenta/pedidos`: título Mis pedidos o compras, filtros, responsive
- [ ] Móvil / tablet / desktop
