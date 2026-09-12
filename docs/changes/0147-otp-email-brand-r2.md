# Cambio: OTP 5 min, email PayPal-like, brand en R2

**Fecha:** 2026-09-09  
**Tipo:** feature

## Qué cambió

- Login: icono llave en **rojo** (`text-rosver-red`).
- OTP: validez **5 minutos** (antes 10).
- Correo OTP rediseñado (logo, barra roja, código en tarjeta, CTA, pie) estilo profesional tipo PayPal.
- Assets de marca subidos a **Cloudflare R2** (`brand/…`); login/registro/PDF/correo los consumen por URL `/api/media/brand/…` (no como critical path del bundle).
- Script: `npx tsx server/scripts/upload-brand-assets.ts`

## Por qué

Mejor branding del login y del correo; OTP más corto; imágenes pesadas fuera del `public` servido por Vite.

## Cómo

- `mail.ts` HTML table-friendly + `absoluteBrandUrl` (prod Railway si no hay `R2_PUBLIC_BASE_URL`, para que Gmail cargue el logo).
- Front: `brandMediaPath()` → proxy `/api` → R2.

## Archivos

- `RosverSac/server/src/lib/otp.ts`
- `RosverSac/server/src/lib/mail.ts`
- `RosverSac/server/src/lib/brand-assets.ts`
- `RosverSac/server/scripts/upload-brand-assets.ts`
- `RosverSac/src/shared/lib/brand-assets.ts`
- `RosverSac/src/features/auth/ui/LoginPage.tsx`
- `RosverSac/src/features/auth/ui/RegisterPage.tsx`
- `RosverSac/src/features/cart/lib/quote-pdf.ts`
- `docs/pendientes/PENDIENTES.md`

## Cómo verificar

- [ ] Login: llave roja; hero desde `/api/media/brand/login-hero-rosver.webp`
- [ ] Pedir OTP → correo con logo + “Válido 5 minutos”
- [ ] Código expirado tras 5 min
- [ ] Móvil / tablet / desktop login
