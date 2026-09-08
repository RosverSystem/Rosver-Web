# Cambio: Code-split del bundle JS (R03)

**Fecha:** 2026-09-08
**Tipo:** refactor

## Qué cambió

El bundle principal del build de producción tenía un chunk único de **1.35 MB** (396 kB gzip) y Vite avisaba "chunks larger than 500 kB" en cada build. Dos causas concretas:

1. **Todo `/admin/*` se importaba de forma estática** en `App.tsx`, así que el ERP completo (productos, listado de precios, categorías, marcas, ofertas, almacenamiento, usuarios) viajaba en el bundle inicial de la tienda pública, aunque un cliente jamás visite `/admin`.
2. **`jsPDF` + `qrcode`** (usados solo por «Continuar pedido» → descargar PDF / WhatsApp) se importaban de forma estática en `ContinueOrderModal.tsx`, que a su vez se monta en la ruta pública `/carrito` — esas dos libs (~430 kB) viajaban en cada carga de la tienda aunque el cliente nunca pida el PDF.

Cambios:

- `App.tsx`: todas las páginas `Admin*` pasan a `React.lazy(() => import(...).then(m => ({ default: m.X })))`.
- `AdminShell.tsx`: el `<Outlet />` del shell admin se envuelve en `<Suspense fallback={<AdminPageFallback />}>` (fallback simple «Cargando…», mismo tono que el resto del ERP).
- `ContinueOrderModal.tsx`: el import estático de `lib/quote-pdf` (que trae `jsPDF`+`qrcode`) se reemplaza por `import()` dinámico dentro de `makePdf()`/`downloadBlob`, solo cuando el usuario efectivamente pide el PDF o WhatsApp. Solo el tipo `QuotePdfLine` se mantiene como `import type` (se borra en compilación, no pesa runtime).

## Por qué

Recomendación R03 de la auditoría (0125): Lighthouse / rendimiento móvil, regla `06-performance.md` del proyecto (que ya recomendaba explícitamente `React.lazy` + `Suspense` para rutas pesadas que no son del shell inicial).

## Cómo

- No se tocó ninguna lógica de negocio, solo el punto donde se importa el código — mismo comportamiento, distinto momento de carga.
- Se comparó el build antes/después:
  - Antes: 1 chunk de **1,350.84 kB** (396.63 kB gzip), con aviso de Vite.
  - Después: chunk principal de **465.45 kB** (114.36 kB gzip, ya bajo el umbral de 500 kB — el aviso desapareció), más chunks separados: `admin-catalog` (74 kB), `auth` (86 kB, ya lazy por Login/Registro/Reset), `admin-media` (9.4 kB), `admin-users` (7.5 kB), `AdminDashboardPage` (1 kB) — cargados solo al entrar a `/admin/*` — y `quote-pdf` (428 kB) cargado solo al pedir el PDF/WhatsApp desde el carrito.
- Verificado con `npm run build` (producción real, no dev server) servido vía `vite preview` en `:4173`: Home carga y renderiza contenido real sin errores de consola; `/admin/usuarios` sin sesión redirige a `/login` sin errores de consola ni de red rotos (confirma que el chunk lazy de `admin-users` se resuelve bien en producción, no solo en dev donde Vite ya sirve todo por módulo).
- No se probó en este entorno la ruta de descarga real del PDF vía UI (requeriría datos de carrito + flujo completo), pero el cambio es solo de *cuándo* se importa el módulo, no de su contenido — el código de `quote-pdf.ts` no se tocó.

## Archivos

- `RosverSac/src/app/App.tsx`
- `RosverSac/src/app/layout/admin/AdminShell.tsx`
- `RosverSac/src/features/cart/ui/ContinueOrderModal.tsx`
- `docs/pendientes/RECOMENDACIONES.md`

## Cómo verificar

- [x] `npm run build`: ya no aparece el aviso "Some chunks are larger than 500 kB".
- [x] `npm run typecheck:server`... n/a (cambio 100% frontend); `tsc -b` (parte del build) sin errores.
- [x] `npm run lint` sin errores nuevos.
- [x] Build de producción servido con `vite preview`: Home renderiza contenido real, sin errores de consola.
- [x] `/admin/usuarios` sin sesión en el build de producción: redirige a `/login` sin errores de consola ni chunks rotos.
- [ ] _(No probado en este entorno)_ Flujo completo de descarga de PDF desde «Continuar pedido» en el carrito con datos reales.
